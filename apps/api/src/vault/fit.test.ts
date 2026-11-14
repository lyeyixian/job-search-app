import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { evidenceParts, parseFitAnalysis, splitPosting } from "./fit.js";
import { loadVault, type VaultIndex } from "./load.js";

const fixtureVault = fileURLToPath(new URL("../../../../fixtures/vault", import.meta.url));

let index: VaultIndex;
beforeAll(async () => {
  index = await loadVault(fixtureVault);
});

describe("splitPosting", () => {
  it("splits the body at the heading of the fit analysis", () => {
    const { posting, fit } = splitPosting("# Title\n\nThe job.\n\n## Fit analysis\n\n### Verdict: skip\n\nNo.\n");

    expect(posting).toBe("# Title\n\nThe job.");
    expect(fit).toBe("### Verdict: skip\n\nNo.");
  });

  it("returns a null fit analysis for a body with no such heading", () => {
    expect(splitPosting("# Title\n\nThe job.\n")).toEqual({ posting: "# Title\n\nThe job.", fit: null });
  });
});

describe("evidenceParts", () => {
  it("finds a reference with or without backticks, and the title of its achievement", () => {
    const parts = evidenceParts(index, "`recipe-box#shopping-list`: one. northwind-software-engineer#cut-build-time");

    expect(parts).toEqual([
      {
        type: "achievement",
        ref: "recipe-box#shopping-list",
        slug: "recipe-box",
        anchor: "shopping-list",
        note: "projects",
        noteTitle: "Recipe box",
        title: "Shopping list",
      },
      { type: "text", text: ": one. " },
      {
        type: "achievement",
        ref: "northwind-software-engineer#cut-build-time",
        slug: "northwind-software-engineer",
        anchor: "cut-build-time",
        note: "roles",
        noteTitle: "Software Engineer, Northwind Traders",
        title: "Cut build time",
      },
    ]);
  });

  it("marks a reference to a note or an achievement that does not exist", () => {
    const [noNote, , noAchievement] = evidenceParts(index, "no-such-note#thing and recipe-box#no-such-thing");

    expect(noNote).toMatchObject({ note: null, noteTitle: null, title: null });
    expect(noAchievement).toMatchObject({ note: "projects", title: null });
  });

  it("returns no parts for an empty cell", () => {
    expect(evidenceParts(index, "")).toEqual([]);
  });
});

describe("parseFitAnalysis", () => {
  const parse = (text: string) => parseFitAnalysis(index, text);

  it("reads the four parts, with or without backticks in the headings", () => {
    const analysis = parse(
      [
        "### Verdict: `stretch`",
        "",
        "Why.",
        "",
        "### Direction: caution",
        "",
        "- **Caution:** because.",
        "",
        "### Requirements",
        "",
        "| Requirement | Kind | Firmness | Grade | Evidence |",
        "|---|---|---|---|---|",
        "| Go \\| Rust | must-have (responsibility) | likely-firm | `partial` | |",
        "",
        "### Gaps & bridging actions",
        "",
        "- **Go:** `learning`. Write a small tool.",
      ].join("\n"),
    );

    expect(analysis.verdict).toBe("Why.");
    expect(analysis.direction).toBe("- **Caution:** because.");
    expect(analysis.requirements).toEqual([
      {
        requirement: "Go | Rust",
        kind: "must-have",
        kindNote: "responsibility",
        firmness: "likely-firm",
        grade: "partial",
        evidence: [],
      },
    ]);
    expect(analysis.gaps).toEqual([
      { kind: null, requirement: "Go", grade: null, action: "learning", text: "Write a small tool." },
    ]);
  });

  it("reads the gaps below their group lines, each form of a list item", () => {
    const { gaps } = parse(
      [
        "### Gaps and bridging actions",
        "",
        "**Must-haves**",
        "",
        "- **One** (partial): `positioning`. Say this,",
        "  and say that.",
        "- **Two** (gap). `learning`: read a book.",
        "",
        "Nice-to-haves:",
        "",
        "- **Three** learning: build it.",
        "- A gap with no name.",
        "- Four, plain (gap). **positioning**: say it.",
        "1. **Five**, `learning`. Read it (partial) twice.",
        "- **Six** (gap, must-have) - `learning`: ship it.",
      ].join("\n"),
    );

    expect(gaps).toEqual([
      {
        kind: "must-have",
        requirement: "One",
        grade: "partial",
        action: "positioning",
        text: "Say this, and say that.",
      },
      { kind: "must-have", requirement: "Two", grade: "gap", action: "learning", text: "Read a book." },
      { kind: "nice-to-have", requirement: "Three", grade: null, action: "learning", text: "Build it." },
      { kind: "nice-to-have", requirement: null, grade: null, action: null, text: "A gap with no name." },
      { kind: "nice-to-have", requirement: "Four, plain", grade: "gap", action: "positioning", text: "Say it." },
      { kind: "nice-to-have", requirement: "Five", grade: null, action: "learning", text: "Read it (partial) twice." },
      { kind: "nice-to-have", requirement: "Six", grade: "gap", action: "learning", text: "Ship it." },
    ]);
  });

  it("reads the gaps from a table", () => {
    const { gaps, gapsNote } = parse(
      [
        "### Gaps and bridging actions",
        "",
        "Must-haves first.",
        "",
        "| Requirement | Grade | Action | What to do |",
        "|---|---|---|---|",
        "| React | partial | `positioning` | Lead with the side project. |",
      ].join("\n"),
    );

    expect(gaps).toEqual([
      {
        kind: null,
        requirement: "React",
        grade: "partial",
        action: "positioning",
        text: "Lead with the side project.",
      },
    ]);
    expect(gapsNote).toBe("Must-haves first.");
  });

  it("returns empty parts for a text that has none", () => {
    expect(parse("")).toEqual({ verdict: "", direction: "", requirements: [], gaps: [], gapsNote: "" });
  });
});
