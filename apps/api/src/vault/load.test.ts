import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadVault } from "./load.js";

const fixtureVault = fileURLToPath(new URL("../../../../fixtures/vault", import.meta.url));

describe("loadVault", () => {
  it("indexes each markdown file of the fixture vault by its path", async () => {
    const index = await loadVault(fixtureVault);

    const posting = index.notes.get("applications/example-co-backend-engineer/posting.md");
    expect(posting?.type).toBe("application");
    expect(index.notes.get("experience/roles/northwind-software-engineer.md")?.type).toBe("role");
  });

  it("records the links of a note", async () => {
    const index = await loadVault(fixtureVault);

    const story = index.notes.get("experience/stories/slow-build.md");
    expect(story?.links).toContainEqual({ target: "northwind-software-engineer", anchor: "cut-build-time" });
  });
});
