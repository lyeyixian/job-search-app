# job-search-app

Web app for my job search. It shows a private markdown vault in a browser.

- What it does: [`docs/features/`](docs/features/README.md)
- How it is built: [`docs/architecture/`](docs/architecture/README.md)
- Why each choice was made: [`docs/adr/`](docs/adr/README.md)
- Rules for people and agents who change the code: [`AGENTS.md`](AGENTS.md)

## Run it

1. Install Node 24 and pnpm 10.
2. Run `pnpm install`.
3. Run `pnpm dev`.
4. Open `http://localhost:3000`.

The app shows the made-up vault in [`fixtures/vault/`](fixtures/vault/README.md). To use a real
vault, and for the other commands, see
[Local development](docs/architecture/development.md).
