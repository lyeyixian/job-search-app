import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { VaultStore } from "../vault/store.js";
import { createApp } from "./app.js";
import { ProblemSchema } from "./problem.js";
import { ShortlistSchema } from "./shortlist.js";

const fixtureVault = fileURLToPath(new URL("../../../../fixtures/vault", import.meta.url));

describe("GET /api/shortlist", () => {
  const store = new VaultStore(fixtureVault);
  const app = createApp(store);
  beforeAll(async () => {
    await store.load();
  });

  it("returns 200 and each open shortlisted listing of the fixture vault", async () => {
    const response = await app.request("/api/shortlist");

    expect(response.status).toBe(200);
    const body = ShortlistSchema.parse(await response.json());
    expect(body.listings).toHaveLength(6);
    expect(body.total).toBe(6);
    expect(body.listings[0]).toEqual({
      company: "example-co",
      companyName: "Example Co",
      slug: "backend-engineer-1001",
      title: "Backend Engineer",
      level: "Mid",
      reason: "Backend work on developer tools",
      firstSeen: "2026-10-01",
      application: { slug: "example-co-backend-engineer", found: true, status: "applied" },
      warnings: [],
    });
  });

  it("returns only the listings that match every query parameter", async () => {
    const response = await app.request("/api/shortlist?company=example-co&promoted=hide");

    const body = ShortlistSchema.parse(await response.json());
    expect(body.listings.map((listing) => listing.slug)).toEqual(["platform-engineer-1002"]);
    expect(body.total).toBe(6);
  });

  it("returns an empty list for a company that has no shortlisted listing", async () => {
    const response = await app.request("/api/shortlist?company=marlow-freight");

    expect(response.status).toBe(200);
    expect(ShortlistSchema.parse(await response.json()).listings).toEqual([]);
  });

  it("returns a 503 problem with the code index_not_ready before the first load", async () => {
    const response = await createApp(new VaultStore(fixtureVault)).request("/api/shortlist");

    expect(response.status).toBe(503);
    expect(ProblemSchema.parse(await response.json()).code).toBe("index_not_ready");
  });
});
