import { findExperienceNote } from "./experience.js";
import type { VaultIndex } from "./load.js";
import { enumValue, table } from "./table.js";

export const GRADES = ["met", "partial", "gap"] as const;
export const REQUIREMENT_KINDS = ["must-have", "nice-to-have"] as const;
export const BRIDGING_ACTIONS = ["positioning", "learning"] as const;

export type Grade = (typeof GRADES)[number];
export type RequirementKind = (typeof REQUIREMENT_KINDS)[number];
export type BridgingAction = (typeof BRIDGING_ACTIONS)[number];

/** A piece of an evidence cell: plain text, or a reference to an achievement. */
export type EvidencePart =
  | { type: "text"; text: string }
  | {
      type: "achievement";
      /** The reference as the fit analysis writes it, `<note>#<achievement>`. */
      ref: string;
      slug: string;
      anchor: string;
      /** The folder of the note. `null` if no role note or project note has the slug. */
      note: "roles" | "projects" | null;
      /** The title of the note. `null` if the note does not exist. */
      noteTitle: string | null;
      /** The heading of the achievement. `null` if the note has no such achievement. */
      title: string | null;
    };

export type Requirement = {
  /** Markdown. */
  requirement: string;
  /** `null` if the cell does not start with `must-have` or `nice-to-have`. */
  kind: RequirementKind | null;
  /** The rest of the kind cell, such as `responsibility`. */
  kindNote: string | null;
  /** The firmness cell as the fit analysis writes it. Markdown. */
  firmness: string;
  /** `null` if the cell is not `met`, `partial` or `gap`. */
  grade: Grade | null;
  evidence: EvidencePart[];
};

export type Gap = {
  /** The group that the gap is listed under. */
  kind: RequirementKind | null;
  /** The requirement that the gap is about. Markdown. `null` if the gap does not name one. */
  requirement: string | null;
  grade: Grade | null;
  /** The bridging action. `null` if the gap does not start with `positioning` or `learning`. */
  action: BridgingAction | null;
  /** What to do. Markdown. */
  text: string;
};

export type FitAnalysis = {
  /** The reasons for the verdict. Markdown. */
  verdict: string;
  /** The reasons for the direction check. Markdown. */
  direction: string;
  requirements: Requirement[];
  gaps: Gap[];
  /** The text of the gaps part that is not a gap, such as "No gaps." Markdown. */
  gapsNote: string;
};

const FIT_HEADING = /^## +Fit analysis\s*$/im;

/** Splits the body of an application into the posting and the text of the fit analysis. */
export function splitPosting(body: string): { posting: string; fit: string | null } {
  const match = FIT_HEADING.exec(body);
  if (!match) return { posting: body.trim(), fit: null };
  const rest = body.slice(match.index + match[0].length);
  // The fit analysis ends at the next `##` heading, or at the end of the note.
  const next = /^## +/m.exec(rest);
  const after = next ? rest.slice(next.index) : "";
  return {
    posting: `${body.slice(0, match.index).trim()}${after ? `\n\n${after.trim()}` : ""}`,
    fit: (next ? rest.slice(0, next.index) : rest).trim(),
  };
}

/** The `###` sections of the fit analysis, by the first word of the heading in lower case. */
function sections(fit: string): Map<string, string> {
  const result = new Map<string, string[]>();
  let current: string[] | null = null;
  for (const line of fit.split("\n")) {
    const heading = /^### +(.+)$/.exec(line)?.[1];
    if (heading) {
      current = [];
      const key = /[a-z]+/i.exec(heading)?.[0].toLowerCase() ?? "";
      if (!result.has(key)) result.set(key, current);
    } else {
      current?.push(line);
    }
  }
  return new Map([...result].map(([key, lines]) => [key, lines.join("\n").trim()]));
}

