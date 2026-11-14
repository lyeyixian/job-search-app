import type { VaultIndex } from "./load.js";
import {
  type ApplicationFrontmatter,
  checkApplication,
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

function allApplications(index: VaultIndex): ApplicationSummary[] {
  const applications: ApplicationSummary[] = [];
  for (const [path, note] of index.notes) {
    const slug = POSTING.exec(path)?.[1];
    if (!slug) continue;
    const { fields, warnings } = checkApplication(note.frontmatter);
    applications.push({
      slug,
      ...fields,
      hasResume: index.files.has(`applications/${slug}/resume.pdf`),
      warnings,
    });
  }
  return applications.sort(byFit);
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
