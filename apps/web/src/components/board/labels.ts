/** The words that the app shows for the values of an application. */

export const STATUS_LABEL = {
  analyzed: "Analyzed",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected",
  dropped: "Dropped",
} as const;

export const VERDICT_LABEL = {
  "strong-fit": "Strong fit",
  "good-fit": "Good fit",
  stretch: "Stretch",
  skip: "Skip",
} as const;

export const DIRECTION_LABEL = {
  aligned: "Aligned",
  caution: "Caution",
  conflict: "Conflict",
} as const;

export const REGION_LABEL = {
  sg: "Singapore",
  remote: "Remote",
} as const;

export type Status = keyof typeof STATUS_LABEL;

/** The statuses that still need an action. Each one is a column of the board. */
export const OPEN_STATUSES = ["analyzed", "applied", "interviewing", "offer"] as const satisfies readonly Status[];

/** The statuses that need no more action. They share one closed group at the end of the board. */
export const FINISHED_STATUSES = ["accepted", "rejected", "dropped"] as const satisfies readonly Status[];

/** The colours of a verdict badge and a direction badge. */
export const VERDICT_STYLE = {
  "strong-fit": "border-transparent bg-emerald-700 text-white",
  "good-fit": "border-transparent bg-emerald-100 text-emerald-900",
  stretch: "border-transparent bg-amber-100 text-amber-900",
  skip: "border-transparent bg-secondary text-muted-foreground",
} as const;

export const DIRECTION_STYLE = {
  aligned: "text-foreground",
  caution: "border-amber-500 text-amber-900",
  conflict: "border-destructive text-destructive",
} as const;

/** The sentence that the app shows for a field of a note that breaks the vault's rules. */
export function warningText(warning: { field: string; problem: "missing" | "invalid" }): string {
  return warning.problem === "missing"
    ? `The note has no ${warning.field}.`
    : `The note has a ${warning.field} that the vault's rules do not permit.`;
}
