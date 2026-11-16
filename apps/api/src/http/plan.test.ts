import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { VaultStore } from "../vault/store.js";
import { createApp } from "./app.js";
import { DirectionSchema, TargetsSchema } from "./plan.js";
import { ProblemSchema } from "./problem.js";

const fixtureVault = fileURLToPath(new URL("../../../../fixtures/vault", import.meta.url));

describe("GET /api/search/direction and /api/search/targets", () => {
  const store = new VaultStore(fixtureVault);
  const app = createApp(store);
  beforeAll(async () => {
    await store.load();
  });

  it("returns 200 and the direction with its link table", async () => {
    const response = await app.request("/api/search/direction");

    expect(response.status).toBe(200);
    const body = DirectionSchema.parse(await response.json());
    expect(body.targetRoles).toEqual(["backend-engineer", "platform-engineer"]);
    expect(body.links.find((link) => link.ref === "slow-build")?.state).toBe("found");
  });

  it("returns 200 and the targets with the companies of the market scan", async () => {
    const response = await app.request("/api/search/targets");

    expect(response.status).toBe(200);
    const body = TargetsSchema.parse(await response.json());
    expect(body.companies.map((company) => company.slug)).toContain("example-co");
  });

  it("names the direction in the backlinks of a story that it names", async () => {
    const response = await app.request("/api/experience/stories/slow-build");

    const story = (await response.json()) as { backlinks: { page: { kind: string } }[] };
    expect(story.backlinks.map((backlink) => backlink.page.kind)).toContain("direction");
  });

  it("returns 404 with the code note_not_found if the vault has no such note", async () => {
    const empty = new VaultStore(fileURLToPath(new URL("../../../../fixtures/vault/experience", import.meta.url)));
    await empty.load();

    for (const path of ["/api/search/direction", "/api/search/targets"]) {
      const response = await createApp(empty).request(path);
      expect(response.status).toBe(404);
      expect(ProblemSchema.parse(await response.json()).code).toBe("note_not_found");
    }
  });

  it("returns 503 before the first load", async () => {
    const response = await createApp(new VaultStore(fixtureVault)).request("/api/search/direction");

    expect(response.status).toBe(503);
  });
});
