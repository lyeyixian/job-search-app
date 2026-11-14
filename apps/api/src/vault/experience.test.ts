import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import {
  anchorOf,
  findExperienceNote,
  getExperienceNote,
  getOverview,
  getRoles,
  getSkill,
  getSkills,
} from "./experience.js";
import { loadVault, type VaultIndex } from "./load.js";
import type { Note } from "./parser.js";

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

describe("getExperienceNote, the facts of each kind", () => {
  it("gives a role note with no heading its job title, its company and its team as the title", () => {
    expect(getExperienceNote(index, "roles", "harbour-search-rotation")?.title).toBe(
      "Graduate Software Engineer, Harbour Bank (Search)",
    );
  });

  it("gives each other note with no heading its slug as words", () => {
    expect(getExperienceNote(index, "projects", "course-compiler")?.title).toBe("Course compiler");
    expect(getExperienceNote(index, "stories", "first-outage")?.title).toBe("First outage");
  });

  it("returns the facts, the skills and the stories of a role", () => {
    const note = getExperienceNote(index, "roles", "northwind-software-engineer");

    expect(note?.role).toMatchObject({
      company: "Northwind Traders",
      jobTitle: "Software Engineer",
      team: "Developer Tools",
      start: "2023-07",
      end: null,
      programme: null,
      stints: [],
    });
    expect(note?.skills).toEqual([
      { slug: "typescript", name: "TypeScript" },
      { slug: "postgres", name: "PostgreSQL" },
      { slug: "docker", name: "Docker" },
    ]);
    expect(note?.role?.stories.map((story) => story.slug)).toEqual(["slow-build", "unclear-owner"]);
    expect(note?.project).toBeNull();
    expect(note?.story).toBeNull();
  });

  it("names the programme of a stint, and the stints of a programme", () => {
    expect(getExperienceNote(index, "roles", "harbour-search-rotation")?.role?.programme).toEqual({
      kind: "roles",
      slug: "harbour-graduate-programme",
      title: "Graduate Software Engineer, Harbour Bank (Graduate Programme)",
    });
    expect(
      getExperienceNote(index, "roles", "harbour-graduate-programme")?.role?.stints.map((stint) => stint.slug),
    ).toEqual(["harbour-search-rotation", "harbour-payments-rotation"]);
  });

  it("returns the facts of a project and the frontmatter values that wait for an update", () => {
    expect(getExperienceNote(index, "projects", "recipe-box")?.project).toEqual({
      kind: "side-project",
      start: "2024-02",
      end: null,
      onProfile: true,
      link: "https://example.com/recipe-box",
    });
    const course = getExperienceNote(index, "projects", "course-compiler");
    expect(course?.project).toMatchObject({ kind: "coursework", start: "2020-01", onProfile: false, link: null });
    expect(course?.revisits).toEqual([{ field: "start", text: "semester 2 exact months" }]);
  });

  it("gives a skill that the inventory does not have its slug as the name", () => {
    expect(getExperienceNote(index, "projects", "open-maps")?.skills).toContainEqual({ slug: "rust", name: "rust" });
  });

  it("returns the competencies and the roles of a story", () => {
    const story = getExperienceNote(index, "stories", "unclear-owner");

    expect(story?.story?.competencies).toEqual(["ownership", "communication"]);
    expect(story?.story?.roles.map((role) => role.slug)).toEqual([
      "harbour-search-rotation",
      "northwind-software-engineer",
    ]);
    expect(story?.achievements).toEqual([]);
  });
});

