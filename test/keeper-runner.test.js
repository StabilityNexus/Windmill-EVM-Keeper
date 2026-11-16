import test from "node:test";
import assert from "node:assert/strict";
import { KeeperRunner } from "../src/keeper-runner.js";
import { RecoverableNonceManager } from "../src/nonce-manager.js";

function createLogger() {
  return {
    debug() {},
    info() {},
    warn() {},
    error() {}
  };
}

function createBaseConfig(overrides = {}) {
  return {
    once: true,
    dryRun: false,
    strategyName: "test",
    rpcUrl: "http://127.0.0.1:8545",
    expectedChainId: null,
    privateKey: "",
    contractAddress: "",
    intervalMs: 1000,
    maxActionsPerCycle: 10,
    txConfirmations: 1,
    logLevel: "info",
    ...overrides
  };
}

function createProvider(chainId = 1n) {
  return {
    async getNetwork() {
      return { chainId };
    }
  };
}

test("runCycle respects MAX_ACTIONS_PER_CYCLE", async () => {
  const executed = [];

  const strategy = {
    name: "max-actions-test",
    requiresSigner: false,
    requiresContract: false,
    abi: [],
    async getWorkItems() {
      return [{ id: 1 }, { id: 2 }, { id: 3 }];
    },
    async executeWorkItem({ item }) {
      executed.push(item.id);
      return {
        hash: `0x${item.id}`,
        async wait() {
          return { status: 1 };
        }
      };
    },
    describeWorkItem(item) {
      return `id=${item.id}`;
    }
  };

  const runner = new KeeperRunner({
    config: createBaseConfig({ maxActionsPerCycle: 2 }),
    provider: createProvider(),
    signer: null,
    contract: null,
    strategy,
    logger: createLogger()
  });

  await runner.runCycle();
  assert.deepEqual(executed, [1, 2]);
});

test("runCycle skips execution in DRY_RUN mode", async () => {
  const strategy = {
    name: "dry-run-test",
    requiresSigner: false,
    requiresContract: false,
    abi: [],
    async getWorkItems() {
      return [{ id: 1 }];
    },
    async executeWorkItem() {
      throw new Error("Should not execute in dry run");
    },
    describeWorkItem(item) {
      return `id=${item.id}`;
    }
  };

  const runner = new KeeperRunner({
    config: createBaseConfig({ dryRun: true }),
    provider: createProvider(),
    signer: null,
    contract: null,
    strategy,
    logger: createLogger()
  });

  await runner.runCycle();
});

test("logStartup fails on chain-id mismatch", async () => {
  const strategy = {
    name: "chain-id-test",
    requiresSigner: false,
    requiresContract: false,
    abi: [],
    async getWorkItems() {
      return [];
    },
    async executeWorkItem() {
      return null;
    }
  };

  const runner = new KeeperRunner({
    config: createBaseConfig({ expectedChainId: 8453n }),
    provider: createProvider(1n),
    signer: null,
    contract: null,
    strategy,
    logger: createLogger()
  });

  await assert.rejects(() => runner.logStartup(), /Chain ID mismatch/);
});

test("getStatus reports an unhealthy cycle when every work item fails", async () => {
  const strategy = {
    name: "failure-status-test", requiresSigner: false, requiresContract: false, abi: [],
    async getWorkItems() { return [{ id: 1 }]; },
    async executeWorkItem() { throw new Error("execution failed"); }
  };
  const runner = new KeeperRunner({ config: createBaseConfig(), provider: createProvider(), signer: null, contract: null, strategy, logger: createLogger() });

  await runner.runCycle();
  assert.equal(runner.getStatus().isHealthy, false);
  assert.equal(runner.getStatus().lastCycle.failed, 1);
});

test("RecoverableNonceManager preserves address and recovers nonce after pre-broadcast failure", async () => {
  let pendingCount = 10;
  const mockProvider = {
    async getTransactionCount() { return pendingCount; }
  };
  const mockBaseSigner = {
    address: "0x1234567890123456789012345678901234567890",
    provider: mockProvider,
    async getAddress() { return this.address; },
    async getNonce() { return pendingCount; },
    async populateTransaction() {
      // Simulate gas estimation / simulation failure before broadcast
      throw new Error("gas estimation failed: execution reverted");
    },
    async sendTransaction() { return { hash: "0xok" }; }
  };

  const managedSigner = new RecoverableNonceManager(mockBaseSigner);
  assert.equal(managedSigner.address, mockBaseSigner.address, "Signer address must be preserved");

  const initialNonce = await managedSigner.getNonce("pending");
  assert.equal(initialNonce, 10);

  // Attempt transaction which fails during populateTransaction (pre-broadcast)
  await assert.rejects(
    () => managedSigner.sendTransaction({ to: "0xabc" }),
    /gas estimation failed/
  );

  // The nonce delta should be reset back to 0, matching pending count 10 (no gap)
  const recoveredNonce = await managedSigner.getNonce("pending");
  assert.equal(recoveredNonce, 10, "Nonce must not be incremented after pre-broadcast failure");
});

