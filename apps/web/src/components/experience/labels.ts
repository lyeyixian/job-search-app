/** The words that the app shows for the values of the experience notes. */

export const PROJECT_KIND_LABEL = {
  "open-source": "Open source",
  coursework: "Coursework",
  hackathon: "Hackathon",
  "side-project": "Side project",
} as const;

export const NOTE_KIND_LABEL = {
  roles: "Role",
  projects: "Project",
  stories: "Story",
} as const;

/** `technical-depth` as `Technical depth`. */
export function competencyName(slug: string): string {
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
