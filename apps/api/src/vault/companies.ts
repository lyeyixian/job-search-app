import { splitTitle } from "./experience.js";
import type { VaultIndex } from "./load.js";
import { checkDay } from "./schema.js";
import {
  COMPANY_INDEX,
  INDEX_TITLE,
  type IndexRow,
  indexRows,
  type ListingState,
  type Promotion,
  type Triage,
} from "./shortlist.js";
import { enumValue } from "./table.js";

export const MODES = ["active", "watch"] as const;
export type Mode = (typeof MODES)[number];

/** What the watchlist says about one company. The instructions for a sweep stay out. */
export type WatchlistEntry = {
  /** The heading of the company in the watchlist. */
  name: string;
  /** `null` if the item is not `active` or `watch`. */
  mode: Mode | null;
  lastSwept: string | null;
  /** The first web address of the `board` item. */
  board: string | null;
  /** The `quirks` item, as markdown. */
  notes: string;
  /** The `comp` item, as markdown. */
  pay: string;
  /** The `remote` item, as markdown. */
  remote: string;
};

export type CompanySummary = {
  /** The folder of the company in `search/market/`. */
  slug: string;
  name: string;
  /** `null` if the company is not on the watchlist. */
  mode: Mode | null;
  /** The day in the watchlist. If the watchlist has none, the newest day of the sweep log. */
  lastSwept: string | null;
  /** The number of open listings with the triage `shortlist`. */
  openShortlisted: number;
  /** The number of listings in the company index. */
  listings: number;
};

export type Company = {
  slug: string;
  name: string;
  /** `null` if the company is not on the watchlist. */
  watchlist: Omit<WatchlistEntry, "name"> | null;
  /** The day of each sweep, newest first. */
  sweeps: string[];
  /** Each row of the company index. `shortlist` first, then `maybe`, then `reject`. */
  listings: IndexRow[];
};

export type Listing = {
  company: string;
  companyName: string;
  slug: string;
  title: string;
  /** `sg`, `remote` or the slug of a different place. */
  region: string | null;
  level: string;
  firstSeen: string | null;
  /** The web address of the listing on the job board. */
  url: string | null;
  /** The fields of the row in the company index. `null` if the index has no row for the listing. */
  triage: Triage | null;
  reason: string;
  lastSeen: string | null;
  state: ListingState | null;
  application: Promotion | null;
  /** The text of the listing as markdown, without the title line. */
  body: string;
};

const WATCHLIST = "search/market/watchlist.md";
const ITEM = /^- \*\*([a-z-]+):\*\*\s*(.*)$/;
const WEB_ADDRESS = /https?:\/\/[^\s)>\]]+/;
const SWEEP = /^- \*\*(\d{4}-\d{2}-\d{2})\*\*/;

