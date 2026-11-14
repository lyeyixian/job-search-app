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
| [Diagram templates](diagram-templates.md) | The fixed template for each diagram type |

The diagrams follow the C4 model. Each one starts from a template in
[Diagram templates](diagram-templates.md), so a shape, a colour or an arrow means the same thing
on every page.

## Level 1: system context

Who uses the app, and which outside systems does it depend on?

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"system-ui, sans-serif","fontSize":"14px","lineColor":"#57606a","clusterBkg":"#f6f8fa","clusterBorder":"#d0d7de","edgeLabelBackground":"#ffffff","primaryTextColor":"#1f2328"},"flowchart":{"curve":"linear","nodeSpacing":40,"rankSpacing":50}}}%%
flowchart TB
    user(["<b>Job seeker</b><br/>[Person]<br/><small>Reads the vault</small>"]):::person
    app["<b>Job search app</b><br/>[Software system]<br/><small>Shows the vault</small>"]:::system
    tailnet["<b>Tailscale</b><br/>[External]<br/><small>Private network</small>"]:::external
    vault[("<b>Vault repo</b><br/>[External: GitHub]<br/><small>Private notes and PDFs</small>")]:::external
    writers(["<b>Skills and the person</b><br/>[Person]<br/><small>Write the notes</small>"]):::external

    user -- "opens pages, HTTPS" --> tailnet
    tailnet -- "forwards, HTTPS" --> app
    app -- "git pull, SSH" --> vault
    writers -- "git push" --> vault

    classDef person fill:#0b3d6b,stroke:#0b3d6b,color:#ffffff,rx:8,ry:8
    classDef system fill:#1f6feb,stroke:#1a5fcc,color:#ffffff,rx:8,ry:8
    classDef container fill:#ddf4ff,stroke:#54aeff,color:#0a3069,rx:8,ry:8
    classDef component fill:#ddf4ff,stroke:#54aeff,color:#0a3069,rx:8,ry:8
    classDef store fill:#ddf4ff,stroke:#54aeff,color:#0a3069
    classDef external fill:#f6f8fa,stroke:#8c959f,color:#424a53,stroke-dasharray:4 3,rx:8,ry:8
```

## Level 2: containers

Which parts that run or hold data make up the app, and how do they talk?

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"system-ui, sans-serif","fontSize":"14px","lineColor":"#57606a","clusterBkg":"#f6f8fa","clusterBorder":"#d0d7de","edgeLabelBackground":"#ffffff","primaryTextColor":"#1f2328"},"flowchart":{"curve":"linear","nodeSpacing":40,"rankSpacing":50}}}%%
flowchart TB
    user(["<b>Job seeker</b><br/>[Person]<br/><small>Uses own devices</small>"]):::person
    serve["<b>tailscale serve</b><br/>[External: Tailscale]<br/><small>HTTPS on the tailnet</small>"]:::external

    subgraph system["Job search app"]
        next["<b>Next.js app</b><br/>[Container: Next.js]<br/><small>Renders pages</small>"]:::container
        index[("<b>Vault index</b><br/>[Container: Node memory]<br/><small>All parsed notes</small>")]:::store
        clone[("<b>Vault clone</b><br/>[Container: git clone]<br/><small>The server's copy</small>")]:::store
    end

    github[("<b>Vault repo</b><br/>[External: GitHub]<br/><small>Private notes and PDFs</small>")]:::external

    user -- "opens pages, HTTPS" --> serve
    serve -- "forwards, HTTP" --> next
    next -- "reads notes" --> index
    clone -. "is parsed into" .-> index
    next -- "runs git pull" --> clone
    clone -- "git pull, SSH" --> github

    classDef person fill:#0b3d6b,stroke:#0b3d6b,color:#ffffff,rx:8,ry:8
    classDef system fill:#1f6feb,stroke:#1a5fcc,color:#ffffff,rx:8,ry:8
    classDef container fill:#ddf4ff,stroke:#54aeff,color:#0a3069,rx:8,ry:8
    classDef component fill:#ddf4ff,stroke:#54aeff,color:#0a3069,rx:8,ry:8
    classDef store fill:#ddf4ff,stroke:#54aeff,color:#0a3069
    classDef external fill:#f6f8fa,stroke:#8c959f,color:#424a53,stroke-dasharray:4 3,rx:8,ry:8
```

| Container | Technology | Job |
|---|---|---|
| Next.js app | Next.js, TypeScript, Node | Renders each page on the server and serves the endpoints in [API](api.md) |
| Vault index | A TypeScript object in memory | Holds every parsed note, its links, its backlinks and its warnings |
| Vault clone | A git working copy on a volume | The server's copy of the vault, pulled with the deploy key |
| tailscale serve | Tailscale on the host | Gives the app HTTPS and keeps it private to the tailnet |

## What stays out of this repo

The repo is public. It holds no vault content, no personal data and no keys. Tests use made-up
notes that follow the vault's schema.

## Later steps

Each step gets its own design and its own decision records before work starts.

1. The read-only app. This folder.
2. Run a scan from the app. Scan data moves to SQLite.
3. Find companies outside the watchlist.
4. Edit from the app. The posting, the fit analysis and the status move to the database.
