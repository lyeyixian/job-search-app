import { splitTitle } from "./experience.js";
import type { VaultIndex } from "./load.js";
import { checkApplication, checkDay, type Status, type Warning } from "./schema.js";
import { enumValue, table } from "./table.js";

export const TRIAGES = ["shortlist", "maybe", "reject"] as const;
export const LISTING_STATES = ["open", "closed", "unknown"] as const;

export type Triage = (typeof TRIAGES)[number];
export type ListingState = (typeof LISTING_STATES)[number];

/** The application that a listing was promoted to. */
export type Promotion = {
  /** The name of the application's folder, as the company index writes it. */
  slug: string;
  /** False if the vault has no such application. */
  found: boolean;
  /** `null` if the application does not exist or has no permitted status. */
  status: Status | null;
};

/** One row of a company index. */
export type IndexRow = {
  /** The folder of the company in `search/market/`. */
  company: string;
  /** The name of the company, from the heading of its index. */
  companyName: string;
  /** The file name of the listing record without `.md`. */
  slug: string;
  /** The label of the link to the listing record. */
  title: string;
  level: string;
  /** `null` if the cell is not `shortlist`, `maybe` or `reject`. */
  triage: Triage | null;
  /** One line of text. */
  reason: string;
  firstSeen: string | null;
  /** `null` if the cell is not `open`, `closed` or `unknown`. */
  state: ListingState | null;
  application: Promotion | null;
  /** The columns of the row that break the vault's rules. */
  warnings: Warning[];
};

export type ShortlistListing = Omit<IndexRow, "triage" | "state">;

/** The choices that narrow the shortlist. A listing must match each one. */
export type ShortlistFilter = {
  /** The folder of a company. */
  company?: string | undefined;
  /** `hide` leaves out each listing that has an application. */
  promoted?: string | undefined;
};

export type Shortlist = {
  /** The listings that match the filter. The listings of one company are together, newest first. */
  listings: ShortlistListing[];
  /** The number of open listings with the triage `shortlist`, with no filter applied. */
  total: number;
  /** The companies that have at least one such listing, with no filter applied. */
  companies: { slug: string; name: string; count: number }[];
};

const COMPANY_INDEX = /^search\/market\/([^/]+)\/index\.md$/;
const LISTING_LINK = /\[\[([^\]|#]+)(?:\|([^\]]*))?\]\]/;
const INDEX_TITLE = /\s+-\s+listing index\s*$/i;

function promotion(index: VaultIndex, cell: string | undefined): Promotion | null {
  // The cell is the slug. Some rows write it as a link.
  const slug = (LISTING_LINK.exec(cell ?? "")?.[1] ?? cell ?? "").replace(/`/g, "").trim();
  if (!slug) return null;
  const note = index.notes.get(`applications/${slug}/posting.md`);
  return { slug, found: Boolean(note), status: note ? checkApplication(note.frontmatter).fields.status : null };
}

/** Each row of the listing index of each company. A row with no link to a listing record is not a listing. */
export function indexRows(index: VaultIndex): IndexRow[] {
  const rows: IndexRow[] = [];
  for (const [path, note] of index.notes) {
    const company = COMPANY_INDEX.exec(path)?.[1];
    if (!company) continue;
    const companyName = splitTitle(note.body).title?.replace(INDEX_TITLE, "").trim() || company;
    for (const row of table(note.body.split("\n"))) {
      const link = LISTING_LINK.exec(row.get("listing") ?? "");
      const slug = link?.[1]?.trim();
      if (!slug) continue;
      const firstSeen = checkDay(row.get("first seen"));
      rows.push({
        company,
        companyName,
        slug,
        title: link?.[2]?.trim() || slug,
        level: row.get("level") ?? "",
        triage: enumValue(TRIAGES, row.get("triage")),
        reason: row.get("reason") ?? "",
        firstSeen,
        state: enumValue(LISTING_STATES, row.get("state")),
        application: promotion(index, row.get("application")),
        warnings: firstSeen ? [] : [{ field: "First seen", problem: row.get("first seen") ? "invalid" : "missing" }],
      });
    }
  }
  return rows;
}

/** Companies by name. In a company, the listing first seen most recently comes first. */
function byCompanyThenNewest(a: ShortlistListing, b: ShortlistListing): number {
  return (
    a.companyName.localeCompare(b.companyName) ||
    a.company.localeCompare(b.company) ||
    (b.firstSeen ?? "").localeCompare(a.firstSeen ?? "") ||
    a.title.localeCompare(b.title) ||
    a.slug.localeCompare(b.slug)
  );
}

/** The data for the shortlist: each open listing with the triage `shortlist`, of all companies. */
export function getShortlist(index: VaultIndex, filter: ShortlistFilter = {}): Shortlist {
  const all = indexRows(index)
    .filter((row) => row.triage === "shortlist" && row.state === "open")
    .map(({ triage: _triage, state: _state, ...listing }) => listing)
    .sort(byCompanyThenNewest);

  const companies = new Map<string, { slug: string; name: string; count: number }>();
  for (const listing of all) {
    const company = companies.get(listing.company) ?? { slug: listing.company, name: listing.companyName, count: 0 };
    company.count += 1;
    companies.set(listing.company, company);
  }

  return {
    listings: all.filter(
      (listing) =>
        (!filter.company || listing.company === filter.company) &&
        (filter.promoted !== "hide" || listing.application === null),
    ),
    total: all.length,
    companies: [...companies.values()],
  };
}
