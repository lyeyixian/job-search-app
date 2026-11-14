import { describe, expect, it } from "vitest";
import { findLinks, parseNote } from "./parser.js";

describe("parseNote", () => {
  it("splits the frontmatter from the body", () => {
    const note = parseNote("experience/roles/example-role.md", "---\ntype: role\ntitle: Engineer\n---\n\n# Body\n");

    expect(note.slug).toBe("example-role");
    expect(note.type).toBe("role");
    expect(note.frontmatter.title).toBe("Engineer");
    expect(note.body.trim()).toBe("# Body");
  });

  it("gives a note with no frontmatter a null type", () => {
    expect(parseNote("README.md", "# Title\n").type).toBeNull();
  });
});

describe("findLinks", () => {
  it("finds a wikilink, its anchor and ignores its label", () => {
    const links = findLinks("See [[example-role#cut-build-time|the build work]] and [[example-story]].");

    expect(links).toEqual([
      { target: "example-role", anchor: "cut-build-time" },
      { target: "example-story", anchor: null },
    ]);
  });

  it("skips a wikilink in code", () => {
    expect(findLinks("Write `[[slug]]` to link.\n\n```\n[[other]]\n```\n")).toEqual([]);
  });
});
