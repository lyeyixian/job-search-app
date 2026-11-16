import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { loadVault, type VaultIndex } from "./load.js";
import { parseNote } from "./parser.js";
import { getDirection, getTargets, sectionsOf } from "./plan.js";

const fixtureVault = fileURLToPath(new URL("../../../../fixtures/vault", import.meta.url));

let index: VaultIndex;
beforeAll(async () => {
  index = await loadVault(fixtureVault);
});

function vault(notes: Record<string, string>): VaultIndex {
  return {
    notes: new Map(Object.entries(notes).map(([path, source]) => [path, parseNote(path, source)])),
    files: new Set(Object.keys(notes)),
    loadedAt: new Date(),
  };
}

describe("sectionsOf", () => {
  it("lists the ## headings in the order of the note", () => {
    expect(sectionsOf("## Target roles\n\ntext\n\n### Not a section\n\n## What I want next\n")).toEqual([
      { anchor: "target-roles", title: "Target roles" },
      { anchor: "what-i-want-next", title: "What I want next" },
    ]);
  });

  it("skips a heading in a code block, and gives one section to two headings with the same text", () => {
    expect(sectionsOf("## One\n\n```\n## In code\n```\n\n## One\n")).toEqual([{ anchor: "one", title: "One" }]);
  });
});

describe("getDirection", () => {
  it("reads the title, the target roles, the last update and the sections", () => {
    const direction = getDirection(index);

    expect(direction?.title).toBe("Direction");
    expect(direction?.targetRoles).toEqual(["backend-engineer", "platform-engineer"]);
    expect(direction?.updated).toBe("2026-10");
    expect(direction?.sections.map((section) => section.title)).toEqual([
      "Target roles",
      "What I want next",
      "Avoid",
      "Constraints",
    ]);
    expect(direction?.body).not.toContain("# Direction");
    expect(direction?.warnings).toEqual([]);
  });

  it("gives a warning for each field that is missing or not permitted", () => {
    const direction = getDirection(vault({ "search/direction.md": "---\ntype: direction\nupdated: last week\n---\n" }));

    expect(direction?.updated).toBeNull();
    expect(direction?.targetRoles).toEqual([]);
    expect(direction?.warnings).toEqual([
      { field: "updated", problem: "invalid" },
      { field: "target-roles", problem: "missing" },
    ]);
  });

  it("is null if the vault has no direction", () => {
    expect(getDirection(vault({}))).toBeNull();
  });
});

describe("getTargets", () => {
  it("reads a day as the last update", () => {
    expect(getTargets(index)?.updated).toBe("2026-10-21");
  });

  it("finds each company that starts a list item or a table cell and that the market scan has", () => {
    expect(getTargets(index)?.companies).toEqual([
      { text: "Marlow Freight", slug: "marlow-freight" },
      { text: "Example Co", slug: "example-co" },
      // The slug of one part of the name is the folder.
      { text: "Kestrel Pay / Kestrel Payments", slug: "kestrel-pay" },
      { text: "Orchard Robotics", slug: "orchard-robotics" },
    ]);
  });

  it("leaves out a company that the market scan does not have", () => {
    const texts = getTargets(index)?.companies.map((company) => company.text);

    expect(texts).not.toContain("Lumen Labs");
    expect(texts).not.toContain("Quill Works");
  });
});
