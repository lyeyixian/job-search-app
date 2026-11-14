import { serve } from "@hono/node-server";
import { config } from "./config.js";
import { createApp } from "./http/app.js";
import { logger } from "./logger.js";
import { startTelemetry } from "./telemetry.js";
import { VaultStore } from "./vault/store.js";

const telemetry = startTelemetry();
const store = new VaultStore(config.vaultPath);
const app = createApp(store);

const server = serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
  logger.info({ port, tracesExported: Boolean(config.otlpEndpoint) }, "API listening");
});

// The API answers 503 `index_not_ready` until the first load completes.
store
  .load()
  .then((index) => logger.info({ notes: index.notes.size }, "vault index built"))
  .catch((error: Error) => {
    logger.error({ err: { name: error.name, message: error.message } }, "vault index failed to build");
    process.exitCode = 1;
    shutdown();
  });

function shutdown() {
  server.close();
  void telemetry.shutdown();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
