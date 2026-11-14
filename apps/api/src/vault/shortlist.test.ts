import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { loadVault, type VaultIndex } from "./load.js";
import { parseNote } from "./parser.js";
import { getShortlist, indexRows } from "./shortlist.js";

const fixtureVault = fileURLToPath(new URL("../../../../fixtures/vault", import.meta.url));

let index: VaultIndex;
beforeAll(async () => {
  index = await loadVault(fixtureVault);
});

/** An index that holds only the given notes. */
function indexOf(notes: Record<string, string>): VaultIndex {
  return {
    notes: new Map(Object.entries(notes).map(([path, source]) => [path, parseNote(path, source)])),
    files: new Set(Object.keys(notes)),
    loadedAt: new Date(),
  };
}

const HEADER = [
  "| Listing | Level | Triage | Reason | First seen | Last seen | State | Application |",
  "|---|---|---|---|---|---|---|---|",
];
const companyIndex = (name: string, ...rows: string[]) =>
  [`# ${name} - listing index`, "", ...HEADER, ...rows].join("\n");

describe("indexRows", () => {
  it("reads each row of each company index", () => {
    const rows = indexRows(index);

    expect(rows).toHaveLength(13);
    expect(rows.find((row) => row.slug === "data-engineer-1004")).toEqual({
      company: "example-co",
      companyName: "Example Co",
      slug: "data-engineer-1004",
      title: "Data Engineer",
      level: "Senior",
      triage: "maybe",
      reason: "Data pipelines, senior level",
      firstSeen: "2026-10-01",
      state: "closed",
      application: null,
      warnings: [],
    });
  });

  it("reads a bar in the label of a link, and a title that has one", () => {
    const rows = indexRows(
      indexOf({
        "search/market/acme/index.md": companyIndex(
          "Acme",
          "| [[engineer-1\\|Engineer, Tools \\| Platform]] | Mid | shortlist | A reason | 2026-10-01 | 2026-10-02 | open | |",
        ),
      }),
    );

    expect(rows[0]).toMatchObject({ slug: "engineer-1", title: "Engineer, Tools | Platform" });
  });

  it("gives a warning for a day that is not a day, and null for a triage and a state that the rules do not permit", () => {
    const rows = indexRows(
      indexOf({
        "search/market/acme/index.md": companyIndex(
          "Acme",
          "| [[engineer-1\\|Engineer]] | Mid | later | A reason | last week | 2026-10-02 | paused | |",
          "| [[engineer-2\\|Engineer]] | Mid | shortlist | A reason | | 2026-10-02 | open | |",
        ),
      }),
    );

    expect(rows[0]).toMatchObject({ triage: null, state: null, firstSeen: null });
    expect(rows[0]?.warnings).toEqual([{ field: "First seen", problem: "invalid" }]);
    expect(rows[1]?.warnings).toEqual([{ field: "First seen", problem: "missing" }]);
  });

  it("uses the folder as the name of a company if the index has no heading, and skips a row with no link", () => {
    const rows = indexRows(
      indexOf({
        "search/market/acme/index.md": [
          ...HEADER,
          "| Engineer | Mid | shortlist | A reason | 2026-10-01 | 2026-10-02 | open | |",
          "| [[engineer-2]] | Mid | shortlist | A reason | 2026-10-01 | 2026-10-02 | open | |",
        ].join("\n"),
      }),
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ companyName: "acme", slug: "engineer-2", title: "engineer-2" });
  });
});

describe("getShortlist", () => {
  it("returns only the open listings with the triage shortlist", () => {
    const shortlist = getShortlist(index);

    expect(shortlist.total).toBe(6);
    const slugs = shortlist.listings.map((listing) => listing.slug);
    // Closed with the triage `shortlist`, open with `maybe`, open with `reject`.
    expect(slugs).not.toContain("site-reliability-engineer-2004");
    expect(slugs).not.toContain("firmware-engineer-3002");
    expect(slugs).not.toContain("support-engineer-1003");
  });

  it("keeps the listings of one company together, and puts the newest first in each company", () => {
    expect(getShortlist(index).listings.map((listing) => `${listing.company}/${listing.slug}`)).toEqual([
      "example-co/backend-engineer-1001",
      "example-co/platform-engineer-1002",
      "kestrel-pay/payments-platform-engineer-2002",
      "kestrel-pay/developer-tools-engineer-2003",
      "kestrel-pay/software-engineer-2001",
      "orchard-robotics/software-engineer-3001",
    ]);
  });

  it("returns the status of the application of a promoted listing", () => {
    const listings = getShortlist(index).listings;

    expect(listings.find((listing) => listing.slug === "software-engineer-3001")?.application).toEqual({
      slug: "orchard-robotics-software-engineer",
      found: true,
      status: "interviewing",
    });
    expect(listings.find((listing) => listing.slug === "platform-engineer-1002")?.application).toBeNull();
  });

  it("says that an application does not exist", () => {
    const shortlist = getShortlist(
      indexOf({
        "search/market/acme/index.md": companyIndex(
          "Acme",
          "| [[engineer-1\\|Engineer]] | Mid | shortlist | A reason | 2026-10-01 | 2026-10-02 | open | acme-engineer |",
        ),
      }),
    );

    expect(shortlist.listings[0]?.application).toEqual({ slug: "acme-engineer", found: false, status: null });
  });

  it("narrows to one company and hides promoted listings, and keeps the total and the companies", () => {
    const shortlist = getShortlist(index, { company: "kestrel-pay", promoted: "hide" });

    expect(shortlist.listings.map((listing) => listing.slug)).toEqual([
      "payments-platform-engineer-2002",
      "developer-tools-engineer-2003",
    ]);
    expect(shortlist.total).toBe(6);
    expect(shortlist.companies).toEqual([
      { slug: "example-co", name: "Example Co", count: 2 },
      { slug: "kestrel-pay", name: "Kestrel Pay", count: 3 },
      { slug: "orchard-robotics", name: "Orchard Robotics", count: 1 },
    ]);
  });

  it("returns an empty shortlist for a vault with no shortlisted listing", () => {
    const shortlist = getShortlist(
      indexOf({
        "search/market/acme/index.md": companyIndex(
          "Acme",
          "| [[engineer-1\\|Engineer]] | Mid | maybe | A reason | 2026-10-01 | 2026-10-02 | open | |",
        ),
      }),
    );

    expect(shortlist).toEqual({ listings: [], total: 0, companies: [] });
  });
});
