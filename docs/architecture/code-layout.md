# Code layout

Where each part of the code lives, and which folder may import which. See
[ADR-0010](../adr/0010-monorepo-with-openapi-contract.md).

```text
.
├── apps/
│   ├── web/                 Next.js app
│   │   └── src/
│   │       ├── app/         pages, one folder per route
│   │       ├── components/  shadcn/ui parts, markdown view, PDF view
│   │       └── api/         generated types and the typed client
│   └── api/                 Hono service
│       └── src/
│           ├── http/        routes, Zod schemas, OpenAPI
│           └── vault/       index store, sync, parser, schema check, link resolver, queries
├── fixtures/
│   └── vault/               made-up notes for tests and local runs
├── docs/
│   ├── adr/                 one file per decision
│   ├── api/openapi.json     generated, never edited by hand
│   ├── architecture/        this folder
│   └── features/            the feature spec
└── compose.yaml             both services, for the server and for local runs
```

## Level 3: which folder may import which

Which folder may use which?

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"system-ui, sans-serif","fontSize":"14px","lineColor":"#8b949e","clusterBkg":"#161b22","clusterBorder":"#30363d","edgeLabelBackground":"#0d1117","primaryTextColor":"#e6edf3","titleColor":"#e6edf3"},"flowchart":{"curve":"linear","nodeSpacing":40,"rankSpacing":50}}}%%
flowchart TB
    subgraph web["apps/web"]
        app["<b>app</b><br/>[Component: React]<br/><small>Pages</small>"]:::component
        comps["<b>components</b><br/>[Component: shadcn/ui]<br/><small>Shared UI parts</small>"]:::component
        client["<b>api</b><br/>[Component: Orval output]<br/><small>Generated types and client</small>"]:::component
    end

    doc[("<b>openapi.json</b><br/>[File: OpenAPI]<br/><small>The contract</small>")]:::store

    subgraph api["apps/api"]
        http["<b>http</b><br/>[Component: Hono]<br/><small>Routes and schemas</small>"]:::component
        vault["<b>vault</b><br/>[Component: TypeScript]<br/><small>Index and queries</small>"]:::component
    end

    app -- "imports" --> comps
    app -- "imports" --> client
    doc -. "types generated from" .-> client
    http -. "generates" .-> doc
    http -- "imports" --> vault

    classDef person fill:#1f6feb,stroke:#58a6ff,color:#ffffff,rx:8,ry:8
    classDef system fill:#1f6feb,stroke:#58a6ff,color:#ffffff,rx:8,ry:8
    classDef container fill:#0c2d6b,stroke:#388bfd,color:#e6edf3,rx:8,ry:8
    classDef component fill:#0c2d6b,stroke:#388bfd,color:#e6edf3,rx:8,ry:8
    classDef store fill:#0c2d6b,stroke:#388bfd,color:#e6edf3
    classDef external fill:#21262d,stroke:#8b949e,color:#c9d1d9,stroke-dasharray:4 3,rx:8,ry:8
```

## Import rules

- `apps/web` and `apps/api` never import from each other.
- `vault` never imports from `http`. It has no HTTP code and can be tested alone.
- Only `apps/web/src/api` talks to the API. Pages and components go through it.
- Nobody edits `docs/api/openapi.json` or the generated types by hand.
