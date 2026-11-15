# Components

The parts inside each of the two services.

## Level 3: components of the API

Which parts make up the API, and which part may call which?

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"system-ui, sans-serif","fontSize":"14px","lineColor":"#8b949e","clusterBkg":"#161b22","clusterBorder":"#30363d","edgeLabelBackground":"#0d1117","primaryTextColor":"#e6edf3","titleColor":"#e6edf3"},"flowchart":{"curve":"linear","nodeSpacing":40,"rankSpacing":50}}}%%
flowchart TB
    web["<b>Web</b><br/>[Container: Next.js]<br/><small>Renders pages</small>"]:::container

    subgraph api["API"]
        subgraph http["HTTP layer"]
            routes["<b>Routes</b><br/>[Component: Hono]<br/><small>One file per resource</small>"]:::component
            schemas["<b>Schemas</b><br/>[Component: Zod]<br/><small>Requests and responses</small>"]:::component
            openapi["<b>OpenAPI</b><br/>[Component: zod-openapi]<br/><small>Builds the API document</small>"]:::component
        end
        subgraph vaultmod["Vault module, no HTTP code"]
            queries["<b>Queries</b><br/>[Component: TypeScript]<br/><small>Data for one endpoint</small>"]:::component
            store["<b>Index store</b><br/>[Component: TypeScript]<br/><small>Owns the one index</small>"]:::component
            sync["<b>Sync</b><br/>[Component: git]<br/><small>Runs git pull</small>"]:::component
            parser["<b>Parser</b><br/>[Component: unified]<br/><small>Reads each note</small>"]:::component
            schema["<b>Schema check</b><br/>[Component: Zod]<br/><small>Checks frontmatter</small>"]:::component
            links["<b>Link resolver</b><br/>[Component: TypeScript]<br/><small>Targets and backlinks</small>"]:::component
        end
    end

    clone[("<b>Vault clone</b><br/>[Container: git clone]<br/><small>The server's copy</small>")]:::store

    web -- "calls, JSON over HTTP" --> routes
    routes -- "validates with" --> schemas
    openapi -- "reads" --> schemas
    routes -- "calls" --> queries
    routes -- "rebuilds" --> store
    queries -- "reads" --> store
    store -- "calls" --> sync
    store -- "calls" --> parser
    parser -- "calls" --> schema
    routes -- "calls" --> links
    links -- "calls" --> queries
    links -- "reads" --> store
    sync -- "runs git pull" --> clone
    parser -- "reads files" --> clone

    classDef person fill:#1f6feb,stroke:#58a6ff,color:#ffffff,rx:8,ry:8
    classDef system fill:#1f6feb,stroke:#58a6ff,color:#ffffff,rx:8,ry:8
    classDef container fill:#0c2d6b,stroke:#388bfd,color:#e6edf3,rx:8,ry:8
    classDef component fill:#0c2d6b,stroke:#388bfd,color:#e6edf3,rx:8,ry:8
    classDef store fill:#0c2d6b,stroke:#388bfd,color:#e6edf3
    classDef external fill:#21262d,stroke:#8b949e,color:#c9d1d9,stroke-dasharray:4 3,rx:8,ry:8
