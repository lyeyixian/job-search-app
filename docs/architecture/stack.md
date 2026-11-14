# Stack

The frameworks and libraries, each with its job. A row marked "proposed" is not agreed yet.

## Web

| Layer | Choice | Job | Status |
|---|---|---|---|
| Language | TypeScript | All Web code | [ADR-0001](../adr/0001-nextjs-with-typescript.md) |
| Framework | Next.js, App Router | Server rendering and page routes | [ADR-0001](../adr/0001-nextjs-with-typescript.md) |
| Components | shadcn/ui on Radix | Menu, tabs, tables, badges, filters | [ADR-0006](../adr/0006-tailwind-with-shadcn-ui.md) |
| Styling | Tailwind CSS | Layout and phone breakpoints | [ADR-0006](../adr/0006-tailwind-with-shadcn-ui.md) |
| Markdown view | unified with remark and rehype | Turns a note body into HTML with links | [ADR-0001](../adr/0001-nextjs-with-typescript.md) |
| PDF view | PDF.js | Draws the committed resume PDF | [ADR-0007](../adr/0007-serve-the-committed-resume-pdf.md) |
| API client | Hono client, typed from the API | Calls each endpoint with checked types | Proposed |

## API

| Layer | Choice | Job | Status |
|---|---|---|---|
| Language | TypeScript | All API code | [ADR-0009](../adr/0009-separate-api-service-with-hono.md) |
| Framework | Hono on Node | Routes and middleware | [ADR-0009](../adr/0009-separate-api-service-with-hono.md) |
| Schemas | Zod | Requests, responses and note frontmatter | [ADR-0008](../adr/0008-rest-api-with-generated-openapi-docs.md) |
| OpenAPI | `@hono/zod-openapi` | Builds the OpenAPI document from the schemas | Proposed |
| Docs page | Scalar | Shows the OpenAPI document at `/api/docs` | Proposed |
| Frontmatter | gray-matter | Splits a note into YAML and body | Proposed |
| Markdown | unified with remark | Parses a note and finds its links | Proposed |
| Vault sync | git command line | `git pull` in the vault clone | [ADR-0003](../adr/0003-read-only-deploy-key.md) |

## Both services

| Layer | Choice | Job | Status |
|---|---|---|---|
| Runtime | Node, current LTS | Runs each service | Proposed |
| Package manager | pnpm workspaces | One repo, two apps, shared packages | Proposed |
| Unit tests | Vitest | The vault module against made-up notes | Proposed |
| Browser tests | Playwright | The acceptance criteria in the spec | Proposed |
| Lint and format | ESLint, Prettier | Checks on each pull request | Proposed |
| Container | Docker, Docker Compose | Runs both services on the server | [ADR-0004](../adr/0004-docker-container.md) |
| Build | GitHub Actions | Builds and pushes both images | [ADR-0005](../adr/0005-github-builds-the-image.md) |
| Registry | GitHub Container Registry | Holds the public images | [ADR-0005](../adr/0005-github-builds-the-image.md) |
| Network | Tailscale, `tailscale serve` | Private HTTPS access | [ADR-0004](../adr/0004-docker-container.md) |

Later steps add `better-sqlite3` for scan data and the Claude Agent SDK to start a scan.
