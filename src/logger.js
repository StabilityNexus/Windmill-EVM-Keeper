const LEVEL_TO_PRIORITY = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

/**
 * @typedef {"debug" | "info" | "warn" | "error"} LogLevel
 */

/**
 * @param {any} [meta]
 * @returns {string}
 */
function serializeMeta(meta) {
  if (meta === undefined) {
    return "";
  }

  if (typeof meta === "string") {
    return ` ${meta}`;
  }

  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return " [unserializable-meta]";
  }
}

/**
 * @param {string} [level]
 */
export function createLogger(level = "info") {
  const threshold = LEVEL_TO_PRIORITY[/** @type {LogLevel} */ (level)] ?? LEVEL_TO_PRIORITY.info;

  /**
   * @param {LogLevel} entryLevel
   * @param {string} message
   * @param {any} [meta]
   */
  function log(entryLevel, message, meta) {
    if (LEVEL_TO_PRIORITY[entryLevel] < threshold) {
      return;
    }

    const line = `[${new Date().toISOString()}] [${entryLevel}] ${message}${serializeMeta(meta)}`;
    if (entryLevel === "error") {
      console.error(line);
    } else if (entryLevel === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  return {
    /**
     * @param {string} message
     * @param {any} [meta]
     */
    debug: (message, meta) => log("debug", message, meta),
    /**
     * @param {string} message
     * @param {any} [meta]
     */
    info: (message, meta) => log("info", message, meta),
    /**
     * @param {string} message
     * @param {any} [meta]
     */
    warn: (message, meta) => log("warn", message, meta),
    /**
     * @param {string} message
     * @param {any} [meta]
     */
    error: (message, meta) => log("error", message, meta)
  };
}
