# Stack

The frameworks and libraries, each with its job. The last column links to the decision record, or
says "Agreed" for a choice made on 14 Nov 2026 with no record of its own. The exact
versions are in each `package.json` and in `pnpm-lock.yaml`. Each package is at its latest
version, with TypeScript 7, Node 26 and pnpm 12.

## Web

| Layer | Choice | Job | Status |
|---|---|---|---|
| Language | TypeScript | All Web code | [ADR-0001](../adr/0001-nextjs-with-typescript.md) |
| Framework | Next.js, App Router | Server rendering and page routes | [ADR-0001](../adr/0001-nextjs-with-typescript.md) |
| Components | shadcn/ui on Radix | Menu, tabs, tables, badges, filters | [ADR-0006](../adr/0006-tailwind-with-shadcn-ui.md) |
| Styling | Tailwind CSS | Layout and phone breakpoints | [ADR-0006](../adr/0006-tailwind-with-shadcn-ui.md) |
| Markdown view | unified with remark and rehype | Turns a note body into HTML with links | [ADR-0001](../adr/0001-nextjs-with-typescript.md) |
| PDF view | PDF.js | Draws the committed resume PDF | [ADR-0007](../adr/0007-serve-the-committed-resume-pdf.md) |
| API client | `openapi-typescript`, `openapi-fetch` | Types and calls generated from the OpenAPI document | [ADR-0010](../adr/0010-monorepo-with-openapi-contract.md) |

## API

| Layer | Choice | Job | Status |
|---|---|---|---|
| Language | TypeScript | All API code | [ADR-0009](../adr/0009-separate-api-service-with-hono.md) |
| Framework | Hono on Node | Routes and middleware | [ADR-0009](../adr/0009-separate-api-service-with-hono.md) |
| Schemas | Zod | Requests, responses and note frontmatter | [ADR-0008](../adr/0008-rest-api-with-generated-openapi-docs.md) |
| OpenAPI | `@hono/zod-openapi` | Builds the OpenAPI document from the schemas | Agreed |
| Docs page | Scalar | Shows the OpenAPI document at `/api/docs` | Agreed |
| Frontmatter | gray-matter | Splits a note into YAML and body | Agreed |
| Markdown | unified with remark | Parses a note and finds its links | Agreed |
| Logging | pino | One JSON line per request, with the trace id | [ADR-0012](../adr/0012-problem-details-and-json-logs.md) |
| Vault sync | git command line | `git pull` in the vault clone | [ADR-0003](../adr/0003-read-only-deploy-key.md) |

## Both services

| Layer | Choice | Job | Status |
|---|---|---|---|
| Runtime | Node, current LTS | Runs each service | Agreed |
| Tracing | OpenTelemetry SDK, OTLP export | One trace per page load across both services | [ADR-0013](../adr/0013-opentelemetry-with-optional-viewer.md) |
| Trace viewer | Grafana | Shows traces, only when the tracing profile runs. Not set up yet. | Agreed |
| Package manager | pnpm workspaces | One repo, two apps | [ADR-0010](../adr/0010-monorepo-with-openapi-contract.md) |
| Unit and API tests | Vitest | The vault module and each endpoint | [ADR-0011](../adr/0011-three-test-layers.md) |
| Browser tests | Playwright | One test per acceptance criterion | [ADR-0011](../adr/0011-three-test-layers.md) |
| Lint and format | Biome | One tool for lint and format, with its Next.js rule group | Agreed |
| Checks | GitHub Actions | Six required jobs on each pull request, see [checks](checks.md) | Agreed |
| Container | Docker, Docker Compose | Runs both services on the server | [ADR-0004](../adr/0004-docker-container.md) |
| Build | GitHub Actions | Builds and pushes both images | [ADR-0005](../adr/0005-github-builds-the-image.md) |
| Registry | GitHub Container Registry | Holds the public images | [ADR-0005](../adr/0005-github-builds-the-image.md) |
| Network | Tailscale, `tailscale serve` | Private HTTPS access | [ADR-0004](../adr/0004-docker-container.md) |

`openapi-typescript` needs the JS API of TypeScript 5, which TypeScript 7 does not have. The hook
in `.pnpmfile.cjs` gives it a private copy of TypeScript 5. Remove the hook when
`openapi-typescript` supports TypeScript 7.

Later steps add `better-sqlite3` for scan data and the Claude Agent SDK to start a scan.
