import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { getCompanies, getCompany, getListing, watchlist } from "./companies.js";
import { loadVault, type VaultIndex } from "./load.js";
import { parseNote } from "./parser.js";

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
const companyIndex = (name: string, ...lines: string[]) =>
  [`# ${name} - listing index`, "", ...HEADER, ...lines].join("\n");

describe("watchlist", () => {
  it("reads the items of each company and leaves out the instructions for a sweep", () => {
    const entries = watchlist(index);

    expect(entries.map((entry) => entry.name)).toEqual([
      "Example Co",
      "Kestrel Pay",
      "Orchard Robotics",
      "Marlow Freight",
    ]);
    expect(entries[0]).toEqual({
      name: "Example Co",
      mode: "active",
      lastSwept: "2026-10-20",
      board: "https://example.com/careers",
      notes: [
        "- Caps **two active applications** for each person, so the shortlist matters more than the",
        "  long list.",
        "- The level is set after the interviews.",
      ].join("\n"),
      pay: "Mid median about SGD 120K (a made-up number)",
      remote: "hybrid, three days in the office",
    });
    expect(entries[3]).toMatchObject({ mode: "watch", notes: "none" });
  });

  it("reads an item that continues on the next lines, and text before the first company", () => {
    const entries = watchlist(
      indexOf({
        "search/market/watchlist.md": [
          "# Watchlist",
          "",
          "- `mode` is one of the fields.",
          "- **mode:** this line is before the first company",
          "",
          "---",
          "",
          "## Acme",
          "",
          "- **board:** see the careers page",
          "- **comp:** about SGD 100K",
          "  (one source)",
          "- **last-swept:** soon",
          "- **mode:** paused",
          "",
          "---",
        ].join("\n"),
      }),
    );

    expect(entries).toEqual([
      {
        name: "Acme",
        mode: null,
        lastSwept: null,
        board: null,
        notes: "",
        pay: "about SGD 100K\n(one source)",
        remote: "",
      },
    ]);
  });
});

describe("getCompanies", () => {
  it("gives each company with a listing index, in the order of the names", () => {
    expect(getCompanies(index)).toEqual([
      {
        slug: "example-co",
        name: "Example Co",
        mode: "active",
        lastSwept: "2026-10-20",
        openShortlisted: 2,
        listings: 4,
      },
      {
        slug: "kestrel-pay",
        name: "Kestrel Pay",
        mode: "active",
        lastSwept: "2026-10-18",
        openShortlisted: 3,
        listings: 5,
      },
      {
        slug: "marlow-freight",
        name: "Marlow Freight",
        mode: "watch",
        lastSwept: "2026-10-14",
        openShortlisted: 0,
        listings: 2,
      },
      {
        slug: "orchard-robotics",
        name: "Orchard Robotics",
        mode: "active",
        lastSwept: "2026-10-16",
        openShortlisted: 1,
        listings: 3,
      },
    ]);
  });

  it("finds the watchlist entry by the folder when the heading has a second name", () => {
    const companies = getCompanies(
      indexOf({
        "search/market/watchlist.md": "## Acme / Acme Labs\n\n- **last-swept:** 2026-10-02\n- **mode:** watch\n",
        "search/market/acme/index.md": companyIndex("Acme"),
      }),
    );

    expect(companies).toEqual([
      { slug: "acme", name: "Acme", mode: "watch", lastSwept: "2026-10-02", openShortlisted: 0, listings: 0 },
    ]);
  });

  it("uses the sweep log for a company that is not on the watchlist", () => {
    const companies = getCompanies(
      indexOf({
        "search/market/acme/index.md": companyIndex(
          "Acme",
          "",
          "## Sweep log",
          "",
          "- **2026-10-01** - recipe: none",
          "- **2026-10-09** - recipe: none",
        ),
      }),
    );

    expect(companies[0]).toMatchObject({ mode: null, lastSwept: "2026-10-09" });
  });
});

describe("getCompany", () => {
  it("gives the rows in the order shortlist, maybe, reject, with open listings first", () => {
    const company = getCompany(index, "kestrel-pay");

    expect(company?.listings.map((row) => [row.slug, row.triage, row.state])).toEqual([
      ["payments-platform-engineer-2002", "shortlist", "open"],
      ["developer-tools-engineer-2003", "shortlist", "open"],
      ["software-engineer-2001", "shortlist", "open"],
      ["site-reliability-engineer-2004", "shortlist", "closed"],
      ["engineering-manager-2005", "reject", "open"],
    ]);
    expect(company?.listings[3]).toMatchObject({ firstSeen: "2026-09-20", lastSeen: "2026-10-05" });
  });

  it("gives the day of each sweep, newest first, and no text of the sweep log", () => {
    const company = getCompany(index, "example-co");

    expect(company?.sweeps).toEqual(["2026-10-20", "2026-10-08", "2026-10-01"]);
    expect(JSON.stringify(company)).not.toContain("recipe");
    expect(JSON.stringify(company)).not.toContain("plain fetch");
  });

  it("gives no watchlist entry for a company that is not on the watchlist", () => {
    const company = getCompany(indexOf({ "search/market/acme/index.md": companyIndex("Acme") }), "acme");

    expect(company).toEqual({ slug: "acme", name: "Acme", watchlist: null, sweeps: [], listings: [] });
  });

  it("returns null for a company with no listing index", () => {
    expect(getCompany(index, "no-such-company")).toBeNull();
  });
});

describe("getListing", () => {
  it("joins the listing record and the row of the company index", () => {
    expect(getListing(index, "example-co", "backend-engineer-1001")).toEqual({
      company: "example-co",
      companyName: "Example Co",
      slug: "backend-engineer-1001",
      title: "Backend Engineer",
      region: "sg",
      level: "Mid",
      firstSeen: "2026-10-01",
      url: "https://example.com/careers/1001",
      triage: "shortlist",
      reason: "Backend work on developer tools",
      lastSeen: "2026-10-20",
      state: "open",
      application: { slug: "example-co-backend-engineer", found: true, status: "applied" },
      body: [
        "Example Co is a made-up company. This listing is not real.",
        "",
        "## What you will do",
        "",
        "Build the services behind the developer tools.",
      ].join("\n"),
    });
  });

  it("gives a listing record that has no row in the company index", () => {
    const listing = getListing(
      indexOf({
        "search/market/acme/index.md": companyIndex("Acme"),
        "search/market/acme/engineer-1.md":
          "---\ntype: listing\nurl: ftp://example.com/1\n---\n\n# Engineer\n\nText.\n",
      }),
      "acme",
      "engineer-1",
    );

    expect(listing).toMatchObject({
      companyName: "Acme",
      title: "Engineer",
      region: null,
      firstSeen: null,
      url: null,
      triage: null,
      state: null,
      application: null,
      body: "Text.",
    });
  });

  it("returns null for the company index and for a listing that does not exist", () => {
    expect(getListing(index, "example-co", "index")).toBeNull();
    expect(getListing(index, "example-co", "no-such-listing")).toBeNull();
    expect(getListing(index, "no-such-company", "backend-engineer-1001")).toBeNull();
  });
});
