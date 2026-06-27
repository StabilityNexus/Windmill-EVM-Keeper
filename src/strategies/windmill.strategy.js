import { ethers } from "ethers";

const WINDMILL_EXCHANGE_ABI = [
  "function paused() view returns (bool)",
  "function priceOracle() view returns (address)",
  "function getOrdersByPair(address tokenA, address tokenB, uint256 cursor, uint256 limit) view returns (uint256[])",
  "function getOrder(uint256 orderId) view returns (tuple(uint256 id, address maker, bool isBuy, bool active, address tokenIn, address tokenOut, uint256 amountIn, uint256 remainingIn, uint256 startPrice, int256 slope, uint256 minPrice, uint256 maxPrice, uint256 createdAt, uint256 expiry, uint8 orderType, uint256 triggerPrice))",
  "function currentPrice(uint256 orderId, uint256 timestamp) view returns (uint256)",
  "function matchOrders(uint256 buyOrderId, uint256 sellOrderId, uint256 deadline) returns (tuple())",
  "event OrderCreated(uint256 indexed orderId, address indexed maker, address indexed tokenIn, address tokenOut, uint256 amountIn, bool isBuy)"
];

const ORACLE_ABI = [
  "function getPrice(address tokenIn, address tokenOut) view returns (uint256)"
];

const pairsMap = new Map();

/**
 * @param {string} tokenA
 * @param {string} tokenB
 * @returns {string}
 */
function getPairKey(tokenA, tokenB) {
  const [t0, t1] = tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];
  return `${t0.toLowerCase()}-${t1.toLowerCase()}`;
}

export function createWindmillStrategy() {
  return {
    name: "windmill",
    requiresSigner: true,
    requiresContract: true,
    abi: WINDMILL_EXCHANGE_ABI,

    async getWorkItems({ now, contract, logger }) {
      const allMatches = [];
      if (await contract.paused()) {
        logger.warn("Exchange is paused. Skipping cycle.");
        return [];
      }

      // Discover pairs from events
      const deployBlock = process.env.DEPLOY_BLOCK ? parseInt(process.env.DEPLOY_BLOCK) : 0;
      const logs = await contract.queryFilter(contract.filters.OrderCreated(), deployBlock);
      for (const log of logs) {
        const { tokenIn, tokenOut } = log.args;
        const key = getPairKey(tokenIn, tokenOut);
        if (!pairsMap.has(key)) {
          pairsMap.set(key, {
            token0: tokenIn.toLowerCase() < tokenOut.toLowerCase() ? tokenIn : tokenOut,
            token1: tokenIn.toLowerCase() < tokenOut.toLowerCase() ? tokenOut : tokenIn
          });
        }
      }

      for (const [key, pair] of pairsMap.entries()) {
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

        // Fetch full order data and check expiration
        const eligibleOrders = [];
        for (const id of orderIds) {
          const order = await contract.getOrder(id);
          if (!order.active) continue;
          if (order.expiry !== 0n && BigInt(now) > order.expiry) continue;
          eligibleOrders.push(order);
        }

        // Fetch current on-chain prices
        const pricedOrders = [];
        for (const order of eligibleOrders) {
          try {
            const price = await contract.currentPrice(order.id, now);
            pricedOrders.push({ ...order, price });
          } catch (err) {
            logger.error(`Failed to fetch current price for order ${order.id.toString()}`, err);
          }
        }

        const buys = pricedOrders.filter(o => o.isBuy).sort((a, b) => (b.price > a.price ? 1 : -1));
        const sells = pricedOrders.filter(o => !o.isBuy).sort((a, b) => (a.price > b.price ? 1 : -1));

        // Two-pointer sweep
        let i = 0, j = 0;
        while (i < buys.length && j < sells.length) {
          const buy = buys[i];
          const sell = sells[j];
          if (buy.price >= sell.price) {
            if (
              buy.tokenOut.toLowerCase() === sell.tokenIn.toLowerCase() &&
              buy.tokenIn.toLowerCase() === sell.tokenOut.toLowerCase() &&
              buy.maker.toLowerCase() !== sell.maker.toLowerCase()
            ) {
              allMatches.push({ buy, sell });
            }
            i++;
            j++;
          } else {
            break;
          }
        }
      }

      return allMatches;
    },

    async executeWorkItem({ item, contract, logger }) {
      const deadline = Math.floor(Date.now() / 1000) + 60;
      logger.info(`Executing match: buyId=${item.buy.id.toString()}, sellId=${item.sell.id.toString()}`);
      return await contract.matchOrders(item.buy.id, item.sell.id, deadline);
    },

    describeWorkItem(item) {
      return `buyId=${item.buy.id.toString()}, sellId=${item.sell.id.toString()}`;
    }
  };
}
