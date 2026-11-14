import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { VaultStore } from "../vault/store.js";
import { createApp } from "./app.js";
import { CompanyListSchema, CompanySchema, ListingSchema } from "./companies.js";
import { ProblemSchema } from "./problem.js";

const fixtureVault = fileURLToPath(new URL("../../../../fixtures/vault", import.meta.url));

describe("the company routes", () => {
  const store = new VaultStore(fixtureVault);
  const app = createApp(store);
  beforeAll(async () => {
    await store.load();
  });

  it("GET /api/companies returns 200 and each company of the fixture vault", async () => {
    const response = await app.request("/api/companies");

    expect(response.status).toBe(200);
    const body = CompanyListSchema.parse(await response.json());
    expect(body.companies.map((company) => company.slug)).toEqual([
      "example-co",
      "kestrel-pay",
      "marlow-freight",
      "orchard-robotics",
    ]);
    expect(body.companies[0]).toEqual({
      slug: "example-co",
      name: "Example Co",
      mode: "active",
      lastSwept: "2026-10-20",
      openShortlisted: 2,
      listings: 4,
    });
  });

  it("GET /api/companies/{company} returns 200 and the company with each listing", async () => {
    const response = await app.request("/api/companies/example-co");

    expect(response.status).toBe(200);
    const body = CompanySchema.parse(await response.json());
    expect(body.watchlist).toMatchObject({ mode: "active", board: "https://example.com/careers" });
    expect(body.sweeps).toEqual(["2026-10-20", "2026-10-08", "2026-10-01"]);
    expect(body.listings.map((listing) => listing.triage)).toEqual(["shortlist", "shortlist", "maybe", "reject"]);
    expect(body.listings[0]).toEqual({
      company: "example-co",
      companyName: "Example Co",
      slug: "backend-engineer-1001",
      title: "Backend Engineer",
      level: "Mid",
      triage: "shortlist",
      reason: "Backend work on developer tools",
      firstSeen: "2026-10-01",
      lastSeen: "2026-10-20",
      state: "open",
      application: { slug: "example-co-backend-engineer", found: true, status: "applied" },
      warnings: [],
    });
  });

  it("GET /api/companies/{company} returns a 404 problem for a company that does not exist", async () => {
    const response = await app.request("/api/companies/no-such-company");

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/problem+json");
    expect(ProblemSchema.parse(await response.json()).code).toBe("note_not_found");
  });

  it("GET /api/companies/{company}/listings/{slug} returns 200 and the listing with its text", async () => {
    const response = await app.request("/api/companies/kestrel-pay/listings/site-reliability-engineer-2004");

    expect(response.status).toBe(200);
    const body = ListingSchema.parse(await response.json());
    expect(body).toMatchObject({
      companyName: "Kestrel Pay",
      title: "Site Reliability Engineer",
      region: "sg",
      triage: "shortlist",
      state: "closed",
      lastSeen: "2026-10-05",
      url: "https://example.com/kestrel-pay/jobs/2004",
      application: null,
    });
    expect(body.body).toContain("## What you will do");
  });

  it("GET /api/companies/{company}/listings/{slug} returns a 404 problem for a listing that does not exist", async () => {
    for (const path of [
      "/api/companies/example-co/listings/no-such-listing",
      "/api/companies/example-co/listings/index",
    ]) {
      const response = await app.request(path);

      expect(response.status).toBe(404);
      expect(ProblemSchema.parse(await response.json()).code).toBe("note_not_found");
    }
  });

  it("returns a 503 problem with the code index_not_ready before the first load", async () => {
    const empty = createApp(new VaultStore(fixtureVault));
    for (const path of [
      "/api/companies",
      "/api/companies/example-co",
      "/api/companies/example-co/listings/backend-engineer-1001",
    ]) {
      const response = await empty.request(path);

      expect(response.status).toBe(503);
      expect(ProblemSchema.parse(await response.json()).code).toBe("index_not_ready");
    }
  });
});
