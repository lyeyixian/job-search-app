const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

/** `2023-07` as `Jul 2023`. */
export function month(value: string | null): string {
  return value ? monthFormat.format(new Date(`${value}-01T00:00:00Z`)) : "None";
}

/** `Jul 2023 to present`. Work with no end month continues. One month shows one time. */
export function months(start: string | null, end: string | null): string {
  if (start && start === end) return month(start);
  return `${month(start)} to ${end ? month(end) : "present"}`;
}
