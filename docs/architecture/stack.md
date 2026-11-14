# Stack

The frameworks and libraries, each with its job. A row marked "proposed" is not agreed yet.

| Layer | Choice | Job | Status |
|---|---|---|---|
| Language | TypeScript | All app code | [ADR-0001](../adr/0001-nextjs-with-typescript.md) |
| Framework | Next.js, App Router | Server rendering, routes, endpoints | [ADR-0001](../adr/0001-nextjs-with-typescript.md) |
| Runtime | Node, current LTS | Runs the one app process | Proposed |
| Components | shadcn/ui on Radix | Menu, tabs, tables, badges, filters | [ADR-0006](../adr/0006-tailwind-with-shadcn-ui.md) |
| Styling | Tailwind CSS | Layout and phone breakpoints | [ADR-0006](../adr/0006-tailwind-with-shadcn-ui.md) |
| PDF view | PDF.js | Draws the committed resume PDF | [ADR-0007](../adr/0007-serve-the-committed-resume-pdf.md) |
| Frontmatter | gray-matter | Splits a note into YAML and body | Proposed |
| Markdown | unified with remark and rehype | Parses a note, rewrites links, makes HTML | [ADR-0001](../adr/0001-nextjs-with-typescript.md) |
| Schema check | Zod | One schema per note type, returns warnings | Proposed |
| Vault sync | git command line | `git pull` in the vault clone | [ADR-0003](../adr/0003-read-only-deploy-key.md) |
| Package manager | pnpm | Installs and locks dependencies | Proposed |
| Unit tests | Vitest | The vault module against made-up notes | Proposed |
| Browser tests | Playwright | The acceptance criteria in the spec | Proposed |
| Lint and format | ESLint, Prettier | Checks on each pull request | Proposed |
| Container | Docker, Docker Compose | Runs the app on the server | [ADR-0004](../adr/0004-docker-container.md) |
| Build | GitHub Actions | Builds and pushes the image | [ADR-0005](../adr/0005-github-builds-the-image.md) |
| Registry | GitHub Container Registry | Holds the public image | [ADR-0005](../adr/0005-github-builds-the-image.md) |
| Network | Tailscale, `tailscale serve` | Private HTTPS access | [ADR-0004](../adr/0004-docker-container.md) |

Later steps add `better-sqlite3` for scan data and the Claude Agent SDK to start a scan.
