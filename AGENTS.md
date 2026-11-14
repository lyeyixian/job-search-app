# Job search app

A web app that shows a private markdown vault in a browser: job applications, a market scan,
experience notes and the plan of the search. Version one only reads the vault.

The app is two services in one repo. **Web** is a Next.js app that renders pages. **API** is a
Hono service that owns the vault clone and serves a REST API.

## Read before you change something

| To learn | Read |
|---|---|
| What the app does for the person | `docs/features/`, one file per feature, with numbered acceptance criteria |
| How the app is built | `docs/architecture/README.md`, then the page for your area |
| Why a choice was made | `docs/adr/`, one file per decision |
| The shape of the API | `docs/api/openapi.json`, generated from the code |
| The terms: application, verdict, listing, triage | The glossary of the vault. Ask the owner if you cannot read it. |

## Rules

- This repo is public. Do not commit vault content, personal data, keys or tokens. Tests and
  examples use the made-up notes in `fixtures/vault/`.
- `apps/web` and `apps/api` do not import from each other. Web learns the API from
  `docs/api/openapi.json`.
- In the API, `src/vault/` does not import from `src/http/`.
- Do not edit `docs/api/openapi.json` or the generated Web types by hand. Run `pnpm openapi`.
- Web decides what to show from the `code` of an API error, not from its text.
- Logs do not hold note content.

## When you change behaviour

- Change the feature file in `docs/features/` in the same pull request.
- Each acceptance criterion has one Playwright test with the same name:
  `"application-board 2: finished applications stay out of the way"`. Change the test with the
  criterion.
- A feature is done when the tests for its criteria pass.

## When you change the design

- Add a new file in `docs/adr/` for a new decision. Use the next number. Follow the sections of
  the existing files: Status, Context, Decision, Consequences.
- Do not rewrite an accepted ADR. Write a new one, and set the old status to "Superseded by".
- Update the page in `docs/architecture/` that shows the part you changed.
- Start each diagram from a template in `docs/architecture/diagram-templates.md`. Keep the theme
  line and the style lines as they are.

## Commands

The code does not exist yet. These are the planned commands.

| Command | Result |
|---|---|
| `pnpm install` | Installs both apps |
| `pnpm dev` | Starts the API and Web on the fixture vault |
| `pnpm test` | Runs the unit tests and the API tests |
| `pnpm e2e` | Runs the browser tests |
| `pnpm openapi` | Writes the OpenAPI document and the Web types again |
| `pnpm lint` | Runs Biome and the type check |

Run `pnpm lint`, `pnpm test` and `pnpm openapi` before you open a pull request. The pull request
checks are in `docs/architecture/checks.md`.
