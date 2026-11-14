# ADR-0009: A separate API service, built with Hono

**Status:** Accepted (2026-11-14)

## Context

[ADR-0008](0008-rest-api-with-generated-openapi-docs.md) put all data behind a REST API. The API
could live inside the Next.js app or run as its own service. A separate service could be in
TypeScript or in Python.

Options for the place: inside the Next.js app, or a separate service. Options for the language:
TypeScript with Hono, or Python with FastAPI.

## Decision

The app is two services. **Web** is the Next.js app and only renders pages. **API** is a Hono
service on Node, in TypeScript, and owns the vault clone, the vault index and the deploy key.
Each runs in its own container.

## Consequences

- The boundary between UI and data is a network call, so the UI cannot reach into vault code.
- One language across both services. Web takes its API types from the API's code.
- Two images to build and two containers to run. This changes
  [ADR-0004](0004-docker-container.md) and [ADR-0005](0005-github-builds-the-image.md) from one
  container and one image to two.
- The vault index of [ADR-0002](0002-in-memory-vault-index.md) lives in the API process, not in
  Next.js. The rule that Next.js must not cache a page across a Refresh still holds.
- The API returns a note body as markdown with a table of its resolved links. Web renders it.
- Only Web has a port on the host. Web forwards `/api/*` from the browser to the API.
- The scan step later mounts Claude Code's login into the API container only.
- FastAPI was the recommended option, for its built-in OpenAPI and its fit with Python tools.
  One language was preferred.
