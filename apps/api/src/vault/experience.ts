import type { VaultIndex } from "./load.js";

export const EXPERIENCE_KINDS = ["roles", "projects"] as const;
export type ExperienceKind = (typeof EXPERIENCE_KINDS)[number];

/** One piece of work, a `###` subsection of a role note or a project note. */
export type Achievement = {
  /** The name that a reference uses after `#`. */
  anchor: string;
  /** The heading as the note writes it. */
  title: string;
};

export type ExperienceNote = {
  kind: ExperienceKind;
  slug: string;
  /** The first `#` heading, or the slug if the note has none. */
  title: string;
  /** The markdown below the frontmatter, without the first `#` heading. */
  body: string;
  achievements: Achievement[];
};

/**
 * The anchor of a heading, by the rule of the vault's resume tool: lower case, keep the letters,
 * digits, spaces and hyphens, then put a hyphen for each run of spaces.
 * `Pub/Sub research (v2.0)` becomes `pubsub-research-v20`.
 */
export function anchorOf(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

const TITLE = /^# +(.+?)\s*$/m;

/** The title of a note and its body without the title line. */
export function splitTitle(body: string): { title: string | null; body: string } {
  const match = TITLE.exec(body);
  if (!match) return { title: null, body: body.trim() };
  return {
    title: match[1] ?? null,
    body: (body.slice(0, match.index) + body.slice(match.index + match[0].length)).trim(),
  };
}

/** A role note or a project note, or null if the vault has no such note. */
export function getExperienceNote(index: VaultIndex, kind: ExperienceKind, slug: string): ExperienceNote | null {
  const note = index.notes.get(`experience/${kind}/${slug}.md`);
  if (!note) return null;
  const { title, body } = splitTitle(note.body);
  const achievements: Achievement[] = [];
  // An achievement is a `###` heading below the `## Achievements` heading.
  let inAchievements = false;
  for (const line of body.split("\n")) {
    if (line.startsWith("## ")) {
      inAchievements = line.slice(3).trim().toLowerCase() === "achievements";
    } else if (inAchievements && line.startsWith("### ")) {
      const heading = line.slice(4).trim();
      achievements.push({ anchor: anchorOf(heading), title: heading });
    }
  }
  return { kind, slug, title: title ?? slug, body, achievements };
}

/** Finds a role note or a project note by its slug. A slug is unique in the vault. */
export function findExperienceNote(index: VaultIndex, slug: string): ExperienceNote | null {
  for (const kind of EXPERIENCE_KINDS) {
    const note = getExperienceNote(index, kind, slug);
    if (note) return note;
  }
  return null;
}
