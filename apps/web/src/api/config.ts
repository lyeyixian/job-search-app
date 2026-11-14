/** The address of the API, as the Web server reaches it. Read at run time, not at build time. */
export function apiUrl(): string {
  return process.env.API_URL || "http://localhost:3001";
}
