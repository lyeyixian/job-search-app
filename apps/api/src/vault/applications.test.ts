import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { getApplication, listApplications, readResume } from "./applications.js";
import { loadVault, type VaultIndex } from "./load.js";

const fixtureVault = fileURLToPath(new URL("../../../../fixtures/vault", import.meta.url));

let index: VaultIndex;
beforeAll(async () => {
  index = await loadVault(fixtureVault);
});

describe("listApplications", () => {
  it("names each application by its folder", () => {
    const slugs = listApplications(index).applications.map((application) => application.slug);

    expect(slugs).toContain("example-co-backend-engineer");
    expect(slugs).not.toContain("posting");
  });

  it("puts the best verdict first, then the newest application", () => {
    const analyzed = listApplications(index)
      .applications.filter((application) => application.status === "analyzed")
      .map((application) => application.slug);

    expect(analyzed).toEqual([
      "northgate-systems-software-engineer",
      "quill-works-full-stack-engineer",
      "pine-street-backend-engineer",
      "example-co-platform-engineer",
      "lumen-labs-platform-engineer",
      "tidewater-data-engineer",
    ]);
  });

  it("knows which application has a resume PDF", () => {
    const { applications } = listApplications(index);
    const bySlug = new Map(applications.map((application) => [application.slug, application]));

    expect(bySlug.get("northgate-systems-software-engineer")?.hasResume).toBe(true);
    expect(bySlug.get("pine-street-backend-engineer")?.hasResume).toBe(false);
  });

  it("keeps an application with a missing field, with a warning", () => {
    const harbor = listApplications(index).applications.find(
      (application) => application.slug === "harbor-data-software-engineer",
    );

    expect(harbor?.verdict).toBeNull();
    expect(harbor?.status).toBe("rejected");
    expect(harbor?.warnings).toEqual([{ field: "verdict", problem: "missing" }]);
  });

  it("returns only the applications that match each choice", () => {
    const { applications } = listApplications(index, { company: "Example Co", verdict: "stretch" });

    expect(applications.map((application) => application.slug)).toEqual(["example-co-platform-engineer"]);
  });

  it("lists the choices from all applications, also when a filter applies", () => {
    const { choices } = listApplications(index, { company: "Example Co" });

    expect(choices.companies).toContain("Tidewater");
    expect(choices.regions).toEqual(["sg", "remote"]);
    expect(choices.verdicts).toEqual(["strong-fit", "good-fit", "stretch", "skip"]);
    expect(choices.directions).toEqual(["aligned", "caution", "conflict"]);
  });
});

describe("getApplication", () => {
  it("returns the facts, the posting without the fit analysis, and the fit analysis", () => {
    const application = getApplication(index, "example-co-backend-engineer");

    expect(application).toMatchObject({
      company: "Example Co",
      url: "https://example.com/careers/1001",
      captured: "2026-10-05",
      analyzed: "2026-10-07",
      listing: { company: "example-co", slug: "backend-engineer-1001", title: "Backend Engineer" },
      hasResume: true,
      warnings: [],
    });
    expect(application?.posting.startsWith("Example Co is a made-up company.")).toBe(true);
    expect(application?.posting).not.toContain("Fit analysis");
    expect(application?.fit?.requirements).toHaveLength(6);
    expect(application?.fit?.gaps.map((gap) => gap.action)).toEqual(["positioning", "learning", "learning"]);
  });

  it("returns a null link and a null listing for an application that has none", () => {
    expect(getApplication(index, "pine-street-backend-engineer")).toMatchObject({ url: null, listing: null });
  });

  it("returns a null fit analysis for a note that has none", () => {
    expect(getApplication(index, "harbor-data-software-engineer")?.fit).toBeNull();
  });

  it("returns null for a slug that no application has", () => {
    expect(getApplication(index, "no-such-application")).toBeNull();
  });
});

describe("readResume", () => {
  it("returns the PDF of an application that has one", async () => {
    const pdf = await readResume(fixtureVault, index, "example-co-backend-engineer");

    expect(new TextDecoder().decode(pdf?.slice(0, 5))).toBe("%PDF-");
  });

  it("returns null for an application with no resume, and for a path outside the vault", async () => {
    expect(await readResume(fixtureVault, index, "pine-street-backend-engineer")).toBeNull();
    expect(await readResume(fixtureVault, index, "../../..")).toBeNull();
  });
});
