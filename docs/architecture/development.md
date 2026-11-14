# Local development

How to run the app on your machine. Agreed on 14 Nov 2026. The commands are the plan until the
code exists.

Both services run on your machine with hot reload. Docker is not necessary for development.

## Run the app

1. Install Node and pnpm.
2. Run `pnpm install`.
3. Run `pnpm dev`.
4. Open the address that the command prints.

The app shows the made-up vault in `fixtures/vault/`.

## Use your real vault

1. Make a file `apps/api/.env.local`. Git ignores this file.
2. Add the line `VAULT_PATH=` with the full path of your vault clone.
3. Start `pnpm dev` again.

The app shows your real notes, with the changes that you did not push.

## What VAULT_PATH does

| `VAULT_PATH` | The API reads | Refresh |
|---|---|---|
| Not set | `fixtures/vault/` | Reads the files again. No pull. |
| A folder with no git remote | That folder | Reads the files again. No pull. |
| A git clone with a remote | That clone | Runs `git pull`, then reads the files. |

## Commands

| Command | Result |
|---|---|
| `pnpm dev` | Starts the API and Web with hot reload |
| `pnpm test` | Runs the unit tests and the API tests |
| `pnpm e2e` | Runs the browser tests |
| `pnpm openapi` | Writes `docs/api/openapi.json` and the Web types again |
| `pnpm lint` | Runs ESLint and the type check |
| `docker compose up --build` | Builds and runs the two images as the server runs them |

## Rules

- Do not put real vault content in the repo. The repo is public.
- Use `docker compose up --build` to check the images before a release. Do not use it for daily
  work.
