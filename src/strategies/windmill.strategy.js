import { ethers } from "ethers";

const WINDMILL_EXCHANGE_ABI = [
  "function paused() view returns (bool)",
  "function getOrdersByPair(address tokenA, address tokenB, uint256 cursor, uint256 limit) view returns (uint256[])",
  "function getOrder(uint256 orderId) view returns (tuple(uint256 id, address maker, bool isBuy, bool active, address tokenIn, address tokenOut, uint256 amountIn, uint256 remainingIn, uint256 startPrice, int256 slope, uint256 minPrice, uint256 maxPrice, uint256 createdAt, uint256 expiry))",
  "function currentPrice(uint256 orderId, uint256 timestamp) view returns (uint256)",
  "function matchOrders(uint256 buyOrderId, uint256 sellOrderId, uint256 deadline)",
  "event OrderCreated(uint256 indexed orderId, address indexed maker, address indexed tokenIn, address tokenOut, uint256 amountIn, bool isBuy)"
];

const pairsMap = new Map([
  ["0x5fbdb2315678afecb367f032d93f642f64180aa3-0xe7f1725e7734ce288f8367e1bb143e90bb3f0512", {
    token0: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    token1: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  }],
  ["0x0165878a594ca255338adfa4d48449f69242eb8f-0xa513e6e4b8f2a923d98304ec87f64353c4d5c853", {
    token0: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    token1: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"
  }],
  ["0x7b79995e5f793a07bc00c21412e50ecae098e7f9-0x1c7d4b196cb0c7b01d743fbc6116a902379c7238", {
    token0: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
    token1: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
  }]
]);

/**
 * @param {string} tokenA
 * @param {string} tokenB
 * @returns {string}
 */
function getPairKey(tokenA, tokenB) {
  const [t0, t1] = tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];
  return `${t0.toLowerCase()}-${t1.toLowerCase()}`;
}

/**
 * Waits for transaction receipt with bounded timeout and abort signal
 * to prevent hanging listeners or blocking shutdown.
 *
 * @param {{
 *   tx: any;
 *   activeProvider: any;
 *   signal?: AbortSignal;
 *   pollIntervalMs: number;
 * }} params
 */
async function waitForReceiptOrPoll({ tx, activeProvider, signal, pollIntervalMs }) {
  if (signal?.aborted) return null;

  // Direct check first via getTransactionReceipt (does not retain persistent event listeners)
  if (activeProvider && tx?.hash) {
    try {
      const receipt = await activeProvider.getTransactionReceipt(tx.hash);
      if (receipt) return receipt;
    } catch {
      // ignore transient error
    }
  }

  // If tx.wait is available, bound it by pollIntervalMs and abort signal
  if (typeof tx.wait === "function") {
    let timeoutId;
    let abortListener;

    const timeoutPromise = new Promise((resolve) => {
      timeoutId = setTimeout(() => resolve(null), pollIntervalMs);
    });

    const abortPromise = new Promise((resolve) => {
      if (signal?.aborted) {
        resolve(null);
        return;
      }
      abortListener = () => resolve(null);
      signal?.addEventListener("abort", abortListener, { once: true });
    });

    try {
      const waitPromise = tx.wait(1, pollIntervalMs);
      waitPromise?.catch?.(() => {});

      return await Promise.race([
        waitPromise,
        timeoutPromise,
        abortPromise
      ]);
    } catch (err) {
      if (err?.code === "TIMEOUT" || err?.message?.toLowerCase().includes("timeout")) {
        return null;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      if (signal && abortListener) {
        signal.removeEventListener("abort", abortListener);
      }
    }
  }

  return null;
}

/**
 * Monitors a submitted transaction until a terminal state (mined or reverted)
 * is verified, retaining reservations on transient/nonterminal RPC errors
 * and supporting clean cancellation during shutdown.
 *
 * @param {{
 *   tx: any;
 *   buyIdStr: string;
 *   sellIdStr: string;
 *   provider: any;
 *   logger: any;
 *   pendingOrderIds: Set<string>;
 *   signal?: AbortSignal;
 *   maxAttempts?: number;
 *   pollIntervalMs?: number;
 * }} params
 */
async function monitorPendingMatch({
  tx,
  buyIdStr,
  sellIdStr,
  provider,
  logger,
  pendingOrderIds,
  signal,
  maxAttempts = 15,
  pollIntervalMs = 2000
}) {
  const activeProvider = provider ?? tx?.provider;
  let settled = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (signal?.aborted) {
      return;
    }

    try {
      const receipt = await waitForReceiptOrPoll({
        tx,
        activeProvider,
        signal,
        pollIntervalMs
      });
      if (receipt) {
        settled = true;
        break;
      }
    } catch (err) {
      if (signal?.aborted) {
        return;
      }
      // In ethers, an on-chain transaction revert includes err.receipt (terminal state)
      if (err?.receipt) {
        logger.debug?.(
          `Match tx ${tx?.hash} reverted on-chain at block ${err.receipt.blockNumber ?? "unknown"}`
        );
        settled = true;
        break;
      }

      // Nonterminal error (e.g., transient RPC timeout / HTTP 502 / network disconnect)
      logger.debug?.(
        `Transient error polling receipt for tx ${tx?.hash} (attempt ${attempt}/${maxAttempts}): ${err?.message || err}`
      );
    }

    if (attempt < maxAttempts && !settled) {
      if (signal?.aborted) {
        return;
      }
      await new Promise((resolve) => {
        let timeoutId;
        const onAbort = () => {
          clearTimeout(timeoutId);
          resolve();
        };
        timeoutId = setTimeout(() => {
          signal?.removeEventListener("abort", onAbort);
          resolve();
        }, pollIntervalMs);
        signal?.addEventListener("abort", onAbort, { once: true });
      });
    }
  }

  // Clear reservations only after establishing terminal state (or giving up after max attempts when not shutting down)
  if (settled || !signal?.aborted) {
    pendingOrderIds.delete(buyIdStr);
    pendingOrderIds.delete(sellIdStr);
  }
}

