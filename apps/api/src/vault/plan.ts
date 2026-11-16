import { companyOf } from "./companies.js";
import { anchorOf, splitTitle } from "./experience.js";
import type { VaultIndex } from "./load.js";
import type { Note } from "./parser.js";
import type { Warning } from "./schema.js";
import { cells } from "./table.js";

export const DIRECTION = "search/direction.md";
export const TARGETS = "search/targets.md";

/** A `##` heading of a note, for the list of sections of its page. */
export type Section = { anchor: string; title: string };

/** A note of the plan of the search: the direction or the targets. */
export type PlanNote = {
  /** The first `#` heading. */
  title: string;
  /** The markdown below the frontmatter, without the first `#` heading. */
  body: string;
  /** The month or the day of the last change, `YYYY-MM` or `YYYY-MM-DD`. `null` if the field has a warning. */
  updated: string | null;
  /** The `##` headings of the note, in the order of the note. */
  sections: Section[];
  warnings: Warning[];
};

export type Direction = PlanNote & {
  /** The slugs of the target roles. Empty if the field has a warning. */
  targetRoles: string[];
};

/** A company in the text of the targets that the market scan has. */
export type TargetCompany = {
  /** The name as the targets write it. */
  text: string;
  /** The folder of the company in the market scan. */
  slug: string;
};

export type Targets = PlanNote & {
  /** Each company that starts a list item or a table cell, and that the market scan has. */
  companies: TargetCompany[];
};

const FENCE = /^\s*(```|~~~)/;

/** The lines of a note that are not in a code block. */
function textLines(body: string): string[] {
  const lines: string[] = [];
  let inCode = false;
  for (const line of body.split("\n")) {
    if (FENCE.test(line)) inCode = !inCode;
    else if (!inCode) lines.push(line);
  }
  return lines;
}

/** The `##` headings of a note. Two headings with the same text give one section, the first. */
export function sectionsOf(body: string): Section[] {
  const sections = new Map<string, Section>();
  for (const line of textLines(body)) {
    const title = /^## +(.+?)\s*#*\s*$/.exec(line)?.[1];
    const anchor = title ? anchorOf(title) : "";
    if (title && anchor && !sections.has(anchor)) sections.set(anchor, { anchor, title });
  }
  return [...sections.values()];
}

/** A month or a day. YAML reads a day as a date. */
function monthOrDay(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === "string" && /^\d{4}-\d{2}(-\d{2})?$/.test(value.trim()) ? value.trim() : null;
}

function planNote(note: Note, fallback: string): PlanNote {
  const { title, body } = splitTitle(note.body);
  const updated = monthOrDay(note.frontmatter.updated);
  return {
    title: title ?? fallback,
    body,
    updated,
    sections: sectionsOf(body),
    warnings: updated ? [] : [{ field: "updated", problem: "updated" in note.frontmatter ? "invalid" : "missing" }],
  };
}

/** The direction of the search, or null if the vault has none. */
export function getDirection(index: VaultIndex): Direction | null {
  const note = index.notes.get(DIRECTION);
  if (!note) return null;
  const plan = planNote(note, "Direction");
  const roles = note.frontmatter["target-roles"];
  const valid = Array.isArray(roles) && roles.every((role) => typeof role === "string" && role !== "");
  return {
    ...plan,
    targetRoles: valid ? (roles as string[]) : [],
    warnings: valid
      ? plan.warnings
      : [...plan.warnings, { field: "target-roles", problem: roles === undefined ? "missing" : "invalid" }],
  };
}

const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)]) +(?:\[[ xX]\] +)?(.*)$/;
// The name of a company ends at a bracket, a colon, a comma, or a hyphen or a dash with spaces.
const NAME_END = /\s*(?:\(|:|,|\s[-–—]\s)/;

/**
 * The text at the start of each list item and each table cell, up to the first mark that ends a
 * name. `ShopBack (decide if it is practice)` gives `ShopBack`.
 */
function leadingNames(body: string): string[] {
  const names: string[] = [];
  for (const line of textLines(body)) {
    const starts = line.trim().startsWith("|") ? cells(line) : [LIST_ITEM.exec(line)?.[1] ?? ""];
    for (const start of starts) {
      const name = start.split(NAME_END)[0]?.trim();
      if (name) names.push(name);
    }
  }
  return names;
}

/** The targets of the search, or null if the vault has none. */
export function getTargets(index: VaultIndex): Targets | null {
  const note = index.notes.get(TARGETS);
  if (!note) return null;
  const plan = planNote(note, "Targets");
  const companies = new Map<string, TargetCompany>();
  for (const text of leadingNames(plan.body)) {
    const slug = companies.has(text) ? null : companyOf(index, text);
    if (slug) companies.set(text, { text, slug });
  }
  return { ...plan, companies: [...companies.values()] };
}
