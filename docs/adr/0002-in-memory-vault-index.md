# ADR-0002: One vault index held in memory

**Status:** Accepted (2026-11-14)

## Context

"See what points to a note" and "a link to nothing is visible" need the whole vault parsed before one page can render. The vault is a few hundred notes plus about 860 listings. In version one the vault files are the only source of truth.

Options: an index in memory, SQLite from the start, parse per page.

## Decision

At start and on each Refresh, the app pulls the vault clone and parses every note into one index in memory. Every page reads from the index. Version one has no database.

## Consequences

- The index is a singleton, so the service that holds it runs as one process. Since [ADR-0009](0009-separate-api-service-with-hono.md) that service is the API.
- Pages render on each request. Next.js must not cache a page across a Refresh.
- A new index replaces the old one in one step. If the pull or the parse fails, the old index stays and the page shows the error.
- A note that breaks the schema stays in the index with a warning.
- SQLite arrives with the scan step, designed then.
