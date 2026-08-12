import { createServer } from "node:http";

/**
 * Exposes a small, read-only health document for dashboards and monitoring.
 * The endpoint is disabled unless TELEMETRY_PORT is configured.
 *
 * @param {{
 *   port: number;
 *   host?: string;
 *   getStatus: () => unknown;
 *   logger: {
 *     info: (message: string, meta?: unknown) => void;
 *     error: (message: string, meta?: unknown) => void;
 *   };
 * }} params
 */
export function startTelemetryServer({ port, host = "127.0.0.1", getStatus, logger }) {
  if (!port) return null;

  const server = createServer((request, response) => {
    try {
      const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
      if (request.method !== "GET" || pathname !== "/health") {
        response.writeHead(404, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: "Not found" }));
        return;
      }

      const status = getStatus();
      response.writeHead(status.isHealthy === false || status.stopped === true ? 503 : 200, {
        "content-type": "application/json",
        "cache-control": "no-store"
      });
      response.end(JSON.stringify(status, (_, value) => typeof value === "bigint" ? value.toString() : value));
    } catch (error) {
      logger.error("Keeper telemetry request failed", {
        error: error instanceof Error ? error.message : String(error)
      });
      if (!response.headersSent) {
        response.writeHead(500, { "content-type": "application/json" });
      }
      response.end(JSON.stringify({ error: "Internal server error" }));
    }
  });

  server.on("error", (error) => {
    logger.error("Keeper telemetry server failed", {
      host,
      port,
      error: error instanceof Error ? error.message : String(error)
    });
  });
  server.listen(port, host, () => logger.info("Keeper telemetry server started", { host, port }));
  return server;
}

export function stopTelemetryServer(server, logger) {
  if (!server?.listening) return;
  server.closeIdleConnections?.();
  server.close((error) => {
    if (error) {
      logger.error("Keeper telemetry server shutdown failed", { error: error.message });
      return;
    }
    logger.info("Keeper telemetry server stopped");
  });
}
