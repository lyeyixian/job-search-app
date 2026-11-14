import type { VaultIndex } from "./load.js";
import type { Note, Revisit } from "./parser.js";

/** The kinds of note that have a page of their own. The name of a kind is the name of its folder. */
export const EXPERIENCE_KINDS = ["roles", "projects", "stories"] as const;
export type ExperienceKind = (typeof EXPERIENCE_KINDS)[number];

/** The kinds of note that hold achievements. */
export const ACHIEVEMENT_KINDS = ["roles", "projects"] as const;

export const PROJECT_KINDS = ["open-source", "coursework", "hackathon", "side-project"] as const;
export type ProjectKind = (typeof PROJECT_KINDS)[number];

/** One piece of work, a `###` subsection of a role note or a project note. */
export type Achievement = {
  /** The name that a reference uses after `#`. */
  anchor: string;
  /** The heading as the note writes it. */
  title: string;
};

/** A skill slug with its name in the skills inventory. The name is the slug if the inventory does not have the skill. */
export type Skill = { slug: string; name: string };

/** A note that a different note names. */
export type NoteRef = { kind: ExperienceKind; slug: string; title: string };

export type RoleSummary = {
  slug: string;
  /** The title of the note. */
  title: string;
  company: string | null;
  jobTitle: string | null;
  team: string | null;
  /** `YYYY-MM`. */
  start: string | null;
  /** `YYYY-MM`. `null` for the current role. */
  end: string | null;
  /** The slug of the role note for the programme that this stint is part of. */
  programme: string | null;
};

/** A role in the list of roles. The role note of a programme holds its stints. */
export type RoleEntry = RoleSummary & { stints: RoleSummary[] };

export type ProjectSummary = {
  slug: string;
  title: string;
  /** `null` if the note has a kind that the vault's rules do not permit. */
  kind: ProjectKind | null;
  start: string | null;
  /** `null` for a project that continues. */
  end: string | null;
  /** `true` if the project can go on a resume. */
  onProfile: boolean;
};

export type StorySummary = {
  slug: string;
  title: string;
  competencies: string[];
  /** The role notes that the story comes from. A slug with no role note is not here. */
  roles: NoteRef[];
};

export type ExperienceOverview = {
  /** `null` if the vault has no profile. */
  profile: { body: string; updated: string | null } | null;
  roles: RoleEntry[];
  projects: ProjectSummary[];
  stories: StorySummary[];
};

export type ExperienceNote = {
  kind: ExperienceKind;
  slug: string;
  title: string;
  /** The markdown below the frontmatter, without the first `#` heading. */
  body: string;
  achievements: Achievement[];
  skills: Skill[];
  revisits: Revisit[];
  /** The facts of a role note. `null` for each other kind. */
  role:
    | (Omit<RoleSummary, "slug" | "title" | "programme"> & {
        programme: NoteRef | null;
        stints: RoleSummary[];
        /** The stories that name the role. */
        stories: NoteRef[];
      })
    | null;
  /** The facts of a project note. `null` for each other kind. */
  project: (Omit<ProjectSummary, "slug" | "title"> & { link: string | null }) | null;
  /** The facts of a story. `null` for each other kind. */
  story: Pick<StorySummary, "competencies" | "roles"> | null;
};

export type InventorySkill = Skill & {
  /** The number of role notes and project notes that list the skill. */
  uses: number;
};

export type SkillsInventory = {
  updated: string | null;
  /** The `Pinned` section of the inventory, as markdown. Can be empty. */
  pinned: string;
  categories: { name: string; skills: InventorySkill[] }[];
  /** The skills that a note lists and the inventory does not have. */
  unlisted: InventorySkill[];
};

export type SkillUse = Skill & {
  /** The category in the inventory. `null` if the inventory does not have the skill. */
  category: string | null;
  /** Each role note and project note that lists the skill, newest first. */
  notes: (NoteRef & { start: string | null; end: string | null })[];
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

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function month(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value.trim()) ? value.trim() : null;
}

/** A month or a day. YAML reads a day as a date. */
function monthOrDay(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === "string" && /^\d{4}-\d{2}(-\d{2})?$/.test(value.trim()) ? value.trim() : null;
}