export function createWindmillStrategy() {
  /** @type {number | null} */
  let lastScannedBlock = null;
  /** @type {Set<string>} */
  const pendingOrderIds = new Set();
  const abortController = new AbortController();

  return {
    name: "windmill",
    requiresSigner: true,
    requiresContract: true,
    abi: WINDMILL_EXCHANGE_ABI,

    stop() {
      abortController.abort();
    },

    /**
     * @param {{
     *   now: number;
     *   provider: any;
     *   contract: any;
     *   logger: any;
     * }} params
     */
    async getWorkItems({ now, provider, contract, logger }) {
      const allMatches = [];
      if (await contract.paused()) {
        logger.warn("Exchange is paused. Skipping cycle.");
        return [];
      }

      // Discover pairs from events safely
      let deployBlock = 0;
      if (process.env.DEPLOY_BLOCK !== undefined && process.env.DEPLOY_BLOCK !== "") {
        const deployBlockStr = process.env.DEPLOY_BLOCK.trim();
        if (!/^\d+$/.test(deployBlockStr)) {
          throw new Error(`Invalid DEPLOY_BLOCK: "${process.env.DEPLOY_BLOCK}". Must be a valid non-negative block number.`);
        }
        deployBlock = parseInt(deployBlockStr, 10);
      }

      try {

        const currentBlock = await provider.getBlockNumber();
        const startBlock = lastScannedBlock !== null ? lastScannedBlock + 1 : deployBlock;

        if (startBlock <= currentBlock) {
          const maxChunk = 2000;
          const toBlock = Math.min(currentBlock, startBlock + maxChunk);
          const logs = await contract.queryFilter(contract.filters.OrderCreated(), startBlock, toBlock);
          for (const log of logs) {
            const { tokenIn, tokenOut } = log.args || {};
            if (tokenIn && tokenOut) {
              const key = getPairKey(tokenIn, tokenOut);
              if (!pairsMap.has(key)) {
                pairsMap.set(key, {
                  token0: tokenIn.toLowerCase() < tokenOut.toLowerCase() ? tokenIn : tokenOut,
                  token1: tokenIn.toLowerCase() < tokenOut.toLowerCase() ? tokenOut : tokenIn
                });
              }
            }
          }
          lastScannedBlock = toBlock;
        }
      } catch (err) {
        logger.warn(`Event scanning warning: ${err?.message || err}`);
      }

      const matchedBuyIds = new Set();
      const matchedSellIds = new Set();

      for (const [key, pair] of pairsMap.entries()) {
        try {
          // Fetch active order IDs
          const orderIds = [];
          let cursor = 0;
          const limit = 500;
          while (true) {
            const page = await contract.getOrdersByPair(pair.token0, pair.token1, cursor, limit);
            orderIds.push(...page);
            if (page.length < limit) break;
            cursor += limit;
          }

          if (orderIds.length > 0) {
            logger.info(`Pair ${key} orderIds: [${orderIds.map(id => id.toString()).join(", ")}]`);
          }

          // Fetch full order data and check expiration
          const eligibleOrders = [];
          for (const id of orderIds) {
            const idStr = id.toString();
            if (pendingOrderIds.has(idStr)) {
              logger.debug(`Order ${idStr} is pending settlement, skipping`);
              continue;
            }
            try {
              const order = await contract.getOrder(id);
              if (!order.active) {
                logger.debug(`Order ${id.toString()} is inactive`);
                continue;
              }
              if (order.expiry !== 0n && BigInt(now) > order.expiry) {
                logger.debug(`Order ${id.toString()} is expired`);
                continue;
              }
              eligibleOrders.push(order);
            } catch (err) {
              logger.debug(`Failed to fetch order ${id.toString()}: ${err?.message || err}`);
            }
          }

          // Fetch current on-chain prices
          const pricedOrders = [];
          for (const order of eligibleOrders) {
            try {
              const price = await contract.currentPrice(order.id, now);
              pricedOrders.push({
                id: order.id,
                maker: order.maker,
                isBuy: Boolean(order.isBuy),
                active: Boolean(order.active),
                tokenIn: order.tokenIn,
                tokenOut: order.tokenOut,
                amountIn: order.amountIn,
                remainingIn: order.remainingIn,
                startPrice: order.startPrice,
                slope: order.slope,
                minPrice: order.minPrice,
                maxPrice: order.maxPrice,
                createdAt: order.createdAt,
                expiry: order.expiry,
                price
              });
            } catch (err) {
              logger.error(`Failed to fetch current price for order ${order.id.toString()}`, err);
            }
          }

          const buys = pricedOrders.filter(o => o.isBuy).sort((a, b) => (b.price > a.price ? 1 : -1));
          const sells = pricedOrders.filter(o => !o.isBuy).sort((a, b) => (a.price > b.price ? 1 : -1));

          if (buys.length > 0 || sells.length > 0) {
            logger.info(`Pair ${key}: ${buys.length} buys, ${sells.length} sells. Buys prices: [${buys.map(b => b.price.toString()).join(", ")}], Sells prices: [${sells.map(s => s.price.toString()).join(", ")}]`);
          }

          // Orderbook matching sweep
          for (const buy of buys) {
            if (matchedBuyIds.has(buy.id.toString())) continue;
            for (const sell of sells) {
              if (matchedSellIds.has(sell.id.toString())) continue;
              if (buy.price >= sell.price) {
                if (
                  buy.tokenOut.toLowerCase() === sell.tokenIn.toLowerCase() &&
                  buy.tokenIn.toLowerCase() === sell.tokenOut.toLowerCase()
                ) {
                  if (buy.maker.toLowerCase() === sell.maker.toLowerCase()) {
                    logger.info(`Skipping match for Buy #${buy.id.toString()} and Sell #${sell.id.toString()}: same maker address (SelfMatch prevented)`);
                  } else {
                    allMatches.push({ buy, sell });
                    matchedBuyIds.add(buy.id.toString());
                    matchedSellIds.add(sell.id.toString());
                    break;
                  }
                }
              } else {
                break;
              }
            }
          }
        } catch (err) {
          logger.error(`Error processing pair ${key}: ${err?.message || err}`);
        }
      }

      return allMatches;
    },

    /**
     * @param {{
     *   item: any;
     *   contract: any;
     *   logger: any;
     *   provider?: any;
     *   pollIntervalMs?: number;
     *   maxAttempts?: number;
     * }} params
     */
    async executeWorkItem({
      item,
      contract,
      logger,
      provider,
      pollIntervalMs = 2000,
      maxAttempts = 10
    }) {
      const deadline = Math.floor(Date.now() / 1000) + 60;
      const buyIdStr = item.buy.id.toString();
      const sellIdStr = item.sell.id.toString();
      logger.info(`Executing match: buyId=${buyIdStr}, sellId=${sellIdStr}`);
      const tx = await contract.matchOrders(item.buy.id, item.sell.id, deadline);

      pendingOrderIds.add(buyIdStr);
      pendingOrderIds.add(sellIdStr);

      if (tx && (typeof tx.wait === "function" || tx.hash)) {
        monitorPendingMatch({
          tx,
          buyIdStr,
          sellIdStr,
          provider: provider ?? contract?.runner?.provider,
          logger,
          pendingOrderIds,
          signal: abortController.signal,
          pollIntervalMs,
          maxAttempts
        }).catch((err) => {
          logger.debug?.(`Unexpected error in monitorPendingMatch: ${err?.message || err}`);
          pendingOrderIds.delete(buyIdStr);
          pendingOrderIds.delete(sellIdStr);
        });
      }

      return tx;
    },

    /**
     * @param {any} item
     */
    describeWorkItem(item) {
      return `buyId=${item.buy.id.toString()}, sellId=${item.sell.id.toString()}`;
    }
  };
}
