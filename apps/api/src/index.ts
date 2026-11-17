import { serve } from "@hono/node-server";
import { config } from "./config.js";
import { createApp } from "./http/app.js";
import { logger } from "./logger.js";
import { startTelemetry } from "./telemetry.js";
import { VaultStore } from "./vault/store.js";
import { VaultPullError } from "./vault/sync.js";

const telemetry = startTelemetry();
const store = new VaultStore(config.vaultPath);
const app = createApp(store);

const server = serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
  logger.info({ port, tracesExported: Boolean(config.otlpEndpoint) }, "API listening");
});

// The API answers 503 `index_not_ready` until the first load completes.
// At start the API pulls the vault clone. If the pull fails, the API shows the clone as it is.
store
  .refresh()
  .catch((error: Error) => {
    if (!(error instanceof VaultPullError)) throw error;
    logger.warn({ reason: error.reason }, "vault pull failed at start");
    return store.load().then((index) => ({ ...index, pulled: false }));
  })
  .then((index) =>
    logger.info({ commit: index.commit, pulled: index.pulled, notes: index.notes.size }, "vault index built"),
  )
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
