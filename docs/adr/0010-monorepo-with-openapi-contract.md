# ADR-0010: One repo, two apps, and the OpenAPI document as the contract

**Status:** Accepted (2026-11-14)

## Context

[ADR-0009](0009-separate-api-service-with-hono.md) split the app into Web and API. Web has to
know the shape of each API response.

Options: Web generates its types from the OpenAPI document, or both apps import Zod schemas from
a shared package.

## Decision

One repo with pnpm workspaces, `apps/web` and `apps/api`. The two apps share no code. The API
writes `docs/api/openapi.json`. Web generates its types and its client from that file. Since
[ADR-0014](0014-orval-generates-the-web-client.md) the generator is Orval.

Inside the API, `src/vault/` never imports from `src/http/`.

## Consequences

- The OpenAPI document is the contract. If it is wrong, the Web build fails.
- A change to an endpoint needs two steps: generate the document, then update Web.
- A script, an agent or a second client uses the API the same way that Web does.
- Web cannot reuse the API's Zod schemas, for example to check a form.
- A check on each pull request fails if the committed document differs from the generated one.