function slugs(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item !== "") : [];
}

/** `slow-build` as `Slow build`. */
function nameOf(slug: string): string {
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * The title of an experience note. The first `#` heading, if the note has one. If not, a role
 * note has its job title, its company and its team, and each other note has its slug as words.
 */
function titleOf(note: Note, kind: ExperienceKind): string {
  const { title } = splitTitle(note.body);
  if (title) return title;
  const jobTitle = text(note.frontmatter.title);
  const company = text(note.frontmatter.company);
  const team = text(note.frontmatter.team);
  // The stints of one programme have the same job title and company. The team tells them apart.
  if (kind === "roles" && jobTitle && company) return `${jobTitle}, ${company}${team ? ` (${team})` : ""}`;
  return nameOf(note.slug);
}

function notesOf(index: VaultIndex, kind: ExperienceKind): Note[] {
  const folder = `experience/${kind}/`;
  const notes: Note[] = [];
  for (const [path, note] of index.notes) {
    if (path.startsWith(folder) && !path.slice(folder.length).includes("/")) notes.push(note);
  }
  return notes;
}

function refOf(index: VaultIndex, kind: ExperienceKind, slug: string): NoteRef | null {
  const note = index.notes.get(`experience/${kind}/${slug}.md`);
  return note ? { kind, slug, title: titleOf(note, kind) } : null;
}

function refsOf(index: VaultIndex, kind: ExperienceKind, list: string[]): NoteRef[] {
  return list.map((slug) => refOf(index, kind, slug)).filter((ref) => ref !== null);
}

/** The newest start first. With the same start, a note with no end is first, then the newest end. */
function newestFirst(
  a: { start: string | null; end: string | null; slug: string },
  b: { start: string | null; end: string | null; slug: string },
): number {
  return (
    (b.start ?? "").localeCompare(a.start ?? "") ||
    (b.end ?? "9999").localeCompare(a.end ?? "9999") ||
    a.slug.localeCompare(b.slug)
  );
}

function roleSummary(note: Note): RoleSummary {
  const { frontmatter } = note;
  return {
    slug: note.slug,
    title: titleOf(note, "roles"),
    company: text(frontmatter.company),
    jobTitle: text(frontmatter.title),
    team: text(frontmatter.team),
    start: month(frontmatter.start),
    end: month(frontmatter.end),
    programme: text(frontmatter.programme),
  };
}

/** The stints of each programme that has a role note, newest first. The key is the slug of the programme. */
function stintsByProgramme(roles: RoleSummary[]): Map<string, RoleSummary[]> {
  const known = new Set(roles.map((role) => role.slug));
  const stints = new Map<string, RoleSummary[]>();
  for (const role of [...roles].sort(newestFirst)) {
    if (!role.programme || role.programme === role.slug || !known.has(role.programme)) continue;
    stints.set(role.programme, [...(stints.get(role.programme) ?? []), role]);
  }
  return stints;
}

/**
 * The list of roles, newest first. The stints of a programme are in the entry of the programme,
 * and that entry has the place of its newest stint.
 */
export function getRoles(index: VaultIndex): RoleEntry[] {
  const roles = notesOf(index, "roles").map(roleSummary);
  const stints = stintsByProgramme(roles);
  const inProgramme = new Set([...stints.values()].flat().map((stint) => stint.slug));
  const newest = (entry: RoleEntry) => [entry, ...entry.stints].sort(newestFirst)[0] ?? entry;
  return roles
    .filter((role) => !inProgramme.has(role.slug))
    .map((role) => ({ ...role, stints: stints.get(role.slug) ?? [] }))
    .sort((a, b) => newestFirst({ ...newest(a), slug: a.slug }, { ...newest(b), slug: b.slug }));
}

function projectSummary(note: Note): ProjectSummary {
  const { frontmatter } = note;
  const kind = text(frontmatter.kind);
  return {
    slug: note.slug,
    title: titleOf(note, "projects"),
    kind: PROJECT_KINDS.find((candidate) => candidate === kind) ?? null,
    start: month(frontmatter.start),
    end: month(frontmatter.end),
    onProfile: frontmatter["on-profile"] === true,
  };
}

function storySummary(index: VaultIndex, note: Note): StorySummary {
  return {
    slug: note.slug,
    title: titleOf(note, "stories"),
    competencies: slugs(note.frontmatter.competencies),
    roles: refsOf(index, "roles", slugs(note.frontmatter.roles)),
  };
}

/** The profile and the lists of role notes, project notes and stories. */
export function getOverview(index: VaultIndex): ExperienceOverview {
  const profile = index.notes.get("experience/profile.md");
  return {
    profile: profile ? { body: splitTitle(profile.body).body, updated: monthOrDay(profile.frontmatter.updated) } : null,
    roles: getRoles(index),
    projects: notesOf(index, "projects").map(projectSummary).sort(newestFirst),
    stories: notesOf(index, "stories")
      .map((note) => storySummary(index, note))
      .sort((a, b) => a.title.localeCompare(b.title) || a.slug.localeCompare(b.slug)),
  };
}

const INVENTORY = "experience/skills.md";
// `- `slug` - Name`. The mark between the slug and the name is a hyphen, a dash or a colon.
const SKILL_ITEM = /^[-*] +`([^`]+)`\s*(?:[-–—:]\s*)?(.*)$/;

type Inventory = { updated: string | null; pinned: string; categories: { name: string; skills: Skill[] }[] };

/**
 * Reads the skills inventory. A `##` section is a category, and each list item that starts with a
 * slug in code marks is a skill. The section whose heading starts with `Pinned` is free text.
 */
