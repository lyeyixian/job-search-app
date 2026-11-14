import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { VaultStore } from "../vault/store.js";
import { createApp } from "./app.js";
import { ApplicationListSchema } from "./applications.js";
import { ProblemSchema } from "./problem.js";

const fixtureVault = fileURLToPath(new URL("../../../../fixtures/vault", import.meta.url));

describe("GET /api/applications", () => {
  const store = new VaultStore(fixtureVault);
  const app = createApp(store);
  beforeAll(async () => {
    await store.load();
  });

  it("returns 200 and every application of the fixture vault", async () => {
    const response = await app.request("/api/applications");

    expect(response.status).toBe(200);
    const body = ApplicationListSchema.parse(await response.json());
    expect(body.applications).toHaveLength(13);
    expect(body.choices.companies).toContain("Example Co");
  });

  it("returns an application with a missing field, with a warning that names the field", async () => {
    const response = await app.request("/api/applications?company=Harbor%20Data");

    const body = ApplicationListSchema.parse(await response.json());
    expect(body.applications).toHaveLength(1);
    expect(body.applications[0]?.warnings).toEqual([{ field: "verdict", problem: "missing" }]);
  });

  it("returns only the applications that match every query parameter", async () => {
    const response = await app.request("/api/applications?region=remote&direction=aligned");

    const body = ApplicationListSchema.parse(await response.json());
    expect(body.applications.map((application) => application.slug).sort()).toEqual([
      "orchard-robotics-software-engineer",
      "pine-street-backend-engineer",
    ]);
  });

  it("returns an empty list for a value that no application has", async () => {
    const response = await app.request("/api/applications?verdict=no-such-verdict");

    expect(response.status).toBe(200);
    expect(ApplicationListSchema.parse(await response.json()).applications).toEqual([]);
  });

  it("returns a 503 problem with the code index_not_ready before the first load", async () => {
    const response = await createApp(new VaultStore(fixtureVault)).request("/api/applications");

    expect(response.status).toBe(503);
    expect(ProblemSchema.parse(await response.json()).code).toBe("index_not_ready");
  });
});
