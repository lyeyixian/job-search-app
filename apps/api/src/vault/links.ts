import { getApplication } from "./applications.js";
import { ACHIEVEMENT_KINDS, anchorOf, EXPERIENCE_KINDS, getExperienceNote, splitTitle } from "./experience.js";
import type { VaultIndex } from "./load.js";
import type { Note } from "./parser.js";
import { INDEX_TITLE, indexRows } from "./shortlist.js";

/** The kinds of note that have a page in the app. */
export const PAGE_KINDS = [
  ...EXPERIENCE_KINDS,
  "applications",
  "listings",
  "profile",
  "skills",
  "direction",
  "targets",
] as const;
export type PageKind = (typeof PAGE_KINDS)[number];

/** The page of a note. Web makes the address from it. */
export type NotePage = {
  kind: PageKind;
  /** The file name without `.md`, or the folder name for an application. */
  slug: string;
  /** The folder of the company. `null` if the note is not a listing. */
  company: string | null;
};

export const LINK_STATES = ["found", "missing", "no-page"] as const;

/** One link of a note, resolved against the vault. */
export type ResolvedLink = {
  /** The link as the note writes it, without the brackets and the label: `note` or `note#achievement`. */
  ref: string;
  /**
   * `found` if the target has a page. `missing` if the vault has no such note or no such
   * achievement. `no-page` if the note exists and the app has no page for it, such as a journal file.
   */
  state: (typeof LINK_STATES)[number];
  /** The page of the target. `null` if the state is not `found`. */
  page: NotePage | null;
  /** The achievement that the link names. `null` if the link names a whole note. */
  anchor: string | null;
  /** The title of the achievement or of the note. `null` if the state is `missing`. */
  title: string | null;
};

/** A note that names the note of the page. */
export type Backlink = {
  page: NotePage;
  title: string;
  /** The achievements of this note that the other note names. */
  achievements: { anchor: string; title: string }[];
};

/** The path of each note that has a page, from the vault root. */
export const notePath = {
  experience: (kind: (typeof EXPERIENCE_KINDS)[number], slug: string) => `experience/${kind}/${slug}.md`,
  application: (slug: string) => `applications/${slug}/posting.md`,
  listing: (company: string, slug: string) => `search/market/${company}/${slug}.md`,
  profile: "experience/profile.md",
  skills: "experience/skills.md",
  watchlist: "search/market/watchlist.md",
  direction: "search/direction.md",
  targets: "search/targets.md",
};

const EXPERIENCE = /^experience\/(roles|projects|stories)\/([^/]+)\.md$/;
const APPLICATION = /^applications\/([^/]+)\/posting\.md$/;
const LISTING = /^search\/market\/([^/]+)\/([^/]+)\.md$/;

