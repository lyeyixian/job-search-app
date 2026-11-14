# Pull request checks

What runs on each pull request, and what runs after a merge. Agreed on 14 Nov 2026.

## Sequence: a pull request

What happens between a push and a merge?

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer or agent
    participant Repo as App repo
    participant CI as GitHub Actions
    participant Reg as Container registry

    Dev->>Repo: pushes to a pull request
    Repo->>CI: starts the checks workflow
    CI->>CI: runs the six jobs
    alt a job fails
        CI-->>Dev: a failed check, merge is blocked
    else all jobs pass
        CI-->>Dev: passed checks
        Dev->>Repo: merges to main
        Repo->>CI: starts the release workflow
        CI->>Reg: pushes both images
    end
```

## The checks workflow

All six jobs must pass before a merge.

| Job | Command | Catches |
|---|---|---|
| Lint and type check | `pnpm lint` | Style errors and type errors, in both apps |
| Unit and API tests | `pnpm test` | A broken parser, link resolver or endpoint |
| OpenAPI is current | `pnpm openapi`, then a check for changed files | A committed `openapi.json` or Web types that differ from the code |
| Browser tests | `pnpm e2e` | An acceptance criterion that no longer holds, on desktop or phone |
| Image build | `docker compose build` | A Dockerfile that no longer builds. Nothing is pushed. |
| Docs | A link check and a Mermaid parse | A dead link between docs, or a diagram that does not draw |

## Rules on main

- A branch rule requires the checks workflow to pass.
- Nobody pushes to `main` directly.
- The release workflow runs only on `main`, after a merge. It builds and pushes both images.
