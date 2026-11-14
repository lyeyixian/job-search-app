import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { VaultStore } from "../vault/store.js";
import { createApp } from "./app.js";
import { ExperienceNoteSchema, ExperienceOverviewSchema, SkillsInventorySchema, SkillUseSchema } from "./experience.js";
import { ProblemSchema } from "./problem.js";

const fixtureVault = fileURLToPath(new URL("../../../../fixtures/vault", import.meta.url));

describe("GET /api/experience/{kind}/{slug}", () => {
  const store = new VaultStore(fixtureVault);
  const app = createApp(store);
  beforeAll(async () => {
    await store.load();
  });

  it("returns 200 and a role note with its achievements", async () => {
    const response = await app.request("/api/experience/roles/northwind-software-engineer");

    expect(response.status).toBe(200);
    const body = ExperienceNoteSchema.parse(await response.json());
    expect(body.title).toBe("Software Engineer, Northwind Traders");
    expect(body.achievements.map((achievement) => achievement.anchor)).toContain("cut-build-time");
  });

  it("returns 200 and a project note", async () => {
    const response = await app.request("/api/experience/projects/recipe-box");

    expect(ExperienceNoteSchema.parse(await response.json()).kind).toBe("projects");
  });

  it("returns 200 and a story", async () => {
    const response = await app.request("/api/experience/stories/slow-build");

    const body = ExperienceNoteSchema.parse(await response.json());
    expect(body.story?.competencies).toEqual(["ownership", "technical-depth"]);
    expect(body.role).toBeNull();
  });

  it.each([
    "/api/experience/roles/no-such-role",
    "/api/experience/journal/2026-10-01",
    "/api/experience/roles/slow-build",
  ])("returns a 404 problem with the code note_not_found for %s", async (path) => {
    const response = await app.request(path);

    expect(response.status).toBe(404);
    expect(ProblemSchema.parse(await response.json()).code).toBe("note_not_found");
  });

  it("returns a 503 problem with the code index_not_ready before the first load", async () => {
    const response = await createApp(new VaultStore(fixtureVault)).request("/api/experience/roles/any");

    expect(response.status).toBe(503);
    expect(ProblemSchema.parse(await response.json()).code).toBe("index_not_ready");
  });
});

describe("GET /api/experience", () => {
  const store = new VaultStore(fixtureVault);
  const app = createApp(store);
  beforeAll(async () => {
    await store.load();
  });

  it("returns 200 with the profile and the three lists", async () => {
    const response = await app.request("/api/experience");

    expect(response.status).toBe(200);
    const body = ExperienceOverviewSchema.parse(await response.json());
    expect(body.profile?.body).toContain("Alex Tan");
    expect(body.roles).toHaveLength(3);
    expect(body.projects).toHaveLength(3);
    expect(body.stories).toHaveLength(3);
  });

  it("returns a 503 problem with the code index_not_ready before the first load", async () => {
    const response = await createApp(new VaultStore(fixtureVault)).request("/api/experience");

    expect(response.status).toBe(503);
    expect(ProblemSchema.parse(await response.json()).code).toBe("index_not_ready");
  });
});

describe("GET /api/experience/skills", () => {
  const store = new VaultStore(fixtureVault);
  const app = createApp(store);
  beforeAll(async () => {
    await store.load();
  });

  it("returns 200 and the inventory", async () => {
    const response = await app.request("/api/experience/skills");

    expect(response.status).toBe(200);
    const body = SkillsInventorySchema.parse(await response.json());
    expect(body.categories.map((category) => category.name)).toEqual(["Languages", "Tools", "Practices"]);
  });

  it("returns 200 and one skill with the notes that list it", async () => {
    const response = await app.request("/api/experience/skills/postgres");

    expect(response.status).toBe(200);
    const body = SkillUseSchema.parse(await response.json());
    expect(body.name).toBe("PostgreSQL");
    expect(body.notes.map((note) => note.slug)).toEqual([
      "recipe-box",
      "northwind-software-engineer",
      "harbour-payments-rotation",
    ]);
  });

  it("returns a 404 problem with the code note_not_found for a skill that nothing has", async () => {
    const response = await app.request("/api/experience/skills/cobol");

    expect(response.status).toBe(404);
    expect(ProblemSchema.parse(await response.json()).code).toBe("note_not_found");
  });
});
