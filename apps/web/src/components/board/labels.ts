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
