# Components

The parts inside the Next.js app. The split is a proposal until the code layout is agreed.

## Level 3: components of the Next.js app

Which parts make up the Next.js app, and which part may call which?

```mermaid
flowchart TB
    subgraph next["Next.js app"]
        subgraph ui["UI"]
            pages["Pages<br/>[Component: server components]<br/>One per feature"]:::component
            comps["Components<br/>[Component: shadcn/ui]<br/>Board, tables, tabs, filters,<br/>markdown view, PDF view"]:::component
            routes["Route handlers<br/>[Component: Next.js]<br/>Refresh, resume file, health"]:::component
        end
        subgraph vaultmod["Vault module, no Next.js code"]
            queries["Queries<br/>[Component: TypeScript]<br/>Typed data for one page"]:::component
            store["Index store<br/>[Component: TypeScript]<br/>Holds the index, swaps in a new one"]:::component
            sync["Sync<br/>[Component: git]<br/>Runs git pull, records the time"]:::component
            parser["Parser<br/>[Component: gray-matter, unified]<br/>Frontmatter and markdown body"]:::component
            schema["Schema check<br/>[Component: Zod]<br/>The rules of the vault's SCHEMA.md"]:::component
            links["Link resolver<br/>[Component: remark]<br/>Targets, missing targets, backlinks"]:::component
        end
    end

    clone[("Vault clone<br/>[Container: git working copy]<br/>The server's copy of the vault")]:::store

    pages -- "renders with" --> comps
    pages -- "calls" --> queries
    routes -- "calls" --> queries
    routes -- "asks for a rebuild" --> store
    queries -- "reads" --> store
    store -- "calls" --> sync
    store -- "calls" --> parser
    parser -- "calls" --> schema
    parser -- "calls" --> links
    sync -- "runs git pull" --> clone
    parser -- "reads files" --> clone

    classDef person fill:#08427b,stroke:#052e56,color:#ffffff
    classDef system fill:#1168bd,stroke:#0b4884,color:#ffffff
    classDef container fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef component fill:#85bbf0,stroke:#5d82a8,color:#000000
    classDef store fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef external fill:#999999,stroke:#6b6b6b,color:#ffffff
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