function slugOf(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Each company section of the watchlist. A section is a `##` heading with a list of `- **key:** value` items. */
export function watchlist(index: VaultIndex): WatchlistEntry[] {
  const note = index.notes.get(WATCHLIST);
  if (!note) return [];
  const entries: WatchlistEntry[] = [];
  let name: string | null = null;
  let items = new Map<string, string[]>();
  let item: string[] | null = null;

  const close = () => {
    if (name === null) return;
    const text = (key: string) => (items.get(key) ?? []).join("\n").trim();
    entries.push({
      name,
      mode: enumValue(MODES, text("mode")),
      lastSwept: checkDay(text("last-swept")),
      board: WEB_ADDRESS.exec(text("board"))?.[0] ?? null,
      notes: text("quirks"),
      pay: text("comp"),
      remote: text("remote"),
    });
  };

  for (const line of note.body.split("\n")) {
    if (line.startsWith("## ")) {
      close();
      name = line.slice(3).trim();
      items = new Map();
      item = null;
      continue;
    }
    if (name === null) continue;
    const match = ITEM.exec(line);
    if (match) {
      item = [match[2] ?? ""];
      items.set(match[1] ?? "", item);
    } else if (/^\s+\S/.test(line) || line.trim() === "") {
      // A line with an indent continues the item. Two spaces of the indent belong to the list.
      item?.push(line.replace(/^ {2}/, ""));
    } else {
      item = null;
    }
  }
  close();
  return entries;
}

/**
 * The entry of the watchlist for a company. The heading is the name in the company index, or
 * the folder is the slug of the heading or of one part of a heading such as `Name / Other name`.
 */
function entryOf(entries: WatchlistEntry[], slug: string, name: string): WatchlistEntry | null {
  return (
    entries.find((entry) => entry.name === name) ??
    entries.find((entry) => slugOf(entry.name) === slug) ??
    entries.find((entry) => entry.name.split("/").some((part) => slugOf(part) === slug)) ??
    null
  );
}

/** The day of each sweep in the `## Sweep log` of a company index, newest first. */
function sweepDays(body: string): string[] {
  const days = new Set<string>();
  let inLog = false;
  for (const line of body.split("\n")) {
    if (line.startsWith("## ")) {
      inLog = line.slice(3).trim().toLowerCase() === "sweep log";
    } else if (inLog) {
      const day = checkDay(SWEEP.exec(line)?.[1]);
      if (day) days.add(day);
    }
  }
  return [...days].sort().reverse();
}

type CompanyIndex = { slug: string; name: string; sweeps: string[] };

function companyIndexes(index: VaultIndex): CompanyIndex[] {
  const companies: CompanyIndex[] = [];
  for (const [path, note] of index.notes) {
    const slug = COMPANY_INDEX.exec(path)?.[1];
    if (!slug) continue;
    companies.push({
      slug,
      name: splitTitle(note.body).title?.replace(INDEX_TITLE, "").trim() || slug,
      sweeps: sweepDays(note.body),
    });
  }
  return companies;
}

/** Each company that has a listing index, in the order of the names. */
export function getCompanies(index: VaultIndex): CompanySummary[] {
  const entries = watchlist(index);
  const rows = indexRows(index);
  return companyIndexes(index)
    .map(({ slug, name, sweeps }) => {
      const entry = entryOf(entries, slug, name);
      const own = rows.filter((row) => row.company === slug);
      return {
        slug,
        name,
        mode: entry?.mode ?? null,
        lastSwept: entry?.lastSwept ?? sweeps[0] ?? null,
        openShortlisted: own.filter((row) => row.triage === "shortlist" && row.state === "open").length,
        listings: own.length,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug));
}

const TRIAGE_ORDER: Record<string, number> = { shortlist: 0, maybe: 1, reject: 2 };
const STATE_ORDER: Record<string, number> = { open: 0, unknown: 1, closed: 2 };

/** `shortlist`, `maybe`, a triage that the rules do not permit, then `reject`. Open listings first, then the newest. */
function byTriageThenNewest(a: IndexRow, b: IndexRow): number {
  return (
    (TRIAGE_ORDER[a.triage ?? ""] ?? 1.5) - (TRIAGE_ORDER[b.triage ?? ""] ?? 1.5) ||
    (STATE_ORDER[a.state ?? ""] ?? 1) - (STATE_ORDER[b.state ?? ""] ?? 1) ||
    (b.firstSeen ?? "").localeCompare(a.firstSeen ?? "") ||
    a.title.localeCompare(b.title) ||
    a.slug.localeCompare(b.slug)
  );
}

/** One company with each row of its index, or null if the company has no listing index. */
export function getCompany(index: VaultIndex, slug: string): Company | null {
  const company = companyIndexes(index).find((candidate) => candidate.slug === slug);
  if (!company) return null;
  const entry = entryOf(watchlist(index), slug, company.name);
  let details: Company["watchlist"] = null;
  if (entry) {
    const { name: _name, ...rest } = entry;
    details = rest;
  }
  return {
    slug,
    name: company.name,
    watchlist: details,
    sweeps: company.sweeps,
    listings: indexRows(index)
      .filter((row) => row.company === slug)
      .sort(byTriageThenNewest),
  };
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** One listing record with the row of its company index, or null if the vault has no such record. */
export function getListing(index: VaultIndex, company: string, slug: string): Listing | null {
  const note = slug === "index" ? undefined : index.notes.get(`search/market/${company}/${slug}.md`);
  if (!note) return null;
  const row = indexRows(index).find((candidate) => candidate.company === company && candidate.slug === slug);
  const { title, body } = splitTitle(note.body);
  const { frontmatter } = note;
  const url = text(frontmatter.url);
  return {
    company,
    companyName:
      row?.companyName ?? companyIndexes(index).find((candidate) => candidate.slug === company)?.name ?? company,
    slug,
    title: text(frontmatter.title) ?? title ?? row?.title ?? slug,
    region: text(frontmatter.region),
    level: text(frontmatter["level-hint"]) ?? row?.level ?? "",
    firstSeen: checkDay(frontmatter["first-seen"]) ?? row?.firstSeen ?? null,
    // Only a web address can become a link on the page.
    url: url && /^https?:\/\//.test(url) ? url : null,
    triage: row?.triage ?? null,
    reason: row?.reason ?? "",
    lastSeen: row?.lastSeen ?? null,
    state: row?.state ?? null,
    application: row?.application ?? null,
    body,
  };
}
