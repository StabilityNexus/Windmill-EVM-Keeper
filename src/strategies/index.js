import { createWindmillStrategy } from "./windmill.strategy.js";
import { createNoopStrategy } from "./noop.strategy.js";

const STRATEGY_FACTORIES = new Map([
  ["noop", createNoopStrategy],
  ["windmill", createWindmillStrategy]
]);

export function listStrategies() {
  return Array.from(STRATEGY_FACTORIES.keys());
}

/**
 * @param {string} name
 */
export function createStrategy(name) {
  const normalized = name.trim().toLowerCase();
  const factory = STRATEGY_FACTORIES.get(normalized);

  if (!factory) {
    throw new Error(
      `Unknown keeper strategy "${name}". Available strategies: ${listStrategies().join(", ")}`
    );
  }

  return factory();
}
