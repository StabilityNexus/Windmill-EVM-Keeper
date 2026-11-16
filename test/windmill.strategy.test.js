import test from "node:test";
import assert from "node:assert/strict";
import { createWindmillStrategy } from "../src/strategies/windmill.strategy.js";

function createMockLogger() {
  return {
    debug() {},
    info() {},
    warn() {},
    error() {}
  };
}

test("Windmill Strategy - DEPLOY_BLOCK validation", async (t) => {
  const strategy = createWindmillStrategy();
  const logger = createMockLogger();
  const contract = {
    async paused() { return false; },
    filters: {
      OrderCreated() { return "OrderCreatedFilter"; }
    },
    async queryFilter() { return []; },
    async getOrdersByPair() { return []; }
  };
  const provider = {
    async getBlockNumber() { return 100; }
  };

  const originalDeployBlock = process.env.DEPLOY_BLOCK;

  t.afterEach(() => {
    process.env.DEPLOY_BLOCK = originalDeployBlock;
  });

  // Test invalid values
  const invalidValues = ["12abc", "NaN", "-5", "abc", "12.3", "   "];
  for (const val of invalidValues) {
    process.env.DEPLOY_BLOCK = val;
    await assert.rejects(
      () => strategy.getWorkItems({ now: 1000, provider, contract, logger }),
      (err) => {
        assert(err instanceof Error);
        assert(err.message.includes("Invalid DEPLOY_BLOCK"));
        return true;
      }
    );
  }

  // Test valid values
  const validValues = ["123", "0", " 456 ", ""];
  for (const val of validValues) {
    process.env.DEPLOY_BLOCK = val;
    // Should not throw
    await strategy.getWorkItems({ now: 1000, provider, contract, logger });
  }
});

test("Windmill Strategy - Rolling event scan window tracking", async (t) => {
  const strategy = createWindmillStrategy();
  const logger = createMockLogger();

  const originalDeployBlock = process.env.DEPLOY_BLOCK;
  process.env.DEPLOY_BLOCK = "100";

  t.afterEach(() => {
    process.env.DEPLOY_BLOCK = originalDeployBlock;
  });

  const queryFilterCalls = [];
  const contract = {
    async paused() { return false; },
    filters: {
      OrderCreated() { return "OrderCreatedFilter"; }
    },
    async queryFilter(filter, start, end) {
      queryFilterCalls.push({ start, end });
      return [];
    },
    async getOrdersByPair() { return []; }
  };

  let currentTip = 500;
  const provider = {
    async getBlockNumber() { return currentTip; }
  };

  // First run: starts from DEPLOY_BLOCK (100) to current tip (500)
  await strategy.getWorkItems({ now: 1000, provider, contract, logger });
  assert.equal(queryFilterCalls.length, 1);
  assert.deepEqual(queryFilterCalls[0], { start: 100, end: 500 });

  // Second run: tip moves to 550, scan window should be 501 to 550
  currentTip = 550;
  await strategy.getWorkItems({ now: 1000, provider, contract, logger });
  assert.equal(queryFilterCalls.length, 2);
  assert.deepEqual(queryFilterCalls[1], { start: 501, end: 550 });

  // Third run: tip is still 550, scan window should not query filter since startBlock (551) > currentBlock (550)
  await strategy.getWorkItems({ now: 1000, provider, contract, logger });
  assert.equal(queryFilterCalls.length, 2); // No new call to queryFilter
});

test("Windmill Strategy - executeWorkItem returns transaction without redundant tx.wait()", async () => {
  const strategy = createWindmillStrategy();
  const logger = createMockLogger();
  let waitCalled = false;
  let matchOrdersParams = null;

  const mockTx = {
    hash: "0xabcdef1234567890",
    async wait() {
      waitCalled = true;
      return { status: 1 };
    }
  };

  const contract = {
    async matchOrders(buyId, sellId, deadline) {
      matchOrdersParams = { buyId, sellId, deadline };
      return mockTx;
    }
  };

  const item = {
    buy: { id: 101n },
    sell: { id: 202n }
  };

  const result = await strategy.executeWorkItem({ item, contract, logger });

  assert.equal(result, mockTx);
  assert.equal(matchOrdersParams.buyId, 101n);
  assert.equal(matchOrdersParams.sellId, 202n);
  assert.equal(typeof matchOrdersParams.deadline, "number");
});