describe("getRoles", () => {
  it("puts the newest role first and the stints of a programme in the programme", () => {
    const roles = getRoles(index);

    expect(roles.map((role) => role.slug)).toEqual([
      "northwind-software-engineer",
      "harbour-graduate-programme",
      "tinker-studio-intern",
    ]);
    expect(roles[1]?.stints.map((stint) => stint.slug)).toEqual([
      "harbour-search-rotation",
      "harbour-payments-rotation",
    ]);
    expect(roles[0]).toMatchObject({ company: "Northwind Traders", team: "Developer Tools", end: null });
  });

  it("gives a programme the place of its newest stint, and keeps a stint whose programme has no note", () => {
    const role = (slug: string, start: string, programme?: string): [string, Note] => [
      `experience/roles/${slug}.md`,
      {
        path: `experience/roles/${slug}.md`,
        slug,
        type: "role",
        frontmatter: { company: "C", title: "T", team: "X", start, end: "2030-01", programme },
        body: "",
        links: [],
        revisits: [],
      },
    ];
    const made: VaultIndex = {
      notes: new Map([
        role("programme", "2020-01"),
        role("stint", "2022-06", "programme"),
        role("between", "2021-03"),
        role("orphan", "2019-01", "no-such-programme"),
      ]),
      files: new Set(),
      loadedAt: new Date(),
    };

    expect(getRoles(made).map((entry) => entry.slug)).toEqual(["programme", "between", "orphan"]);
  });
});

describe("getOverview", () => {
  it("returns the profile without its title, the projects newest first and the stories by title", () => {
    const overview = getOverview(index);

    expect(overview.profile?.updated).toBe("2026-10");
    expect(overview.profile?.body).toContain("## Education");
    expect(overview.profile?.body).not.toContain("# Profile");
    expect(overview.projects.map((project) => project.slug)).toEqual(["recipe-box", "open-maps", "course-compiler"]);
    expect(overview.projects.map((project) => project.onProfile)).toEqual([true, true, false]);
    expect(overview.stories.map((story) => story.title)).toEqual(["First outage", "The slow build", "Unclear owner"]);
  });
});

describe("getSkills", () => {
  it("reads the pinned text, the categories, a name on two lines and the number of uses", () => {
    const skills = getSkills(index);

    expect(skills.pinned).toBe("Backend Development · TypeScript (`typescript`) · PostgreSQL (`postgres`)");
    expect(skills.categories.map((category) => category.name)).toEqual(["Languages", "Tools", "Practices"]);
    expect(skills.categories[0]?.skills).toEqual([
      { slug: "typescript", name: "TypeScript", uses: 4 },
      { slug: "python", name: "Python", uses: 1 },
      { slug: "java", name: "Java", uses: 2 },
    ]);
    expect(skills.categories[1]?.skills.at(-1)).toEqual({
      slug: "github-actions",
      name: "GitHub Actions (build pipelines and release pipelines)",
      uses: 0,
    });
  });

  it("lists a skill that a note has and the inventory does not", () => {
    expect(getSkills(index).unlisted).toEqual([{ slug: "rust", name: "rust", uses: 1 }]);
  });
});

describe("getSkill", () => {
  it("returns each role note and project note that lists the skill, newest first", () => {
    const skill = getSkill(index, "typescript");

    expect(skill).toMatchObject({ slug: "typescript", name: "TypeScript", category: "Languages" });
    expect(skill?.notes.map((note) => [note.kind, note.slug])).toEqual([
      ["projects", "recipe-box"],
      ["roles", "northwind-software-engineer"],
      ["projects", "open-maps"],
      ["roles", "tinker-studio-intern"],
    ]);
  });

  it("returns a skill of the inventory that no note lists, and a skill that only a note lists", () => {
    expect(getSkill(index, "github-actions")?.notes).toEqual([]);
    expect(getSkill(index, "rust")).toMatchObject({ name: "rust", category: null });
  });

  it("returns null for a slug that nothing has", () => {
    expect(getSkill(index, "cobol")).toBeNull();
  });
});

describe("findExperienceNote", () => {
  it("finds a project note by its slug", () => {
    expect(findExperienceNote(index, "recipe-box")?.kind).toBe("projects");
  });

  it("does not find a story, because a story has no achievement", () => {
    expect(findExperienceNote(index, "slow-build")).toBeNull();
  });
});
