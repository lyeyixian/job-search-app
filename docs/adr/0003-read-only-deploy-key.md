# ADR-0003: A read-only deploy key for the vault

**Status:** Accepted (2026-11-14)

## Context

The app repo is public. The vault repo is private. The server needs the vault, and no secret may reach the app repo.

Options: an SSH deploy key on the server, a personal access token in an env file.

## Decision

The server holds an SSH key. The vault repo lists its public half as a deploy key with no write access. The app knows only `VAULT_PATH` and runs `git pull` there.

## Consequences

- The app code never handles a credential.
- The key reads one repo and does not expire.
- When editing arrives, the tailored resume is still a vault file, so the key then needs write access.