function readInventory(index: VaultIndex): Inventory {
  const note = index.notes.get(INVENTORY);
  const inventory: Inventory = { updated: monthOrDay(note?.frontmatter.updated), pinned: "", categories: [] };
  if (!note) return inventory;
  let pinned: string[] | null = null;
  let category: { name: string; skills: Skill[] } | null = null;
  let skill: Skill | null = null;
  for (const line of note.body.split("\n")) {
    if (line.startsWith("## ")) {
      const name = line.slice(3).trim();
      skill = null;
      if (/^pinned\b/i.test(name)) {
        pinned = [];
        category = null;
      } else {
        pinned = null;
        category = { name, skills: [] };
        inventory.categories.push(category);
      }
      continue;
    }
    if (pinned) {
      pinned.push(line);
      inventory.pinned = pinned.join("\n").trim();
      continue;
    }
    if (!category) continue;
    const match = SKILL_ITEM.exec(line);
    if (match?.[1]) {
      skill = { slug: match[1].trim(), name: (match[2] ?? "").trim() };
      category.skills.push(skill);
    } else if (skill && /^\s+\S/.test(line)) {
      // A line with an indent continues the name of the skill.
      skill.name = `${skill.name} ${line.trim()}`.trim();
    } else {
      skill = null;
    }
  }
  for (const { skills } of inventory.categories) {
    for (const item of skills) item.name ||= item.slug;
  }
  inventory.categories = inventory.categories.filter(({ skills }) => skills.length > 0);
  return inventory;
}

function skillNames(inventory: Inventory): Map<string, string> {
  return new Map(inventory.categories.flatMap(({ skills }) => skills.map(({ slug, name }) => [slug, name])));
}

function skillsOf(note: Note, names: Map<string, string>): Skill[] {
  return slugs(note.frontmatter.skills).map((slug) => ({ slug, name: names.get(slug) ?? slug }));
}

/** The number of role notes and project notes that list each skill. */
function skillUses(index: VaultIndex): Map<string, number> {
  const uses = new Map<string, number>();
  for (const kind of ACHIEVEMENT_KINDS) {
    for (const note of notesOf(index, kind)) {
      for (const slug of new Set(slugs(note.frontmatter.skills))) uses.set(slug, (uses.get(slug) ?? 0) + 1);
    }
  }
  return uses;
}

