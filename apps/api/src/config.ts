import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Local settings for development. Git ignores this file.
if (process.env.NODE_ENV !== "production" && existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const fixtureVault = fileURLToPath(new URL("../../../fixtures/vault", import.meta.url));

export const config = {
  port: Number(process.env.PORT ?? 3001),
  vaultPath: resolve(process.env.VAULT_PATH || fixtureVault),
  logLevel: process.env.LOG_LEVEL ?? "info",
  otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || undefined,
};
