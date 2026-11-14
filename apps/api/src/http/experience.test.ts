import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { VaultStore } from "../vault/store.js";
import { createApp } from "./app.js";
import { ExperienceNoteSchema } from "./experience.js";
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

  it.each(["/api/experience/roles/no-such-role", "/api/experience/stories/slow-build"])(
    "returns a 404 problem with the code note_not_found for %s",
    async (path) => {
      const response = await app.request(path);

      expect(response.status).toBe(404);
      expect(ProblemSchema.parse(await response.json()).code).toBe("note_not_found");
    },
  );

  it("returns a 503 problem with the code index_not_ready before the first load", async () => {
    const response = await createApp(new VaultStore(fixtureVault)).request("/api/experience/roles/any");

    expect(response.status).toBe(503);
    expect(ProblemSchema.parse(await response.json()).code).toBe("index_not_ready");
  });
});
