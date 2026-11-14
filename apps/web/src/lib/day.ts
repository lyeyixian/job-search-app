const dayFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** `2026-10-05` as `5 Oct 2026`. A day in the vault has no time zone. */
export function day(value: string | null): string {
  return value ? dayFormat.format(new Date(`${value}T00:00:00Z`)) : "None";
}