test("RecoverableNonceManager reconciles nonce when broadcast fails", async () => {
  let pendingCount = 10;
  const mockProvider = {
    async getTransactionCount() { return pendingCount; }
  };
  const mockBaseSigner = {
    address: "0x1234567890123456789012345678901234567890",
    provider: mockProvider,
    async getAddress() { return this.address; },
    async getNonce() { return pendingCount; },
    async populateTransaction(tx) { return { ...tx }; },
    async sendTransaction() {
      // Simulate broadcast rejection from node (e.g. node reject / network drop)
      throw new Error("node rejection: invalid transaction");
    }
  };

  const managedSigner = new RecoverableNonceManager(mockBaseSigner);
  await assert.rejects(
    () => managedSigner.sendTransaction({ to: "0xabc" }),
    /node rejection/
  );

  // Since node pending count is still 10, reconcileNonce resets manager to avoid nonce gap
  const recoveredNonce = await managedSigner.getNonce("pending");
  assert.equal(recoveredNonce, 10, "Nonce should reconcile with node pending count on broadcast rejection");
});

test("RecoverableNonceManager prevents unhandled rejection when both nonce lookup and population reject", async () => {
  let unhandledCaptured = null;
  const onUnhandled = (reason) => {
    unhandledCaptured = reason;
  };
  process.on("unhandledRejection", onUnhandled);

  try {
    const mockProvider = {
      async getTransactionCount() {
        await new Promise((resolve) => setTimeout(resolve, 20));
        throw new Error("RPC error: nonce query failed");
      }
    };

    const mockBaseSigner = {
      address: "0x1234567890123456789012345678901234567890",
      provider: mockProvider,
      async getAddress() { return this.address; },
      async getNonce() {
        await new Promise((resolve) => setTimeout(resolve, 20));
        throw new Error("RPC error: nonce query failed");
      },
      async populateTransaction() {
        // Population fails slightly faster than nonce lookup
        await new Promise((resolve) => setTimeout(resolve, 5));
        throw new Error("RPC error: populateTransaction failed");
      },
      async sendTransaction() { return {}; }
    };

    const managedSigner = new RecoverableNonceManager(mockBaseSigner);
    await assert.rejects(
      () => managedSigner.sendTransaction({ to: "0xabc" }),
      /RPC error/
    );

    // Wait for the slower nonce query rejection to settle
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.equal(
      unhandledCaptured,
      null,
      "No unhandled promise rejection should occur when both nonce query and population reject"
    );
  } finally {
    process.removeListener("unhandledRejection", onUnhandled);
  }
});

test("RecoverableNonceManager reserves distinct nonces for concurrent sendTransaction dispatches", async () => {
  let pendingCount = 100;
  const dispatchedNonces = [];

  const mockProvider = {
    async getTransactionCount() { return pendingCount; }
  };

  const mockBaseSigner = {
    address: "0x1234567890123456789012345678901234567890",
    provider: mockProvider,
    async getAddress() { return this.address; },
    async getNonce() {
      // Simulate slight async delay in nonce resolution
      await new Promise((resolve) => setTimeout(resolve, 15));
      return pendingCount;
    },
    async populateTransaction(tx) { return { ...tx }; },
    async sendTransaction(tx) {
      dispatchedNonces.push(tx.nonce);
      return { hash: `0x${tx.nonce}` };
    }
  };

  const managedSigner = new RecoverableNonceManager(mockBaseSigner);

  // Dispatch two transactions concurrently
  await Promise.all([
    managedSigner.sendTransaction({ to: "0x111" }),
    managedSigner.sendTransaction({ to: "0x222" })
  ]);

  assert.equal(dispatchedNonces.length, 2);
  assert.equal(dispatchedNonces[0], 100, "First transaction should receive nonce 100");
  assert.equal(dispatchedNonces[1], 101, "Second concurrent transaction should receive reserved nonce 101");
});
