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

/**
 * Checks the frontmatter of an application. Never throws. A field that is missing or has a
 * value that the rules do not permit becomes `null` and gets a warning.
 */
export function checkApplication(frontmatter: Record<string, unknown>): {
  fields: ApplicationFrontmatter;
  warnings: Warning[];
} {
  const fields: Record<string, unknown> = {};
  const warnings: Warning[] = [];
  for (const [field, schema] of Object.entries(applicationFields)) {
    if (!(field in frontmatter)) {
      fields[field] = null;
      warnings.push({ field, problem: "missing" });
      continue;
    }
    const result = schema.safeParse(frontmatter[field]);
    fields[field] = result.success ? result.data : null;
    if (!result.success) warnings.push({ field, problem: "invalid" });
  }
  return { fields: fields as ApplicationFrontmatter, warnings };
}
