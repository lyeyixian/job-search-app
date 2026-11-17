import { getApplication } from "./applications.js";
import { getListing } from "./companies.js";
import { EXPERIENCE_KINDS, getExperienceNote, getOverview, getSkills } from "./experience.js";
import { pageOf } from "./links.js";
import type { VaultIndex } from "./load.js";
import { getDirection, getTargets } from "./plan.js";
import { indexRows } from "./shortlist.js";

/** The count of the warnings of all notes that have a page, and of all rows of the company indexes. */
export function countWarnings(index: VaultIndex): number {
  let count = 0;
  for (const path of index.notes.keys()) {
    const page = pageOf(path);
    if (!page) continue;
    if (page.kind === "applications") {
      count += getApplication(index, page.slug)?.warnings.length ?? 0;
    } else if (page.kind === "listings") {
      count += getListing(index, page.company ?? "", page.slug)?.warnings.length ?? 0;
    } else if (page.kind === "profile") {
      count += getOverview(index).profile?.warnings.length ?? 0;
    } else if (page.kind === "skills") {
      count += getSkills(index).warnings.length;
    } else if (page.kind === "direction") {
      count += getDirection(index)?.warnings.length ?? 0;
    } else if (page.kind === "targets") {
      count += getTargets(index)?.warnings.length ?? 0;
    } else {
      const kind = EXPERIENCE_KINDS.find((candidate) => candidate === page.kind);
      if (kind) count += getExperienceNote(index, kind, page.slug)?.warnings.length ?? 0;
    }
  }
  for (const row of indexRows(index)) count += row.warnings.length;
  return count;
}
