import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig, parseBoolean } from "../src/config.js";

test("parseBoolean handles true and false values", () => {
  assert.equal(parseBoolean("true", false), true);
  assert.equal(parseBoolean("0", true), false);
});

test("parseBoolean throws on invalid value", () => {
  assert.throws(() => parseBoolean("sometimes", true), /Invalid boolean value/);
});

test("loadConfig reads defaults", () => {
  const config = loadConfig({ env: {}, argv: [] });
  assert.equal(config.strategyName, "noop");
  assert.equal(config.once, false);
  assert.equal(config.dryRun, false);
  assert.equal(config.intervalMs, 15000);
  assert.equal(config.maxActionsPerCycle, 25);
  assert.equal(config.telemetryPort, 0);
  assert.equal(config.telemetryId, "");
});

test("loadConfig validates telemetry settings", () => {
  const configured = loadConfig({
    env: { TELEMETRY_PORT: "65535", TELEMETRY_HOST: " 0.0.0.0 ", TELEMETRY_ID: "  primary-keeper  " },
    argv: []
  });

  assert.equal(configured.telemetryPort, 65535);
  assert.equal(configured.telemetryHost, "0.0.0.0");
  assert.equal(configured.telemetryId, "primary-keeper");
  assert.throws(
    () => loadConfig({ env: { TELEMETRY_PORT: "-1" }, argv: [] }),
    /greater than or equal/
  );
  assert.throws(
    () => loadConfig({ env: { TELEMETRY_PORT: "65536" }, argv: [] }),
    /less than or equal/
  );
});

test("loadConfig supports cli overrides", () => {
  const config = loadConfig({
    env: {
      KEEPER_STRATEGY: "noop",
      DRY_RUN: "false",
      KEEPER_INTERVAL_MS: "15000"
    },
    argv: ["--once", "--dry-run", "--strategy=contract-task-template", "--interval-ms=9000"]
  });

  assert.equal(config.once, true);
  assert.equal(config.dryRun, true);
  assert.equal(config.strategyName, "contract-task-template");
  assert.equal(config.intervalMs, 9000);
});
