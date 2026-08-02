import { createServer } from "node:http";

/**
 * Exposes a small, read-only health document for dashboards and monitoring.
 * The endpoint is disabled unless TELEMETRY_PORT is configured.
 *
 * @param {{ port: number; getStatus: () => unknown; logger: any }} params
 */
export function startTelemetryServer({ port, host = "127.0.0.1", getStatus, logger }) {
  if (!port) return null;

  const server = createServer((request, response) => {
    try {
      if (request.method !== "GET" || request.url !== "/health") {
        response.writeHead(404, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: "Not found" }));
        return;
      }

      response.writeHead(200, {
        "content-type": "application/json",
        "cache-control": "no-store"
      });
      response.end(JSON.stringify(getStatus()));
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
  server.close((error) => {
    if (error) {
      logger.error("Keeper telemetry server shutdown failed", { error: error.message });
      return;
    }
    logger.info("Keeper telemetry server stopped");
  });
}
