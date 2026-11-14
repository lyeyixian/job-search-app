# ADR-0001: Next.js with TypeScript

**Status:** Accepted (2026-11-14)

## Context

Almost every page is a markdown note turned into HTML on the server. The links feature needs the app to walk a parsed note and rewrite each link: wikilinks, links to one achievement, missing targets and backlinks. Later steps need SQLite, a way to start Claude Code, and editing.

Options: Next.js, FastAPI with HTMX, SvelteKit, ASP.NET.

## Decision

Next.js with TypeScript, run as one long-lived Node process.

## Consequences

- Server components read the vault index and render a page with no separate API for page data.
- The remark and unified libraries do the link rewriting. This was the deciding point against FastAPI, where that code would be hand-written.
- `better-sqlite3`, the TypeScript Agent SDK and server actions cover the later steps in the same stack.
- The app cannot run on a serverless host. See [ADR-0002](0002-in-memory-vault-index.md).
