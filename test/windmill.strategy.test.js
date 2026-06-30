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
