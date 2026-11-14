# Components

The parts inside the Next.js app. The split is a proposal until the code layout is agreed.

## Level 3: components of the Next.js app

Which parts make up the Next.js app, and which part may call which?

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"system-ui, sans-serif","fontSize":"14px","lineColor":"#8b949e","clusterBkg":"#161b22","clusterBorder":"#30363d","edgeLabelBackground":"#0d1117","primaryTextColor":"#e6edf3","titleColor":"#e6edf3"},"flowchart":{"curve":"linear","nodeSpacing":40,"rankSpacing":50}}}%%
flowchart TB
    subgraph next["Next.js app"]
        subgraph ui["UI"]
            pages["<b>Pages</b><br/>[Component: React]<br/><small>One per feature</small>"]:::component
            comps["<b>Components</b><br/>[Component: shadcn/ui]<br/><small>Shared UI parts</small>"]:::component
            routes["<b>Route handlers</b><br/>[Component: Next.js]<br/><small>Endpoints that are not pages</small>"]:::component
        end
        subgraph vaultmod["Vault module, no Next.js code"]
            queries["<b>Queries</b><br/>[Component: TypeScript]<br/><small>Data for one page</small>"]:::component
            store["<b>Index store</b><br/>[Component: TypeScript]<br/><small>Owns the one index</small>"]:::component
            sync["<b>Sync</b><br/>[Component: git]<br/><small>Runs git pull</small>"]:::component
            parser["<b>Parser</b><br/>[Component: unified]<br/><small>Reads each note</small>"]:::component
            schema["<b>Schema check</b><br/>[Component: Zod]<br/><small>Checks frontmatter</small>"]:::component
            links["<b>Link resolver</b><br/>[Component: remark]<br/><small>Targets and backlinks</small>"]:::component
        end
    end

    clone[("<b>Vault clone</b><br/>[Container: git clone]<br/><small>The server's copy</small>")]:::store

    pages -- "renders with" --> comps
    pages -- "calls" --> queries
    routes -- "calls" --> queries
    routes -- "rebuilds" --> store
    queries -- "reads" --> store
    store -- "calls" --> sync
    store -- "calls" --> parser
    parser -- "calls" --> schema
    parser -- "calls" --> links
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
| Pages | One server component per feature in the spec. Reads through Queries and renders HTML. |
| Components | The shared UI parts from shadcn/ui, plus the markdown view and the PDF view. |
| Route handlers | The endpoints that are not pages. See [API](api.md). |
| Queries | The only way the UI reads the index. Returns typed data for one page. |
| Index store | Owns the one index. Builds a new one and swaps it in as one step. |
| Sync | Runs `git pull` in `VAULT_PATH` and reports the result. |
| Parser | Reads each file into frontmatter and a parsed body. |
| Schema check | Checks frontmatter against the vault's rules and returns warnings. Never throws. |
| Link resolver | Resolves each link to a note or an achievement, marks missing targets, builds backlinks. |

## Sequence: a page load

What happens when the person opens a page?

```mermaid
sequenceDiagram
    autonumber
    actor User as Job seeker
    participant Page as Pages
    participant Q as Queries
    participant Store as Index store

    User->>Page: opens an application
    Page->>Q: asks for the application by slug
    Q->>Store: asks for the current index
    Store-->>Q: index
    alt no note has that slug
        Q-->>Page: nothing
        Page-->>User: a not-found page
    else the note exists
        Q-->>Page: note, links, backlinks, warnings
        Page-->>User: HTML with the time of the last update
    end
```

## Sequence: a Refresh

What happens when the person selects Refresh?

```mermaid
sequenceDiagram
    autonumber
    actor User as Job seeker
    participant R as Route handlers
    participant Store as Index store
    participant Sync
    participant P as Parser

    User->>R: selects Refresh
    R->>Store: asks for a rebuild
    Store->>Sync: asks for a pull
    Sync->>Sync: runs git pull in VAULT_PATH
    alt the pull fails
        Sync-->>Store: error
        Store-->>R: error, old index kept
        R-->>User: the error and the old time
    else the pull works
        Sync-->>Store: new commit
        Store->>P: asks for a parse of every note
        P-->>Store: new index with warnings
        Store->>Store: swaps the new index in
        Store-->>R: new time
        R-->>User: the new data and time
    end
```

## Data: what the index holds

This is a class diagram, which has no template yet. It shows the shape of the index.

```mermaid
classDiagram
    class VaultIndex {
        pulledAt
        commit
        notes
    }
    class Note {
        slug
        type
        frontmatter
        body
        warnings
    }
    class Link {
        target slug
        achievement
        label
        missing
    }
    VaultIndex "1" --> "many" Note
    Note "1" --> "many" Link : links out
    Note "1" --> "many" Note : backlinks
```
