export function createOrderMatchingStrategy() {
  return {
    name: "order-matching",
    requiresSigner: true,
    requiresContract: true,
    abi: [], 

    async getWorkItems(keeperContext) {
      const { contracts } = keeperContext;

      try {
        // Optimized O(1) discovery using top-of-book state
        const bestBid = await contracts.exchange.getBestBid();
        const bestAsk = await contracts.exchange.getBestAsk();

        if (bestBid && bestAsk && bestBid.price >= bestAsk.price) {
          return [{
            type: "MATCH",
            bidId: bestBid.id,
            askId: bestAsk.id,
            price: bestAsk.price,
            amount: Math.min(bestBid.amount, bestAsk.amount)
          }];
        }
      } catch (error) {
        console.error("Order book fetch error:", error);
      }

      return [];
    },

    async executeWorkItem(workItem, keeperContext) {
      const { contracts } = keeperContext;
      return await contracts.exchange.matchOrders(
        workItem.bidId, 
        workItem.askId
      );
    },

    describeWorkItem(workItem) {
      return `Match Bid ${workItem.bidId} with Ask ${workItem.askId} at price ${workItem.price}`;
    }
  };
}