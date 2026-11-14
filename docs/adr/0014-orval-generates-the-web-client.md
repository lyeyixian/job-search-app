# ADR-0014: Orval generates the Web API client

**Status:** Accepted (2026-11-14)

## Context

[ADR-0010](0010-monorepo-with-openapi-contract.md) named `openapi-typescript` and `openapi-fetch`
for the Web client. On 19 Sep 2026 the maintainer put `openapi-typescript` in maintenance mode. It
gets no more updates, and it does not run on TypeScript 7, which the project uses. Each candidate
was run on TypeScript 7.0.2 with `docs/api/openapi.json`. Orval 8.47 worked. Hey API openapi-ts
0.99 failed with the same error as `openapi-typescript`. Kubb 5 did not generate in a short test.

Options: Orval, Hey API openapi-ts, Kubb, `openapi-typescript` with a private copy of TypeScript 5.

## Decision

Orval generates `apps/web/src/api/generated.ts` from `docs/api/openapi.json`, with its `fetch`
client. The generated functions call `apiFetch` in `apps/web/src/api/fetcher.ts`.

## Consequences

- This replaces the tools named in ADR-0010. The rest of ADR-0010 holds: the OpenAPI document is
  the contract, and the two apps share no code.
- Web has no runtime dependency for API calls. The generated code is plain `fetch` functions.
- Each response type is a union on the status code, so Web gets a typed `Problem` for an error
  status that the OpenAPI document declares.
- `apiFetch` is the one place for the address of the API, the `traceparent` header and the log
  line.
- `pnpm openapi` needs no workaround for TypeScript 7.
- The generated file holds code, not only types, so a change of Orval's templates shows up as a
  diff in `generated.ts`.
- Orval installs its own copy of TypeScript 6 for generators that this project does not use.
