# Components

C4 level 3: the parts inside the Next.js app. The folder names are a proposal until the code
layout is agreed.

```mermaid
flowchart TB
    subgraph ui["UI"]
        pages["Pages<br/>server components, one per feature"]
        comps["Components<br/>board, tables, tabs, filters,<br/>markdown view, PDF view"]
        routes["Route handlers<br/>refresh, resume file, health"]
    end

    subgraph vaultmod["Vault module, no Next.js code"]
        store["Index store<br/>holds the current index,<br/>swaps in a new one"]
        sync["Sync<br/>runs git pull,<br/>records the time"]
        parser["Parser<br/>frontmatter and markdown body"]
        schema["Schema check<br/>the rules of the vault's SCHEMA.md"]
        links["Link resolver<br/>targets, missing targets, backlinks"]
        queries["Queries<br/>board, shortlist, company listings,<br/>one note by slug"]
    end

    clone[("Vault clone")]

    pages --> comps
    pages --> queries
    routes --> store
    routes --> queries
    queries --> store
    store --> sync
    store --> parser
    parser --> schema
    parser --> links
    sync --> clone
    parser --> clone
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

## A page load

```mermaid
sequenceDiagram
    actor User
    participant Page as Page (server component)
    participant Q as Queries
    participant Store as Index store

    User->>Page: open an application
    Page->>Q: application by slug
    Q->>Store: current index
    Store-->>Q: index
    Q-->>Page: note, links, backlinks, warnings
    Page-->>User: HTML with the time of the last update
```

## A Refresh

```mermaid
sequenceDiagram
    actor User
    participant R as Refresh handler
    participant Store as Index store
    participant Sync
    participant Git as git
    participant P as Parser, schema check, link resolver

    User->>R: select Refresh
    R->>Store: rebuild
    Store->>Sync: pull
    Sync->>Git: git pull in VAULT_PATH
    alt pull fails
        Git-->>Sync: error
        Sync-->>Store: error
        Store-->>R: old index kept, error
        R-->>User: page shows the error and the old time
    else pull works
        Git-->>Sync: new commit
        Store->>P: parse every note
        P-->>Store: new index with warnings
        Store->>Store: swap the new index in
        Store-->>R: new time
        R-->>User: page shows the new data and time
    end
```

## What the index holds

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