/** The skills inventory with the number of notes that list each skill. */
export function getSkills(index: VaultIndex): SkillsInventory {
  const inventory = readInventory(index);
  const uses = skillUses(index);
  const names = skillNames(inventory);
  return {
    updated: inventory.updated,
    pinned: inventory.pinned,
    categories: inventory.categories.map(({ name, skills }) => ({
      name,
      skills: skills.map((skill) => ({ ...skill, uses: uses.get(skill.slug) ?? 0 })),
    })),
    unlisted: [...uses]
      .filter(([slug]) => !names.has(slug))
      .map(([slug, count]) => ({ slug, name: slug, uses: count }))
      .sort((a, b) => a.slug.localeCompare(b.slug)),
  };
}

/** One skill with each note that lists it, or null if no note and no inventory item has the slug. */
export function getSkill(index: VaultIndex, slug: string): SkillUse | null {
  const inventory = readInventory(index);
  const category = inventory.categories.find(({ skills }) => skills.some((skill) => skill.slug === slug));
  const notes = ACHIEVEMENT_KINDS.flatMap((kind) =>
    notesOf(index, kind)
      .filter((note) => slugs(note.frontmatter.skills).includes(slug))
      .map((note) => ({
        kind,
        slug: note.slug,
        title: titleOf(note, kind),
        start: month(note.frontmatter.start),
        end: month(note.frontmatter.end),
      })),
  ).sort(newestFirst);
  if (!category && notes.length === 0) return null;
  return {
    slug,
    name: category?.skills.find((skill) => skill.slug === slug)?.name ?? slug,
    category: category?.name ?? null,
    notes,
  };
}

/** The `###` headings below the `## Achievements` heading. */
function achievementsOf(body: string): Achievement[] {
  const achievements: Achievement[] = [];
  let inAchievements = false;
  for (const line of body.split("\n")) {
    if (line.startsWith("## ")) {
      inAchievements = line.slice(3).trim().toLowerCase() === "achievements";
    } else if (inAchievements && line.startsWith("### ")) {
      const heading = line.slice(4).trim();
      achievements.push({ anchor: anchorOf(heading), title: heading });
    }
  }
  return achievements;
}

/** A role note, a project note or a story, or null if the vault has no such note. */
export function getExperienceNote(index: VaultIndex, kind: ExperienceKind, slug: string): ExperienceNote | null {
  const note = index.notes.get(`experience/${kind}/${slug}.md`);
  if (!note) return null;
  const { body } = splitTitle(note.body);
  const found: ExperienceNote = {
    kind,
    slug,
    title: titleOf(note, kind),
    body,
    achievements: kind === "stories" ? [] : achievementsOf(body),
    skills: kind === "stories" ? [] : skillsOf(note, skillNames(readInventory(index))),
    revisits: note.revisits,
    role: null,
    project: null,
    story: null,
  };
  if (kind === "roles") {
    const { slug: _slug, title: _title, programme, ...facts } = roleSummary(note);
    found.role = {
      ...facts,
      programme: programme ? refOf(index, "roles", programme) : null,
      stints: stintsByProgramme(notesOf(index, "roles").map(roleSummary)).get(slug) ?? [],
      stories: notesOf(index, "stories")
        .filter((story) => slugs(story.frontmatter.roles).includes(slug))
        .map((story) => ({ kind: "stories" as const, slug: story.slug, title: titleOf(story, "stories") }))
        .sort((a, b) => a.title.localeCompare(b.title)),
    };
  } else if (kind === "projects") {
    const { slug: _slug, title: _title, ...facts } = projectSummary(note);
    const link = text(note.frontmatter.link);
    // Only a web address can become a link on the page.
    found.project = { ...facts, link: link && /^https?:\/\//.test(link) ? link : null };
  } else {
    const { competencies, roles } = storySummary(index, note);
    found.story = { competencies, roles };
  }
  return found;
}

/** Finds a role note or a project note by its slug. A slug is unique in the vault. */
export function findExperienceNote(
  index: VaultIndex,
  slug: string,
): (ExperienceNote & { kind: (typeof ACHIEVEMENT_KINDS)[number] }) | null {
  for (const kind of ACHIEVEMENT_KINDS) {
    const note = getExperienceNote(index, kind, slug);
    if (note) return { ...note, kind };
  }
  return null;
}
