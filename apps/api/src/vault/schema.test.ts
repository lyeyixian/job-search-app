import { describe, expect, it } from "vitest";
import { checkApplication, checkApplicationDetail, checkNote } from "./schema.js";

const valid = {
  company: "Example Co",
  title: "Backend Engineer",
  region: "sg",
  status: "applied",
  captured: new Date("2026-10-05"),
  verdict: "good-fit",
  direction: "aligned",
};

describe("checkApplication", () => {
  it("returns the fields of a correct application with no warnings", () => {
    const { fields, warnings } = checkApplication(valid);

    expect(warnings).toEqual([]);
    expect(fields).toEqual({ ...valid, captured: "2026-10-05" });
  });

  it("permits a null verdict and a null direction, for an application with no analysis yet", () => {
    const { fields, warnings } = checkApplication({ ...valid, verdict: null, direction: null });

    expect(warnings).toEqual([]);
    expect(fields.verdict).toBeNull();
  });

  it("names a missing field in a warning", () => {
    const { verdict: _, ...rest } = valid;
    const { fields, warnings } = checkApplication(rest);

    expect(warnings).toEqual([{ field: "verdict", problem: "missing" }]);
    expect(fields.verdict).toBeNull();
    expect(fields.company).toBe("Example Co");
  });

  it("names a field with a value that the rules do not permit", () => {
    const { fields, warnings } = checkApplication({ ...valid, status: "phoned", region: "moon" });

    expect(warnings).toEqual([
      { field: "region", problem: "invalid" },
      { field: "status", problem: "invalid" },
    ]);
    expect(fields.status).toBeNull();
    expect(fields.region).toBeNull();
  });
});

describe("checkApplicationDetail", () => {
  it("returns the link, the listing and the day of the fit analysis", () => {
    const { fields, warnings } = checkApplicationDetail({
      url: "https://example.com/careers/1001",
      "source-listing": "example-co/backend-engineer-1001",
      analyzed: new Date("2026-10-07"),
    });

    expect(warnings).toEqual([]);
    expect(fields).toEqual({
      url: "https://example.com/careers/1001",
      "source-listing": "example-co/backend-engineer-1001",
      analyzed: "2026-10-07",
    });
  });

  it("permits null for each field", () => {
    expect(checkApplicationDetail({ url: null, "source-listing": null, analyzed: null }).warnings).toEqual([]);
  });

  it("gives a warning for a link that is not a web address", () => {
    const { fields, warnings } = checkApplicationDetail({
      url: "javascript:alert(1)",
      "source-listing": "no-company",
      analyzed: null,
    });

    expect(fields.url).toBeNull();
    expect(warnings).toEqual([
      { field: "url", problem: "invalid" },
      { field: "source-listing", problem: "invalid" },
    ]);
  });
});

describe("checkNote", () => {
  const role = {
    company: "Northwind",
    title: "Software Engineer",
    team: "Build",
    start: "2023-01",
    end: null,
    skills: ["typescript"],
  };

  it("gives no warning for a note that follows the rules", () => {
    expect(checkNote("role", role)).toEqual([]);
    expect(checkNote("role", { ...role, programme: "northwind-graduate-programme" })).toEqual([]);
  });

  it("names a required key that the note does not have", () => {
    const { team: _team, ...rest } = role;

    expect(checkNote("role", rest)).toEqual([{ field: "team", problem: "missing" }]);
  });

  it("names a key with a value that the rules do not permit", () => {
    expect(checkNote("role", { ...role, start: "January 2023" })).toEqual([{ field: "start", problem: "invalid" }]);
    expect(
      checkNote("project", { kind: "work", start: "2024-01", end: null, skills: [], "on-profile": "yes" }),
    ).toEqual([
      { field: "kind", problem: "invalid" },
      { field: "on-profile", problem: "invalid" },
    ]);
  });

  it("gives no warning for an optional key that the note does not have", () => {
    expect(
      checkNote("project", { kind: "side-project", start: "2024-01", end: null, skills: [], "on-profile": true }),
    ).toEqual([]);
  });

  it("reads a board id of only digits and a day that YAML made a date", () => {
    const listing = {
      company: "example-co",
      "board-id": 1001,
      title: "Backend Engineer",
      url: "https://jobs.example.com/1001",
      region: "sg",
      "level-hint": "Senior",
      "first-seen": new Date("2026-10-05"),
    };

    expect(checkNote("listing", listing)).toEqual([]);
    expect(checkNote("listing", { ...listing, url: "jobs.example.com/1001" })).toEqual([
      { field: "url", problem: "invalid" },
    ]);
  });
});
