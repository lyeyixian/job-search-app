# ADR-0005: GitHub builds the image

**Status:** Accepted (2026-11-14)

## Context

A new version of the app has to reach the home server.

Options: GitHub Actions builds the image and the server pulls it, or the server builds from a clone of the repo.

## Decision

A GitHub Actions workflow builds the image on each merge to `main` and pushes it to the GitHub Container Registry. The server runs `docker compose pull && docker compose up -d`, by hand for now.

## Consequences

- Since [ADR-0009](0009-separate-api-service-with-hono.md) the workflow builds two images, Web and API.
- Free for a public repo.
- A broken build fails in GitHub, not on the server.
- The server needs no Node toolchain and no clone of the app repo.
- The image is public. It holds only app code.
