# API

**Status: proposed.** The shape of the backend is an open question. This page shows the design that
follows from [ADR-0001](../adr/0001-nextjs-with-typescript.md): pages read the vault index on the
server, so page data needs no endpoint. The alternative is a REST API for all data, which the
pages call.

## Level 3: how the browser reaches the backend

Which parts of the Next.js app answer the browser?

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"system-ui, sans-serif","fontSize":"14px","lineColor":"#8b949e","clusterBkg":"#161b22","clusterBorder":"#30363d","edgeLabelBackground":"#0d1117","primaryTextColor":"#e6edf3","titleColor":"#e6edf3"},"flowchart":{"curve":"linear","nodeSpacing":40,"rankSpacing":50}}}%%
flowchart TB
    browser(["<b>Job seeker</b><br/>[Person]<br/><small>Uses a browser</small>"]):::person

    subgraph next["Next.js app"]
        pages["<b>Pages</b><br/>[Component: React]<br/><small>Return HTML</small>"]:::component
        handlers["<b>Route handlers</b><br/>[Component: Next.js]<br/><small>Return JSON or a file</small>"]:::component
        queries["<b>Queries</b><br/>[Component: TypeScript]<br/><small>Read the vault index</small>"]:::component
    end

    browser -- "GET a page" --> pages
    browser -- "POST refresh" --> handlers
    browser -- "GET resume" --> handlers
    pages -- "calls" --> queries
    handlers -- "calls" --> queries

    classDef person fill:#1f6feb,stroke:#58a6ff,color:#ffffff,rx:8,ry:8
    classDef system fill:#1f6feb,stroke:#58a6ff,color:#ffffff,rx:8,ry:8
    classDef container fill:#0c2d6b,stroke:#388bfd,color:#e6edf3,rx:8,ry:8
    classDef component fill:#0c2d6b,stroke:#388bfd,color:#e6edf3,rx:8,ry:8
    classDef store fill:#0c2d6b,stroke:#388bfd,color:#e6edf3
    classDef external fill:#21262d,stroke:#8b949e,color:#c9d1d9,stroke-dasharray:4 3,rx:8,ry:8
```

## Endpoints

| Method | Path | Purpose | Returns |
|---|---|---|---|
| `POST` | `/api/refresh` | Pull the vault and rebuild the index | `200` with the new time and commit, or `502` with the git error and the old time |
| `GET` | `/api/applications/{slug}/resume.pdf` | The committed resume PDF | `200` with the file, or `404` if the application has no resume |
| `GET` | `/api/health` | Tell Docker that the app is up and has an index | `200` with the time of the last update, or `503` before the first index exists |

### `POST /api/refresh`

Request: no body.

```json
{
  "pulledAt": "2026-11-14T07:05:16Z",
  "commit": "a2c0427",
  "notes": 1204,
  "warnings": 3
}
```

On a failed pull:

```json
{
  "error": "git pull failed",
  "detail": "Could not resolve host: github.com",
  "pulledAt": "2026-11-14T06:40:02Z"
}
```

### `GET /api/health`

```json
{ "status": "ok", "pulledAt": "2026-11-14T07:05:16Z" }
```

## Pages

The page URLs are also proposed. Each returns HTML.

| Path | Feature |
|---|---|
| `/` | Application board |
| `/applications/{slug}` | Application page |
| `/shortlist` | Shortlist |
| `/companies/{company}` | Company listings |
| `/companies/{company}/listings/{slug}` | One listing |
| `/experience` | Experience |
| `/experience/{kind}/{slug}` | A role note, project note or story |
| `/search` | Direction and targets |