test("Windmill Strategy - tracks pending settlements and skips them in getWorkItems", async () => {
  const strategy = createWindmillStrategy();
  const logger = createMockLogger();
  let resolveWait;
  const waitPromise = new Promise((resolve) => {
    resolveWait = resolve;
  });

  const mockTx = {
    hash: "0xpending123",
    wait() {
      return waitPromise;
    }
  };

  const getOrderCalls = [];
  const contract = {
    async paused() { return false; },
    filters: {
      OrderCreated() { return "filter"; }
    },
    async queryFilter() { return []; },
    async getOrdersByPair() { return [101n, 102n]; },
    async getOrder(id) {
      getOrderCalls.push(id);
      return { id, active: true, expiry: 0n };
    },
    async matchOrders() {
      return mockTx;
    }
  };
  const provider = {
    async getBlockNumber() { return 100; }
  };

  // Submit match for order 101
  await strategy.executeWorkItem({
    item: { buy: { id: 101n }, sell: { id: 202n } },
    contract,
    logger
  });

  // Next cycle: 101n is still pending settlement, so getOrder should NOT be called for 101n
  await strategy.getWorkItems({ now: 1000, provider, contract, logger });
  assert.equal(getOrderCalls.includes(101n), false, "Pending order 101n should be skipped in getWorkItems");
  assert.equal(getOrderCalls.includes(102n), true, "Non-pending order 102n should be processed");

  // When transaction finishes mining:
  resolveWait({ status: 1 });
  await new Promise((resolve) => setTimeout(resolve, 10)); // flush microtasks

  // Order 101n should no longer be pending
  getOrderCalls.length = 0;
  await strategy.getWorkItems({ now: 1000, provider, contract, logger });
  assert.equal(getOrderCalls.includes(101n), true, "Order 101n should be fetched again after terminal settlement state");
});

test("Windmill Strategy - retains pending reservations on nonterminal receipt errors until terminal state", async () => {
  const strategy = createWindmillStrategy();
  const logger = createMockLogger();

  let receiptFound = false;
  const mockTx = {
    hash: "0xhash789",
    async wait() {
      // Simulate nonterminal transient RPC error (without err.receipt)
      throw new Error("RPC temporary timeout");
    }
  };

  const provider = {
    async getBlockNumber() { return 100; },
    async getTransactionReceipt(hash) {
      if (hash === "0xhash789" && receiptFound) {
        return { status: 1, blockNumber: 101 };
      }
      return null;
    }
  };

  const getOrderCalls = [];
  const contract = {
    async paused() { return false; },
    filters: { OrderCreated() { return "filter"; } },
    async queryFilter() { return []; },
    async getOrdersByPair() { return [201n]; },
    async getOrder(id) {
      getOrderCalls.push(id);
      return { id, active: true, expiry: 0n };
    },
    async matchOrders() {
      return mockTx;
    }
  };

  await strategy.executeWorkItem({
    item: { buy: { id: 201n }, sell: { id: 202n } },
    contract,
    logger,
    provider,
    pollIntervalMs: 20,
    maxAttempts: 5
  });

  // Next cycle immediately after nonterminal error:
  // Reservation should NOT be dropped by a premature finally
  await strategy.getWorkItems({ now: 1000, provider, contract, logger });
  assert.equal(getOrderCalls.includes(201n), false, "Reservation must be retained after nonterminal error");

  // Terminal receipt becomes available
  receiptFound = true;
  await new Promise((resolve) => setTimeout(resolve, 60));

  // Order reservation should be cleared once terminal receipt is confirmed
  getOrderCalls.length = 0;
  await strategy.getWorkItems({ now: 1000, provider, contract, logger });
  assert.equal(getOrderCalls.includes(201n), true, "Reservation should be cleared once terminal state is verified");
});

