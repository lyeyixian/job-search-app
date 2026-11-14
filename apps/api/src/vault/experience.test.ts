import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { anchorOf, findExperienceNote, getExperienceNote } from "./experience.js";
import { loadVault, type VaultIndex } from "./load.js";

const fixtureVault = fileURLToPath(new URL("../../../../fixtures/vault", import.meta.url));

let index: VaultIndex;
beforeAll(async () => {
  index = await loadVault(fixtureVault);
});

describe("anchorOf", () => {
  it("writes a heading in lower case with hyphens, and drops each other mark", () => {
    expect(anchorOf("Cut build time")).toBe("cut-build-time");
    expect(anchorOf("Pub/Sub refactor: the team's first tests (v2.0)")).toBe(
      "pubsub-refactor-the-teams-first-tests-v20",
    );
  });
});

describe("getExperienceNote", () => {
  it("returns the title, the body without the title and the achievements", () => {
    const note = getExperienceNote(index, "roles", "northwind-software-engineer");

    expect(note?.title).toBe("Software Engineer, Northwind Traders");
    expect(note?.body.startsWith("## Context")).toBe(true);
    expect(note?.achievements).toEqual([
      { anchor: "cut-build-time", title: "Cut build time" },
      { anchor: "service-catalogue", title: "Service catalogue" },
    ]);
  });

  it("returns null for a slug of the other kind", () => {
    expect(getExperienceNote(index, "projects", "northwind-software-engineer")).toBeNull();
  });
});

describe("findExperienceNote", () => {
  it("finds a project note by its slug", () => {
    expect(findExperienceNote(index, "recipe-box")?.kind).toBe("projects");
  });
});
