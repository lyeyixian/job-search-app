# Architecture

How the job search app is built. This folder covers version one, the app that only reads the
vault. The feature spec is in [`../features/`](../features/README.md) and the reasons for each
choice are in [`../adr/`](../adr/README.md).

| Page | What it shows |
|---|---|
| This page | C4 level 1 and 2: the system and its containers |
| [Components](components.md) | C4 level 3, and what happens on a page load and a Refresh |
| [Deployment](deployment.md) | Where each part runs, and how a release reaches the server |
| [API](api.md) | The backend endpoints |
| [Stack](stack.md) | The frameworks and libraries, each with its job |

The diagrams follow the C4 model. They are Mermaid flowcharts, because GitHub draws those more
clearly than Mermaid's own C4 diagram type.

## Level 1: system context

One person uses the app. The app depends on two outside systems.

```mermaid
flowchart TB
    user(["Job seeker<br/>reads applications, listings,<br/>experience and the plan"])
    app["Job search app<br/>shows the vault in a browser"]
    vault[("Vault repo on GitHub<br/>private, markdown notes<br/>and resume PDFs")]
    tailnet{{"Tailscale<br/>private network<br/>between own devices"}}

    user -- "opens pages, selects Refresh" --> tailnet
    tailnet -- "HTTPS" --> app
    app -- "git pull, read only" --> vault
    writer(["Claude Code skills and the person<br/>write notes outside the app"]) -- "git push" --> vault
```

## Level 2: containers

```mermaid
flowchart TB
    browser["Browser<br/>phone or laptop on the tailnet"]

    subgraph server["Home server"]
        serve["tailscale serve<br/>HTTPS on the tailnet name"]
        subgraph docker["Docker container"]
            next["Next.js app<br/>TypeScript, one Node process<br/>renders pages, serves endpoints"]
            index["Vault index<br/>in the memory of the Node process"]
            git["git<br/>command-line client"]
        end
        clone[("Vault clone<br/>Docker volume at VAULT_PATH")]
        key["Deploy key<br/>read-only mount"]
    end

    github[("Vault repo on GitHub")]

    browser -- "HTTPS" --> serve
    serve -- "HTTP on 127.0.0.1" --> next
    next -- "reads notes" --> index
    next -- "builds at start and on Refresh" --> index
    index -. "parsed from" .-> clone
    next -- "runs git pull" --> git
    git -- "SSH" --> github
    git --> clone
    key -.-> git
```

| Container | Technology | Job |
|---|---|---|
| Next.js app | Next.js, TypeScript, Node | Renders each page on the server and serves the endpoints in [API](api.md) |
| Vault index | A TypeScript object in memory | Holds every parsed note, its links, its backlinks and its warnings |
| Vault clone | A git working copy on a volume | The server's copy of the vault |
| git | Command-line client in the image | Pulls the vault with the deploy key |
| tailscale serve | Tailscale on the host | Gives the app HTTPS and keeps it private to the tailnet |

## What stays out of this repo

The repo is public. It holds no vault content, no personal data and no keys. Tests use made-up
notes that follow the vault's schema.

## Later steps

Each step gets its own design and its own decision records before work starts.

```mermaid
flowchart LR
    v1["1. Read-only app<br/>this folder"] --> v2["2. Run a scan from the app<br/>scan data moves to SQLite"]
    v2 --> v3["3. Find companies outside<br/>the watchlist"]
    v3 --> v4["4. Edit from the app<br/>posting, fit analysis and status<br/>move to the database"]
```
