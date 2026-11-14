import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { VaultStore } from "../vault/store.js";
import { createApp } from "./app.js";
import { HealthSchema } from "./health.js";
import { ProblemSchema } from "./problem.js";

const fixtureVault = fileURLToPath(new URL("../../../../fixtures/vault", import.meta.url));

describe("GET /api/health", () => {
  it("returns 200 and the note count when the index exists", async () => {
    const store = new VaultStore(fixtureVault);
    await store.load();

    const response = await createApp(store).request("/api/health");

    expect(response.status).toBe(200);
    const body = HealthSchema.parse(await response.json());
    expect(body.vault.notes).toBeGreaterThan(0);
  });

  it("returns a 503 problem with the code index_not_ready before the first load", async () => {
    const response = await createApp(new VaultStore(fixtureVault)).request("/api/health");

    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toContain("application/problem+json");
    const body = ProblemSchema.parse(await response.json());
    expect(body.code).toBe("index_not_ready");
    expect(body.traceId).toMatch(/^[0-9a-f]{32}$/);
  });

  it("continues the trace of the traceparent header", async () => {
    const traceId = "4bf92f3577b34da6a3ce929d0e0e4736";
    const response = await createApp(new VaultStore(fixtureVault)).request("/api/health", {
      headers: { traceparent: `00-${traceId}-00f067aa0ba902b7-01` },
    });

    const body = ProblemSchema.parse(await response.json());
    expect(body.traceId).toBe(traceId);
  });
});