function kindOf(cell: string | undefined): { kind: RequirementKind | null; kindNote: string | null } {
  const text = (cell ?? "").replace(/`/g, "").trim();
  const kind = REQUIREMENT_KINDS.find((candidate) => text.toLowerCase().startsWith(candidate)) ?? null;
  const note = (kind ? text.slice(kind.length) : text).replace(/^[\s:(]+|[\s)]+$/g, "");
  return { kind, kindNote: note || null };
}

const REFERENCE = /`?\b([a-z0-9][a-z0-9-]*)#([a-z0-9][a-z0-9-]*)`?/g;

/** Splits an evidence cell into text and references to achievements. */
export function evidenceParts(index: VaultIndex, evidence: string): EvidencePart[] {
  const parts: EvidencePart[] = [];
  let end = 0;
  for (const match of evidence.matchAll(REFERENCE)) {
    const [whole, slug = "", anchor = ""] = match;
    if (match.index > end) parts.push({ type: "text", text: evidence.slice(end, match.index) });
    const note = findExperienceNote(index, slug);
    parts.push({
      type: "achievement",
      ref: `${slug}#${anchor}`,
      slug,
      anchor,
      note: note?.kind ?? null,
      noteTitle: note?.title ?? null,
      title: note?.achievements.find((achievement) => achievement.anchor === anchor)?.title ?? null,
    });
    end = match.index + whole.length;
  }
  if (end < evidence.length) parts.push({ type: "text", text: evidence.slice(end) });
  return parts;
}

function requirements(index: VaultIndex, section: string): Requirement[] {
  return table(section.split("\n")).map((row) => ({
    requirement: row.get("requirement") ?? "",
    ...kindOf(row.get("kind")),
    firmness: row.get("firmness") ?? "",
    grade: enumValue(GRADES, row.get("grade")),
    evidence: evidenceParts(index, row.get("evidence") ?? ""),
  }));
}

const GROUP = /^\**\s*(must-have|nice-to-have)s?\b\**\s*(?:\([^)]*\))?\s*:?\**$/i;
const BULLET = /^(?:[-*]|\d+[.)]) +(.*)$/;
const NAMED = /^\*\*(.+?)\*\*(.*)$/;
const GRADED = /^(.*?)\s*\((met|partial|gap)\b[^)]*\)(.*)$/i;
const ACTION = /^[\s:.,–-]*[`*]*(positioning|learning)(?![\w-])[`*]*[\s:.,*]*/i;

/**
 * Reads one list item of the gaps. The usual form is `**Requirement** (grade): action. What to
 * do.` The name can be plain text before the grade, and the grade is optional.
 */
function gapItem(kind: RequirementKind | null, item: string): Gap {
  const named = NAMED.exec(item);
  let requirement = named?.[1] ?? null;
  let rest = named ? (named[2] ?? "") : item;
  const graded = GRADED.exec(rest);
  // A grade counts only before the text of the gap, not in the middle of a sentence.
  const grade = graded && (named ? !/\w/.test(graded[1] ?? "") : true) ? graded : null;
  if (grade) {
    if (!named) requirement = grade[1] || null;
    rest = grade[3] ?? "";
  }
  const action = ACTION.exec(rest);
  if (action) rest = rest.slice(action[0].length);
  const text = rest.replace(/^[\s:.,–-]+/, "").trim();
  return {
    kind,
    requirement: requirement?.replace(/[:.,]\s*$/, "").trim() || null,
    grade: enumValue(GRADES, grade?.[2]),
    action: enumValue(BRIDGING_ACTIONS, action?.[1]),
    text: text ? text.charAt(0).toUpperCase() + text.slice(1) : "",
  };
}

/**
 * Reads the gaps. A fit analysis writes them as list items below group lines, or as a table.
 * `note` is the text that is not a gap, such as "No gaps."
 */
function gaps(section: string): { gaps: Gap[]; note: string } {
  const lines = section.split("\n");
  const rows = table(lines);
  if (rows.length > 0) {
    return {
      gaps: rows.map((row) => ({
        kind: kindOf(row.get("kind")).kind,
        requirement: row.get("requirement") ?? null,
        grade: enumValue(GRADES, row.get("grade")),
        action: enumValue(BRIDGING_ACTIONS, row.get("action")),
        text: row.get("what to do") ?? row.get("bridging action") ?? "",
      })),
      note: lines
        .filter((line) => !line.trim().startsWith("|"))
        .join("\n")
        .trim(),
    };
  }

  const items: { kind: RequirementKind | null; text: string }[] = [];
  const note: string[] = [];
  let kind: RequirementKind | null = null;
  for (const line of lines) {
    const bullet = BULLET.exec(line)?.[1];
    const group = GROUP.exec(line.trim())?.[1];
    const last = items.at(-1);
    if (bullet !== undefined) {
      items.push({ kind, text: bullet });
    } else if (group) {
      kind = group.toLowerCase() as RequirementKind;
    } else if (line.trim() && /^\s/.test(line) && last) {
      // A line with an indent continues the item above it.
      last.text += ` ${line.trim()}`;
    } else {
      note.push(line);
    }
  }
  return { gaps: items.map((item) => gapItem(item.kind, item.text)), note: note.join("\n").trim() };
}

/** Reads the four parts of a fit analysis. A part that the text does not have is empty. */
export function parseFitAnalysis(index: VaultIndex, fit: string): FitAnalysis {
  const parts = sections(fit);
  const found = gaps(parts.get("gaps") ?? "");
  return {
    verdict: parts.get("verdict") ?? "",
    direction: parts.get("direction") ?? "",
    requirements: requirements(index, parts.get("requirements") ?? ""),
    gaps: found.gaps,
    gapsNote: found.note,
  };
}
