# ADR-0004: Run in a Docker container

**Status:** Accepted (2026-11-14)

## Context

The app runs on a home server and is reached over Tailscale with no sign-in.

Options: a Docker container, a plain systemd service.

## Decision

The app runs in a Docker container managed by Docker Compose. The container publishes its port on `127.0.0.1` only. `tailscale serve` on the host forwards the tailnet HTTPS address to that port.

## Consequences

- The image carries Node, the built app and git.
- The vault clone lives in a volume. The deploy key is a read-only mount.
- Only devices on the tailnet can open the app.
- The scan step must mount Claude Code's login and config into the container. A plain service would have had them already.
