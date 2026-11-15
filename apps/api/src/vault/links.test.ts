import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { backlinksOf, findTarget, linksOf, notePath, pageOf, resolveLink } from "./links.js";
import { loadVault, type VaultIndex } from "./load.js";
import { parseNote } from "./parser.js";

const fixtureVault = fileURLToPath(new URL("../../../../fixtures/vault", import.meta.url));
const STORY = notePath.experience("stories", "slow-build");
const ROLE = notePath.experience("roles", "northwind-software-engineer");

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

describe("pageOf", () => {
  it("gives the page of each kind of note", () => {
    expect(pageOf(ROLE)).toEqual({ kind: "roles", slug: "northwind-software-engineer", company: null });
    expect(pageOf("applications/example-co-backend-engineer/posting.md")?.kind).toBe("applications");
    expect(pageOf("search/market/example-co/backend-engineer-1001.md")).toEqual({
      kind: "listings",
      slug: "backend-engineer-1001",
      company: "example-co",
    });
    expect(pageOf("experience/profile.md")?.kind).toBe("profile");
  });

  it("gives no page to a company index, a journal file and the direction", () => {
    expect(pageOf("search/market/example-co/index.md")).toBeNull();
    expect(pageOf("experience/journal/2026-10-01.md")).toBeNull();
    expect(pageOf("search/direction.md")).toBeNull();
  });
});

describe("resolveLink", () => {
  const resolve = (target: string, anchor: string | null = null) => resolveLink(index, STORY, { target, anchor });

  it("resolves a link to a note with the title of the note", () => {
    expect(resolve("recipe-box")).toEqual({
      ref: "recipe-box",
      state: "found",
      page: { kind: "projects", slug: "recipe-box", company: null },
      anchor: null,
      title: "Recipe box",
    });
  });

  it("resolves a link to an achievement with the heading of the achievement", () => {
    expect(resolve("northwind-software-engineer", "cut-build-time")).toMatchObject({
      ref: "northwind-software-engineer#cut-build-time",
      state: "found",
      anchor: "cut-build-time",
      title: "Cut build time",
    });
  });

  it("reads an anchor that is written as the heading", () => {
    expect(resolve("northwind-software-engineer", "Cut build time")).toMatchObject({
      state: "found",
      anchor: "cut-build-time",
    });
  });

  it("marks a note that does not exist and an achievement that does not exist as missing", () => {
    expect(resolve("missing-note")).toMatchObject({ state: "missing", page: null, title: null });
    expect(resolve("northwind-software-engineer", "no-such-achievement")).toMatchObject({
      ref: "northwind-software-engineer#no-such-achievement",
      state: "missing",
      page: null,
    });
  });

  it("resolves an application by the name of its folder", () => {
    expect(resolve("example-co-backend-engineer")).toMatchObject({
      state: "found",
      page: { kind: "applications", slug: "example-co-backend-engineer" },
      title: "Backend Engineer, Example Co",
    });
  });

  it("resolves a listing that is written with its company", () => {
    expect(resolve("example-co/backend-engineer-1001")).toMatchObject({
      state: "found",
      page: { kind: "listings", slug: "backend-engineer-1001", company: "example-co" },
      title: "Backend Engineer, Example Co",
    });
  });

  it("gives a journal file and the direction the state no-page", () => {
    expect(resolve("2026-10-01")).toMatchObject({ state: "no-page", page: null, title: "2026-10-01" });
    expect(resolve("direction")).toMatchObject({ state: "no-page", page: null });
  });
});

describe("findTarget", () => {
  const listing = "---\ntype: listing\ntitle: Engineer\n---\n";
  const twoCompanies = vault({
    "search/market/alpha/index.md": "# Alpha - listing index\n",
    "search/market/alpha/engineer-1.md": listing,
    "search/market/beta/engineer-1.md": listing,
    "search/market/beta/analyst-2.md": listing,
    "experience/stories/a-story.md": "---\ntype: story\n---\n",
  });

  it("finds a listing in the company of the note that has the link", () => {
    expect(findTarget(twoCompanies, "search/market/beta/index.md", "engineer-1")?.path).toBe(
      "search/market/beta/engineer-1.md",
    );
  });

  it("finds a listing from a different folder only if one company has the name", () => {
    expect(findTarget(twoCompanies, "experience/stories/a-story.md", "analyst-2")?.path).toBe(
      "search/market/beta/analyst-2.md",
    );
    expect(findTarget(twoCompanies, "experience/stories/a-story.md", "engineer-1")).toBeNull();
  });

  it("does not read the index of a company as a listing", () => {
    expect(findTarget(twoCompanies, "experience/stories/a-story.md", "alpha/index")).toBeNull();
  });
});

describe("linksOf", () => {
  it("has each link of the text one time", () => {
    const refs = linksOf(index, STORY).map((link) => link.ref);

    expect(refs).toContain("northwind-software-engineer#cut-build-time");
    expect(refs).toContain("missing-note");
    expect(new Set(refs).size).toBe(refs.length);
  });

  it("is empty for a note that the vault does not have", () => {
    expect(linksOf(index, "experience/stories/no-such-story.md")).toEqual([]);
  });
});

describe("backlinksOf", () => {
  it("lists the notes that name a role, with the achievements that they name", () => {
    const backlinks = backlinksOf(index, ROLE);
    const byKind = (kind: string) => backlinks.filter((backlink) => backlink.page.kind === kind);

    // The story names the role in its text and in its facts. It is in the list one time.
    expect(byKind("stories").map((backlink) => backlink.page.slug)).toEqual(["slow-build", "unclear-owner"]);
    expect(byKind("stories")[0]?.achievements).toEqual([{ anchor: "cut-build-time", title: "Cut build time" }]);
    expect(byKind("profile")).toHaveLength(1);

    const application = byKind("applications").find(({ page }) => page.slug === "example-co-backend-engineer");
    expect(application?.title).toBe("Backend Engineer, Example Co");
    expect(application?.achievements.map(({ anchor }) => anchor)).toEqual(["cut-build-time", "service-catalogue"]);
  });

  it("puts the notes of one kind together", () => {
    const kinds = backlinksOf(index, ROLE).map((backlink) => backlink.page.kind);

    expect(kinds).toEqual([...kinds].sort((a, b) => kinds.indexOf(a) - kinds.indexOf(b)));
  });

  it("counts a stint as a note that names its programme", () => {
    const backlinks = backlinksOf(index, notePath.experience("roles", "harbour-graduate-programme"));

    expect(backlinks.map((backlink) => backlink.page.slug)).toEqual(
      expect.arrayContaining(["harbour-payments-rotation", "harbour-search-rotation"]),
    );
  });

  it("links an application and its listing in both directions", () => {
    const application = backlinksOf(index, notePath.application("example-co-backend-engineer"));
    const listing = backlinksOf(index, notePath.listing("example-co", "backend-engineer-1001"));

    expect(application.map(({ page }) => page.kind)).toEqual(["stories", "listings"]);
    expect(listing.map(({ page }) => page.slug)).toEqual(["slow-build", "example-co-backend-engineer"]);
  });

  it("does not count a link to an achievement that does not exist, or a note with no page", () => {
    const only = vault({
      "experience/roles/a-role.md": "---\ntype: role\n---\n## Achievements\n\n### Real work\n",
      "experience/stories/a-story.md": "---\ntype: story\n---\nSee [[a-role#no-such-work]].",
      "experience/journal/2026-01-01.md": "See [[a-role]].",
    });

    expect(backlinksOf(only, "experience/roles/a-role.md")).toEqual([]);
  });
});