/** The page of the note at `path`, or null if the app has no page for it. */
export function pageOf(path: string): NotePage | null {
  const experience = EXPERIENCE.exec(path);
  if (experience) return { kind: experience[1] as PageKind, slug: experience[2] ?? "", company: null };
  const application = APPLICATION.exec(path);
  if (application) return { kind: "applications", slug: application[1] ?? "", company: null };
  const listing = LISTING.exec(path);
  // The index of a company is not a listing.
  if (listing && listing[2] !== "index") return { kind: "listings", slug: listing[2] ?? "", company: listing[1] ?? "" };
  if (path === notePath.profile) return { kind: "profile", slug: "profile", company: null };
  if (path === notePath.skills) return { kind: "skills", slug: "skills", company: null };
  if (path === notePath.direction) return { kind: "direction", slug: "direction", company: null };
  if (path === notePath.targets) return { kind: "targets", slug: "targets", company: null };
  return null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

type Lookup = {
  /** The notes of the experience folders and the applications, by slug. A slug is unique among them. */
  named: Map<string, Note>;
  /** The listings of all companies, by slug. Two companies can have the same slug. */
  listings: Map<string, Note[]>;
  /** Each other note, by file name. */
  others: Map<string, Note>;
  /** The name of each company, by its folder. */
  companies: Map<string, string>;
  backlinks: Map<string, Backlink[]> | null;
};

// One lookup for each index. A new load makes a new index, so an old lookup goes away with it.
const lookups = new WeakMap<VaultIndex, Lookup>();

function lookupOf(index: VaultIndex): Lookup {
  const cached = lookups.get(index);
  if (cached) return cached;
  const lookup: Lookup = {
    named: new Map(),
    listings: new Map(),
    others: new Map(),
    companies: new Map(),
    backlinks: null,
  };
  for (const [path, note] of index.notes) {
    const page = pageOf(path);
    if (page?.kind === "listings") {
      lookup.listings.set(page.slug, [...(lookup.listings.get(page.slug) ?? []), note]);
    } else if (page) {
      if (!lookup.named.has(page.slug)) lookup.named.set(page.slug, note);
    } else {
      const company = LISTING.exec(path)?.[1];
      if (company) {
        lookup.companies.set(company, splitTitle(note.body).title?.replace(INDEX_TITLE, "").trim() || company);
      } else if (!lookup.others.has(note.slug)) {
        lookup.others.set(note.slug, note);
      }
    }
  }
  lookups.set(index, lookup);
  return lookup;
}

/**
 * Finds the note that a link names. `source` is the path of the note that has the link.
 *
 * A name is the file name without `.md`, or the folder name for an application. A listing can
 * have the same name in two companies, so the company of the source note comes first, then the
 * form `company/listing`, then a name that only one company has.
 */
export function findTarget(index: VaultIndex, source: string, target: string): Note | null {
  const lookup = lookupOf(index);
  const parts = target
    .trim()
    .replace(/\.md$/, "")
    .split("/")
    .filter((part) => part !== "");
  const name = parts.at(-1);
  if (!name) return null;

  const sourceCompany = LISTING.exec(source)?.[1];
  const company = parts.length > 1 ? parts.at(-2) : sourceCompany;
  const inCompany = company && name !== "index" ? index.notes.get(notePath.listing(company, name)) : undefined;
  if (inCompany) return inCompany;

  const named = lookup.named.get(name);
  if (named) return named;
  const listings = lookup.listings.get(name) ?? [];
  if (listings.length === 1) return listings[0] ?? null;
  return lookup.others.get(name) ?? null;
}

/** The title of a note for a link or a list. */
function titleOf(index: VaultIndex, note: Note, page: NotePage | null): string {
  if (page?.kind === "roles" || page?.kind === "projects" || page?.kind === "stories") {
    return getExperienceNote(index, page.kind, page.slug)?.title ?? note.slug;
  }
  const heading = splitTitle(note.body).title;
  const title = text(note.frontmatter.title) ?? heading ?? note.slug;
  if (page?.kind === "applications") {
    const company = text(note.frontmatter.company);
    return company ? `${title}, ${company}` : title;
  }
  if (page?.kind === "listings") {
    return `${title}, ${lookupOf(index).companies.get(page.company ?? "") ?? page.company}`;
  }
  if (page?.kind === "profile") return "Profile";
  if (page?.kind === "skills") return "Skills inventory";
  if (page?.kind === "direction") return "Direction";
  if (page?.kind === "targets") return "Targets";
  return heading ?? note.slug;
}

/** Resolves one link. `source` is the path of the note that has the link. */
export function resolveLink(
  index: VaultIndex,
  source: string,
  link: { target: string; anchor: string | null },
): ResolvedLink {
  const ref = link.anchor ? `${link.target}#${link.anchor}` : link.target;
  const missing: ResolvedLink = { ref, state: "missing", page: null, anchor: null, title: null };
  const note = findTarget(index, source, link.target);
  if (!note) return missing;
  const page = pageOf(note.path);
  if (!page) return { ref, state: "no-page", page: null, anchor: null, title: titleOf(index, note, null) };

  // An anchor names an achievement. Only a role note and a project note have achievements.
  const kind = ACHIEVEMENT_KINDS.find((candidate) => candidate === page.kind);
  if (link.anchor && kind) {
    const achievements = getExperienceNote(index, kind, page.slug)?.achievements ?? [];
    // A link can write the anchor or the heading.
    const wanted = anchorOf(link.anchor);
    const achievement = achievements.find(({ anchor }) => anchor === link.anchor || anchor === wanted);
    return achievement ? { ref, state: "found", page, anchor: achievement.anchor, title: achievement.title } : missing;
  }
  return { ref, state: "found", page, anchor: null, title: titleOf(index, note, page) };
}

/** The table of the links in the text of the note at `path`. Each link is in the table one time. */
export function linksOf(index: VaultIndex, path: string): ResolvedLink[] {
  const table = new Map<string, ResolvedLink>();
  for (const link of index.notes.get(path)?.links ?? []) {
    const resolved = resolveLink(index, path, link);
    if (!table.has(resolved.ref)) table.set(resolved.ref, resolved);
  }
  return [...table.values()];
}

function slugs(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item !== "") : [];
}

