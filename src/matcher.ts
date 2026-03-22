import { signer } from "./provider";
import { windmill } from "./windmill";

interface ActiveOrder {
  id: number;
  buyToken: string;
  sellToken: string;
}

export async function scanAndMatch(): Promise<void> {
  // 1. Get latest block and timestamp
  const block = await signer.provider!.getBlock("latest");
  if (!block) return;
  const timestamp: number = block.timestamp;
  const blockNumber: number = block.number;

  // 2. Get total order count
  const orderCount: bigint = await windmill.nextOrderId();

  // 3. Collect active orders
  const activeOrders: ActiveOrder[] = [];
  for (let i = 0; i < Number(orderCount); i++) {
    const order = await windmill.getOrder(i);
    if (order.active) {
      activeOrders.push({ id: i, buyToken: order.buyToken, sellToken: order.sellToken });
    }
  }

  let attempted = 0;
  let confirmed = 0;

  // 4. Check every pair for token compatibility
  for (let a = 0; a < activeOrders.length; a++) {
    for (let b = a + 1; b < activeOrders.length; b++) {
      const orderA = activeOrders[a];
      const orderB = activeOrders[b];

      // 5. Determine buyId / sellId based on token direction
      let buyId: number;
      let sellId: number;

      if (orderA.buyToken === orderB.sellToken && orderA.sellToken === orderB.buyToken) {
        buyId = orderA.id;
        sellId = orderB.id;
      } else if (orderB.buyToken === orderA.sellToken && orderB.sellToken === orderA.buyToken) {
        buyId = orderB.id;
        sellId = orderA.id;
      } else {
        continue;
      }

      // 6. Fetch prices at current block timestamp
      const buyPrice: bigint = await windmill.priceAt(buyId, timestamp);
      const sellPrice: bigint = await windmill.priceAt(sellId, timestamp);

      // 7. Execute match if price condition is met
      if (buyPrice >= sellPrice) {
        attempted++;
        try {
          const tx = await windmill.matchOrders(buyId, sellId);
          await tx.wait();
          confirmed++;
        } catch {
          // Ignore failures — order may already be matched or invalid
        }
      }
    }
  }

  console.log(`Block: ${blockNumber} | Attempted: ${attempted} | Confirmed: ${confirmed}`);
}
