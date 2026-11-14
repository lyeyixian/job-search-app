# Job search app

A web app that shows a private markdown vault in a browser: job applications, a market scan,
experience notes and the plan of the search. Version one only reads the vault.

The app is two services in one repo. **Web** is a Next.js app that renders pages. **API** is a
Hono service that owns the vault clone and serves a REST API.

## Read before you change something

| To learn | Read |
|---|---|
| What the app does for the person | `docs/features/`, one file per feature, with numbered acceptance criteria |
| What is proposed and not built yet | `docs/changes/`, one folder per change |
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

## What only the owner approves

The owner approves each change to `docs/adr/` and `docs/features/`. A pull request that changes
one of these folders fails the owner approval check until the owner adds the label
`owner-approved`. Do not add that label. Keep all other docs the same as the code, with no
approval. `docs/changes/README.md` has the steps and the file formats.

- If you find a choice in the build that the owner did not make, stop and ask the owner. Do not
  record your own choice as a decision.
- Name each proposed ADR and each change to a feature file in the description of the pull
  request.

## When you change behaviour

- `docs/features/` is the baseline. It says what the app on `main` does.
- Write the new, changed and removed acceptance criteria as a change in `docs/changes/<name>/`.
  Do not write code until the owner approves the change.
- A behaviour that the person sees is an acceptance criterion. It is not a decision or an
  assumption.
- Each acceptance criterion has one Playwright test with the same name:
  `"application-board 2: finished applications stay out of the way"`. Change the test with the
  criterion.
- In the last commit of the pull request, fold the change into `docs/features/` and move its
  folder to `docs/changes/archive/`.
- A feature is done when the tests for its criteria pass.
- A fix that makes the code do what the baseline already says needs no change folder.

## When you change the design

- Ask the owner before you make a choice that an ADR records. Add the ADR as a new file in
  `docs/adr/` with the status `Proposed`. Use the next number. Follow the sections of the
  existing files: Status, Context, Decision, Consequences.
- Change a status to `Accepted` only after the owner accepts that ADR in words. An approval of a
  feature or of a pull request does not accept an ADR.
- Do not write code that depends on a proposed ADR.
- Do not write an ADR for a detail of the code that is easy to reverse, such as how a reader
  handles one form of a note. Put that detail on the page in `docs/architecture/`.
- Do not rewrite an accepted ADR. Write a new one, and set the old status to "Superseded by".
- Update the page in `docs/architecture/` that shows the part you changed.
- Start each diagram from a template in `docs/architecture/diagram-templates.md`. Keep the theme
  line and the style lines as they are.

## Commits and pull request titles

- Write each commit message and each pull request title as a
  [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0/): `type(scope): subject`.
  A squash merge puts the pull request title on `main`.
- The types are `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci` and `chore`.
- The scope is `web` or `api`. Omit the scope if the change is in both apps or in neither.
- Example: `feat(web): show the application board`.

## Commands

| Command | Result |
|---|---|
| `pnpm install` | Installs both apps |
| `pnpm dev` | Starts the API and Web on the fixture vault |
| `pnpm test` | Runs the unit tests and the API tests |
| `pnpm e2e` | Runs the browser tests |
| `pnpm openapi` | Writes the OpenAPI document and the Web types again |
| `pnpm lint` | Runs Biome and the type check |
| `pnpm format` | Lets Biome fix the format and the import order |
| `pnpm docs:check` | Checks the links between docs and parses each Mermaid diagram |

Run `pnpm lint`, `pnpm test`, `pnpm openapi` and `pnpm e2e` before you open a pull request. Run
`pnpm docs:check` if you changed a doc. The pull request
checks are in `docs/architecture/checks.md`.
