import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { splitTitle } from "./experience.js";
import { type FitAnalysis, parseFitAnalysis, splitPosting } from "./fit.js";
import type { VaultIndex } from "./load.js";
import {
  type ApplicationFrontmatter,
  checkApplication,
  checkApplicationDetail,
  DIRECTIONS,
  type Direction,
  REGIONS,
  type Region,
  VERDICTS,
  type Verdict,
  type Warning,
} from "./schema.js";

export type ApplicationSummary = ApplicationFrontmatter & {
  /** The name of the application's folder. */
  slug: string;
  /** True if the folder has a `resume.pdf`. */
  hasResume: boolean;
  warnings: Warning[];
};

/** The choices that narrow a list of applications. An application must match each one. */
export type ApplicationFilter = {
  company?: string | undefined;
  region?: string | undefined;
  verdict?: string | undefined;
  direction?: string | undefined;
};

export type ApplicationList = {
  /** The applications that match the filter, best fit first. */
  applications: ApplicationSummary[];
  /** The values that at least one application has, with no filter applied. */
  choices: { companies: string[]; regions: Region[]; verdicts: Verdict[]; directions: Direction[] };
};

const POSTING = /^applications\/([^/]+)\/posting\.md$/;

function verdictRank(verdict: Verdict | null): number {
  return verdict ? VERDICTS.indexOf(verdict) : VERDICTS.length;
}

/** Best verdict first. With the same verdict, the newest application first. */
function byFit(a: ApplicationSummary, b: ApplicationSummary): number {
  return (
    verdictRank(a.verdict) - verdictRank(b.verdict) ||
    (b.captured ?? "").localeCompare(a.captured ?? "") ||
    a.slug.localeCompare(b.slug)
  );
}

const resumePath = (slug: string) => `applications/${slug}/resume.pdf`;

function summary(index: VaultIndex, slug: string, frontmatter: Record<string, unknown>): ApplicationSummary {
  const { fields, warnings } = checkApplication(frontmatter);
  return { slug, ...fields, hasResume: index.files.has(resumePath(slug)), warnings };
}

function allApplications(index: VaultIndex): ApplicationSummary[] {
  const applications: ApplicationSummary[] = [];
  for (const [path, note] of index.notes) {
    const slug = POSTING.exec(path)?.[1];
    if (slug) applications.push(summary(index, slug, note.frontmatter));
  }
  return applications.sort(byFit);
}

/** The listing that an application came from. */
export type SourceListing = {
  /** The folder of the company in `search/market/`. */
  company: string;
  slug: string;
  /** The title of the listing. `null` if the vault has no such listing. */
  title: string | null;
};

export type ApplicationDetail = ApplicationSummary & {
  /** The address of the posting on the job board. */
  url: string | null;
  /** The day of the last fit analysis. */
  analyzed: string | null;
  listing: SourceListing | null;
  /** The posting as markdown, without its title and without the fit analysis. */
  posting: string;
  /** `null` if the note has no fit analysis. */
  fit: FitAnalysis | null;
};

/** All that the vault holds about one application, or null if no application has the slug. */
export function getApplication(index: VaultIndex, slug: string): ApplicationDetail | null {
  const note = index.notes.get(`applications/${slug}/posting.md`);
  if (!note) return null;

  const base = summary(index, slug, note.frontmatter);
  const { fields, warnings } = checkApplicationDetail(note.frontmatter);
  const [company = "", listingSlug = ""] = fields["source-listing"]?.split("/") ?? [];
  const listing = index.notes.get(`search/market/${company}/${listingSlug}.md`);
  const { posting, fit } = splitPosting(note.body);

  return {
    ...base,
    url: fields.url,
    analyzed: fields.analyzed,
    listing: fields["source-listing"]
      ? {
          company,
          slug: listingSlug,
          title:
            typeof listing?.frontmatter.title === "string"
              ? listing.frontmatter.title
              : (listing && splitTitle(listing.body).title) || null,
        }
      : null,
    posting: splitTitle(posting).body,
    fit: fit === null ? null : parseFitAnalysis(index, fit),
    warnings: [...base.warnings, ...warnings],
  };
}

/** The tailored resume PDF of an application, or null if the application has none. */
export async function readResume(vaultPath: string, index: VaultIndex, slug: string): Promise<Uint8Array | null> {
  // The index lists the files of the vault, so a slug cannot name a file outside it.
  if (!index.files.has(resumePath(slug))) return null;
  return readFile(join(vaultPath, resumePath(slug)));
}

/** The values of `known` that `present` has, in the order of `known`. */
function inOrder<T extends string>(known: readonly T[], present: Iterable<T | null>): T[] {
  const set = new Set(present);
  return known.filter((value) => set.has(value));
}

/** The data for the list of applications. */
export function listApplications(index: VaultIndex, filter: ApplicationFilter = {}): ApplicationList {
  const all = allApplications(index);
  const companies = new Set(all.flatMap((application) => application.company ?? []));
  return {
    applications: all.filter(
      (application) =>
        (!filter.company || application.company === filter.company) &&
        (!filter.region || application.region === filter.region) &&
        (!filter.verdict || application.verdict === filter.verdict) &&
        (!filter.direction || application.direction === filter.direction),
    ),
    choices: {
      companies: [...companies].sort((a, b) => a.localeCompare(b)),
      regions: inOrder(
        REGIONS,
        all.map((application) => application.region),
      ),
      verdicts: inOrder(
        VERDICTS,
        all.map((application) => application.verdict),
      ),
      directions: inOrder(
        DIRECTIONS,
        all.map((application) => application.direction),
      ),
    },
  };
}