test("Windmill Strategy - stops background settlement monitor cleanly when strategy.stop() is called", async () => {
  const strategy = createWindmillStrategy();
  const logger = createMockLogger();

  const mockTx = {
    hash: "0xunmined",
    wait() {
      return new Promise(() => {}); // Unmined, never resolves
    }
  };

  const provider = {
    async getBlockNumber() { return 100; },
    async getTransactionReceipt() { return null; }
  };

  const contract = {
    async paused() { return false; },
    filters: { OrderCreated() { return "filter"; } },
    async queryFilter() { return []; },
    async getOrdersByPair() { return [301n]; },
    async getOrder(id) { return { id, active: true, expiry: 0n }; },
    async matchOrders() { return mockTx; }
  };

  await strategy.executeWorkItem({
    item: { buy: { id: 301n }, sell: { id: 302n } },
    contract,
    logger,
    provider,
    pollIntervalMs: 50,
    maxAttempts: 100
  });

  // Call strategy.stop() to simulate shutdown
  strategy.stop();

  // Give short tick to ensure loop terminates cleanly
  await new Promise((resolve) => setTimeout(resolve, 20));

  // Verify reservation is retained during shutdown
  const getOrderCalls = [];
  contract.getOrder = async (id) => {
    getOrderCalls.push(id);
    return { id, active: true, expiry: 0n };
  };

  await strategy.getWorkItems({ now: 1000, provider, contract, logger });
  assert.equal(getOrderCalls.includes(301n), false, "Reservation must remain retained on shutdown");
});

test("Windmill Strategy - passes pollIntervalMs as timeout to tx.wait and handles timeout error cleanly", async () => {
  const strategy = createWindmillStrategy();
  const debugLogs = [];
  const logger = {
    ...createMockLogger(),
    debug(msg) {
      debugLogs.push(msg);
    }
  };
  let waitCount = 0;
  let waitConfirms = null;
  let waitTimeout = null;

  const mockTx = {
    hash: "0xtimeout123",
    async wait(confirms, timeout) {
      waitCount += 1;
      waitConfirms = confirms;
      waitTimeout = timeout;
      const err = new Error("wait for transaction timeout");
      err.code = "TIMEOUT";
      throw err;
    }
  };

  const provider = {
    async getBlockNumber() { return 100; },
    async getTransactionReceipt() { return null; }
  };

  const contract = {
    async paused() { return false; },
    filters: { OrderCreated() { return "filter"; } },
    async queryFilter() { return []; },
    async getOrdersByPair() { return [401n]; },
    async getOrder(id) { return { id, active: true, expiry: 0n }; },
    async matchOrders() { return mockTx; }
  };

  await strategy.executeWorkItem({
    item: { buy: { id: 401n }, sell: { id: 402n } },
    contract,
    logger,
    provider,
    pollIntervalMs: 25,
    maxAttempts: 2
  });

  // Wait until maxAttempts (2 calls to wait) finish or deadline expires
  const deadline = Date.now() + 1000;
  while (waitCount < 2 && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 15));
  }
  // Allow remaining tick for cleanup
  await new Promise((resolve) => setTimeout(resolve, 35));

  assert.equal(waitConfirms, 1, "Should pass 1 confirmation to tx.wait");
  assert.equal(waitTimeout, 25, "Should pass pollIntervalMs as wait timeout to tx.wait");
  assert.equal(waitCount, 2, "Should attempt polling 2 times");

  // Assert that TIMEOUT was handled cleanly and did not log transient error messages
  const hasTransientErrorLog = debugLogs.some(
    (msg) => typeof msg === "string" && msg.includes("Transient error polling receipt")
  );
  assert.equal(
    hasTransientErrorLog,
    false,
    "TIMEOUT error should be handled cleanly without logging transient error debug messages"
  );
});
