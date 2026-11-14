import { describe, expect, it } from "vitest";
import { VaultStore } from "../vault/store.js";
import { createApp } from "./app.js";
import { ProblemSchema } from "./problem.js";

const app = createApp(new VaultStore(""));

describe("the API app", () => {
  it("returns a 404 problem with the code route_not_found for an unknown path", async () => {
    const response = await app.request("/api/no-such-route");

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/problem+json");
    expect(ProblemSchema.parse(await response.json()).code).toBe("route_not_found");
  });

  it("serves the OpenAPI document with the health path", async () => {
    const response = await app.request("/api/openapi.json");

    expect(response.status).toBe(200);
    const document = (await response.json()) as { paths: Record<string, unknown> };
    expect(document.paths).toHaveProperty("/api/health");
  });

  it("serves the docs page", async () => {
    const response = await app.request("/api/docs");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
  });
});