/**
 * Each note that a note with a page names, by the path of the named note. A note names a second
 * note in its text, in its facts, or in the evidence of its fit analysis. A row of a company
 * index that has an application counts as its listing naming the application.
 */
function buildBacklinks(index: VaultIndex): Map<string, Backlink[]> {
  const found = new Map<string, Map<string, Backlink>>();

  const add = (source: string, target: string, achievement: { anchor: string; title: string } | null) => {
    const page = pageOf(source);
    const sourceNote = index.notes.get(source);
    if (!page || !sourceNote || source === target || !index.notes.has(target)) return;
    const sources = found.get(target) ?? new Map<string, Backlink>();
    found.set(target, sources);
    const backlink = sources.get(source) ?? { page, title: titleOf(index, sourceNote, page), achievements: [] };
    sources.set(source, backlink);
    if (achievement && !backlink.achievements.some(({ anchor }) => anchor === achievement.anchor)) {
      backlink.achievements.push(achievement);
    }
  };

  for (const [path, note] of index.notes) {
    const page = pageOf(path);
    if (!page) continue;

    for (const link of note.links) {
      const resolved = resolveLink(index, path, link);
      const target = resolved.state === "found" ? findTarget(index, path, link.target) : null;
      if (!target) continue;
      add(path, target.path, resolved.anchor ? { anchor: resolved.anchor, title: resolved.title ?? "" } : null);
    }

    if (page.kind === "stories") {
      for (const role of slugs(note.frontmatter.roles)) add(path, notePath.experience("roles", role), null);
    } else if (page.kind === "roles") {
      const programme = text(note.frontmatter.programme);
      if (programme) add(path, notePath.experience("roles", programme), null);
    } else if (page.kind === "applications") {
      const application = getApplication(index, page.slug);
      if (application?.listing) {
        add(path, notePath.listing(application.listing.company, application.listing.slug), null);
      }
      for (const { evidence } of application?.fit?.requirements ?? []) {
        for (const part of evidence) {
          if (part.type === "achievement" && part.note && part.title) {
            add(path, notePath.experience(part.note, part.slug), { anchor: part.anchor, title: part.title });
          }
        }
      }
    }
  }

  for (const row of indexRows(index)) {
    if (row.application?.found) {
      add(notePath.listing(row.company, row.slug), notePath.application(row.application.slug), null);
    }
  }

  const order = (backlink: Backlink) => PAGE_KINDS.indexOf(backlink.page.kind);
  return new Map(
    [...found].map(([target, sources]) => [
      target,
      [...sources.values()].sort(
        (a, b) => order(a) - order(b) || a.title.localeCompare(b.title) || a.page.slug.localeCompare(b.page.slug),
      ),
    ]),
  );
}

/** The notes that name the note at `path`. The notes of one kind are together, in the order of the titles. */
export function backlinksOf(index: VaultIndex, path: string): Backlink[] {
  const lookup = lookupOf(index);
  lookup.backlinks ??= buildBacklinks(index);
  return lookup.backlinks.get(path) ?? [];
}

/** The link table and the backlinks of the note at `path`, for the response of a page. */
export function noteLinks(index: VaultIndex, path: string): { links: ResolvedLink[]; backlinks: Backlink[] } {
  return { links: linksOf(index, path), backlinks: backlinksOf(index, path) };
}