```

| Component | Job |
|---|---|
| Routes | The HTTP endpoints, one file per resource. Holds no vault logic. |
| Schemas | A Zod schema for each request and response. The one source for validation, types and docs. |
| OpenAPI | Builds the OpenAPI document from the routes and the schemas. Serves it with a docs page. |
| Queries | The only way the HTTP layer reads the index. Returns the data for one endpoint. |
| Index store | Owns the one index. Builds a new one and swaps it in as one step. |
| Sync | Runs `git pull` in `VAULT_PATH` and reports the result. |
| Parser | Reads each file into frontmatter and a parsed body, and finds the `[[wikilinks]]` of the body. |
| Schema check | Checks frontmatter against the vault's rules and returns warnings. Never throws. |
| Link resolver | Resolves each link to a note or an achievement, marks missing targets, builds backlinks. |

## How a link resolves

The link resolver is `apps/api/src/vault/links.ts`. A route adds its result to the response of a
page: `links` is the link table of the markdown in the response, and `backlinks` is the list of
the notes that name the note.

The markdown in a response keeps each `[[wikilink]]` as the note writes it. The Markdown view of
Web finds the link in the table by its `ref`, which is the text of the link without the brackets
and the label. A link has one of three states:

| State | Case | What Web shows |
|---|---|---|
| `found` | The target has a page | A link with the label of the writer, or the title of the achievement or the note |
| `missing` | The vault has no such note, or the role note or project note has no such achievement | Text with a mark |
| `no-page` | The note exists, and the app has no page for it: a journal file, the direction, the targets | Text |

The resolver finds the target of a name in this order:

1. A listing with that name in the company of the note that has the link, or in the company that
   the link writes as `company/listing`.
2. A role note, a project note, a story or an application with that name. The name of an
   application is the name of its folder.
3. A listing with that name, if only one company has it.
4. Each other note with that file name.

An anchor names an achievement of a role note or a project note. The link can write the anchor
or the heading. On each other kind of note, the resolver ignores the anchor.

A note names a second note in four ways, and each one makes a backlink:

- a `[[wikilink]]` in its text
- a slug in its facts: `roles` of a story, `programme` of a role note, `source-listing` of an
  application
- a reference to an achievement in the evidence of its fit analysis
- the application column of a company index, which counts as the listing naming the application

Only a note with a page can be in the list of backlinks. The resolver builds the backlinks of the
whole vault on the first request after a load and keeps them with the index.

## Level 3: components of Web

Which parts make up Web, and which part may call which?

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"system-ui, sans-serif","fontSize":"14px","lineColor":"#8b949e","clusterBkg":"#161b22","clusterBorder":"#30363d","edgeLabelBackground":"#0d1117","primaryTextColor":"#e6edf3","titleColor":"#e6edf3"},"flowchart":{"curve":"linear","nodeSpacing":40,"rankSpacing":50}}}%%
flowchart TB
    user(["<b>Job seeker</b><br/>[Person]<br/><small>Uses own devices</small>"]):::person

    subgraph web["Web"]
        pages["<b>Pages</b><br/>[Component: React]<br/><small>One per feature</small>"]:::component
        comps["<b>Components</b><br/>[Component: shadcn/ui]<br/><small>Shared UI parts</small>"]:::component
        md["<b>Markdown view</b><br/>[Component: remark]<br/><small>Note body to HTML</small>"]:::component
        client["<b>API client</b><br/>[Component: TypeScript]<br/><small>Typed calls to the API</small>"]:::component
        proxy["<b>API proxy</b><br/>[Component: Next.js]<br/><small>Forwards /api to the API</small>"]:::component
    end

    api["<b>API</b><br/>[Container: Hono on Node]<br/><small>REST API over the vault</small>"]:::container

    user -- "opens a page" --> pages
    user -- "calls /api" --> proxy
    pages -- "renders with" --> comps
    pages -- "renders with" --> md
    pages -- "calls" --> client
    client -- "calls, JSON over HTTP" --> api
    proxy -- "forwards, HTTP" --> api

    classDef person fill:#1f6feb,stroke:#58a6ff,color:#ffffff,rx:8,ry:8
    classDef system fill:#1f6feb,stroke:#58a6ff,color:#ffffff,rx:8,ry:8
    classDef container fill:#0c2d6b,stroke:#388bfd,color:#e6edf3,rx:8,ry:8
    classDef component fill:#0c2d6b,stroke:#388bfd,color:#e6edf3,rx:8,ry:8
    classDef store fill:#0c2d6b,stroke:#388bfd,color:#e6edf3
    classDef external fill:#21262d,stroke:#8b949e,color:#c9d1d9,stroke-dasharray:4 3,rx:8,ry:8
```

| Component | Job |
|---|---|
| Pages | One server component per feature in the spec. Gets data through the API client. |
| Components | The shared UI parts from shadcn/ui: menu, board, tables, tabs, filters, PDF view. |
| Markdown view | Turns a note body into HTML. Uses the link table from the API to make each link. |
| API client | Typed functions for each endpoint. Its types are generated from the OpenAPI document. |
| API proxy | Forwards a browser request for `/api/*` to the API, for Refresh, the resume PDF and the docs page. |

## Sequence: a page load

What happens when the person opens a page?

```mermaid
sequenceDiagram
    autonumber
    actor User as Job seeker
    participant Page as Pages
    participant Client as API client
    participant Routes
    participant Q as Queries

    User->>Page: opens an application
    Page->>Client: asks for the application by slug
    Client->>Routes: GET the application
    Routes->>Q: asks for the application
    alt no note has that slug
        Q-->>Routes: nothing
        Routes-->>Client: 404
        Page-->>User: a not-found page
    else the note exists
        Q-->>Routes: note, links, backlinks, warnings
        Routes-->>Client: 200 with JSON
        Client-->>Page: typed data
        Page-->>User: HTML with the time of the last update
    end
```

## Sequence: a Refresh

What happens when the person selects Refresh?

```mermaid
sequenceDiagram
    autonumber
    actor User as Job seeker
    participant Web
    participant R as Routes
    participant Store as Index store
    participant Sync
    participant P as Parser

    User->>Web: selects Refresh
    Web->>R: POST refresh
    R->>Store: asks for a rebuild
    Store->>Sync: asks for a pull
    Sync->>Sync: runs git pull in VAULT_PATH
    alt the pull fails
        Sync-->>Store: error
        Store-->>R: error, old index kept
        R-->>Web: an error response with the old time
        Web-->>User: the error and the old time
    else the pull works
        Sync-->>Store: new commit
        Store->>P: asks for a parse of every note
        P-->>Store: new index with warnings
        Store->>Store: swaps the new index in
        Store-->>R: new time
        R-->>Web: 200 with the new time
        Web-->>User: the new data and time
    end
```

## Data: what the index holds

| Thing | Fields |
|---|---|
| Vault index | The time of the pull, the commit, every note, and the path of every file |
| Note | Path, slug, type, frontmatter, body, links out |
| Link | The name of the target and the anchor, as the note writes them |
| Backlinks | For each note, the notes that name it. Built on the first request after a load |
