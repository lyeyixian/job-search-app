import { z } from "zod";

export const STATUSES = ["analyzed", "applied", "interviewing", "offer", "accepted", "rejected", "dropped"] as const;
export const VERDICTS = ["strong-fit", "good-fit", "stretch", "skip"] as const;
export const DIRECTIONS = ["aligned", "caution", "conflict"] as const;
export const REGIONS = ["sg", "remote"] as const;

export type Status = (typeof STATUSES)[number];
export type Verdict = (typeof VERDICTS)[number];
export type Direction = (typeof DIRECTIONS)[number];
export type Region = (typeof REGIONS)[number];

/** A field of a note that breaks the vault's rules. */
export type Warning = {
  /** The frontmatter key. */
  field: string;
  problem: "missing" | "invalid";
};

// YAML reads `2026-10-05` as a date. A day in the vault has no time, so the UTC day is the day.
const day = z.union([
  z.date().transform((date) => date.toISOString().slice(0, 10)),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
]);

/** A day cell of a scan table or a day of the frontmatter as `YYYY-MM-DD`, or null if the value is not a day. */
export function checkDay(value: unknown): string | null {
  const result = day.safeParse(typeof value === "string" ? value.trim() : value);
  return result.success ? result.data : null;
}

/** The keys of an application that the app reads. SCHEMA.md of the vault has the rules. */
const applicationFields = {
  company: z.string().min(1),
  title: z.string().min(1),
  region: z.enum(REGIONS),
  status: z.enum(STATUSES),
  captured: day,
  // `null` before the first fit analysis.
  verdict: z.enum(VERDICTS).nullable(),
  direction: z.enum(DIRECTIONS).nullable(),
};

export type ApplicationFrontmatter = {
  [K in keyof typeof applicationFields]: z.infer<(typeof applicationFields)[K]> | null;
};

/** The keys that only the page of one application reads. */
const applicationDetailFields = {
  // Only a web address can become a link on the page.
  url: z.url({ protocol: /^https?$/ }).nullable(),
  // `<company>/<listing-slug>` of the listing that the application came from.
  "source-listing": z
    .string()
    .regex(/^[^/\s]+\/[^/\s]+$/)
    .nullable(),
  // `null` before the first fit analysis.
  analyzed: day.nullable(),
};

export type ApplicationDetailFrontmatter = {
  [K in keyof typeof applicationDetailFields]: z.infer<(typeof applicationDetailFields)[K]> | null;
};

/** Never throws. A field that is missing or has a value that the rules do not permit becomes `null` and gets a warning. */
function check<F>(schemas: Record<string, z.ZodType>, frontmatter: Record<string, unknown>) {
  const fields: Record<string, unknown> = {};
  const warnings: Warning[] = [];
  for (const [field, schema] of Object.entries(schemas)) {
    if (!(field in frontmatter)) {
      fields[field] = null;
      warnings.push({ field, problem: "missing" });
      continue;
    }
    const result = schema.safeParse(frontmatter[field]);
    fields[field] = result.success ? result.data : null;
    if (!result.success) warnings.push({ field, problem: "invalid" });
  }
  return { fields: fields as F, warnings };
}

/** Checks the keys of an application that each view of it reads. */
export function checkApplication(frontmatter: Record<string, unknown>): {
  fields: ApplicationFrontmatter;
  warnings: Warning[];
} {
  return check<ApplicationFrontmatter>(applicationFields, frontmatter);
}

/** Checks the keys that only the page of one application reads. */
export function checkApplicationDetail(frontmatter: Record<string, unknown>): {
  fields: ApplicationDetailFrontmatter;
  warnings: Warning[];
} {
  return check<ApplicationDetailFrontmatter>(applicationDetailFields, frontmatter);
}

const words = z.string().trim().min(1);
const month = z.string().regex(/^\d{4}-\d{2}$/);
const monthOrDay = z.union([day, month]);
const slugList = z.array(z.string().min(1));
const webAddress = z.url({ protocol: /^https?$/ });

type Rule = { schema: z.ZodType; optional?: true };

/** The keys of each other note type that has a page. SCHEMA.md of the vault has the rules. */
const noteRules = {
  role: {
    company: { schema: words },
    title: { schema: words },
    team: { schema: words },
    programme: { schema: words, optional: true },
    start: { schema: month },
    end: { schema: month.nullable() },
    skills: { schema: slugList },
  },
  project: {
    kind: { schema: z.enum(["open-source", "coursework", "hackathon", "side-project"]) },
    start: { schema: month },
    end: { schema: month.nullable() },
    skills: { schema: slugList },
    link: { schema: webAddress, optional: true },
    "on-profile": { schema: z.boolean() },
  },
  story: {
    competencies: { schema: slugList },
    roles: { schema: slugList },
  },
  profile: { updated: { schema: monthOrDay } },
  skills: { updated: { schema: monthOrDay } },
  listing: {
    company: { schema: words },
    // YAML reads an id of only digits as a number.
    "board-id": { schema: z.union([words, z.number()]) },
    title: { schema: words },
    url: { schema: webAddress },
    region: { schema: words },
    "level-hint": { schema: words },
    "first-seen": { schema: day },
  },
} satisfies Record<string, Record<string, Rule>>;

export type CheckedNoteType = keyof typeof noteRules;

/**
 * The warnings of a note of one of the types above. Never throws. A required key with no value
 * or with a value that the rules do not permit gets a warning. An optional key gets a warning
 * only if the note has it with a value that the rules do not permit.
 */
export function checkNote(type: CheckedNoteType, frontmatter: Record<string, unknown>): Warning[] {
  const warnings: Warning[] = [];
  for (const [field, rule] of Object.entries<Rule>(noteRules[type])) {
    if (!(field in frontmatter)) {
      if (!rule.optional) warnings.push({ field, problem: "missing" });
    } else if (!rule.schema.safeParse(frontmatter[field]).success) {
      warnings.push({ field, problem: "invalid" });
    }
  }
  return warnings;
}
