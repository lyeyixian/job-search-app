# ADR-0008: A REST API with generated OpenAPI docs

**Status:** Accepted (2026-11-14)

## Context

[ADR-0001](0001-nextjs-with-typescript.md) let pages read the vault index on the server, with no
API for page data. That left three endpoints and nothing to document. The owner wants a designed
REST API with OpenAPI docs, and wants those docs generated, not written by hand.

Options: pages read data directly through a typed module, or a REST API for all data.

## Decision

All data reaches the UI through a REST API. Each endpoint declares its request and its response
as Zod schemas. The OpenAPI document is generated from those schemas, and the app serves it with
a docs page. No file in this repo lists the endpoints by hand.

## Consequences

- The Zod schemas are the one source for validation, TypeScript types and the API docs.
- The docs cannot go out of date, because they come from the code that runs.
- A script, a phone shortcut or a later client can use the same API.
- More code than direct reads: each page's data is an endpoint and a page that calls it.
- This replaces the part of ADR-0001 that says page data needs no API.
- Where the API runs, and how pages call it, is a separate decision.
