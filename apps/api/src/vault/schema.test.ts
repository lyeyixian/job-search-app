import { describe, expect, it } from "vitest";
import { checkApplication, checkApplicationDetail } from "./schema.js";

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
