import test from "node:test";
import assert from "node:assert/strict";
import { listStrategies, createStrategy } from "../src/strategies/index.js";

test("listStrategies returns available strategy names", () => {
  const list = listStrategies();
  assert(list.includes("noop"));
  assert(list.includes("windmill"));
});

test("createStrategy initializes expected strategies case-insensitively", () => {
  const noop1 = createStrategy("noop");
  assert.equal(noop1.name, "noop");

  const noop2 = createStrategy("  NoOp  ");
  assert.equal(noop2.name, "noop");

  const windmill = createStrategy("windmill");
  assert.equal(windmill.name, "windmill");
});

test("createStrategy throws on unknown strategy", () => {
  assert.throws(
    () => createStrategy("invalid-strategy"),
    /Unknown keeper strategy "invalid-strategy"/
  );
});

test("noop strategy returns default empty items and handles work", async () => {
  const strategy = createStrategy("noop");
  assert.equal(strategy.requiresSigner, false);
  assert.equal(strategy.requiresContract, false);
  assert.deepEqual(strategy.abi, []);

  const items = await strategy.getWorkItems();
  assert.deepEqual(items, []);

  const result = await strategy.executeWorkItem();
  assert.equal(result, null);

  const description = strategy.describeWorkItem();
  assert.equal(description, "noop");
});
