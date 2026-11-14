# Deployment

Where each part runs, and how a new version gets there.

## Deployment: version one

On which machine does each part run, and what connects the machines?

```mermaid
flowchart TB
    subgraph devices["Own devices<br/>[Device: on the tailnet]"]
        browser["Browser<br/>[Container: phone or laptop]<br/>Shows the pages"]:::container
    end

    other(["Any other device<br/>[Person]<br/>Not on the tailnet"]):::external

    subgraph home["Home server<br/>[Server]"]
        ts["tailscale serve<br/>[External system: Tailscale]<br/>HTTPS :443 on the tailnet name"]:::external
        subgraph compose["Docker Compose<br/>[Runtime]"]
            c["Next.js app<br/>[Container: image from ghcr.io]<br/>Port on 127.0.0.1 only"]:::container
        end
        vol[("Vault clone<br/>[Volume]<br/>Mounted at VAULT_PATH")]:::store
        key[("Deploy key<br/>[File]<br/>Read-only SSH key")]:::store
    end

    subgraph gh["GitHub<br/>[External service]"]
        apprepo[("App repo<br/>[External system: git]<br/>Public app code")]:::external
        actions["GitHub Actions<br/>[External system]<br/>Builds the image"]:::external
        ghcr[("Container registry<br/>[External system: ghcr.io]<br/>Public image")]:::external
        vaultrepo[("Vault repo<br/>[External system: git]<br/>Private notes")]:::external
    end

    browser -- "opens pages, HTTPS over the tailnet" --> ts
    other -. "no route" .-x ts
    ts -- "forwards requests, HTTP on 127.0.0.1" --> c
    vol -. "mounted at VAULT_PATH" .-> c
    key -. "mounted read-only" .-> c
    c -- "pulls the notes, git over SSH" --> vaultrepo
    apprepo -- "starts a build on merge to main" --> actions
    actions -- "pushes the image, HTTPS" --> ghcr
    c -- "pulls the image, HTTPS" --> ghcr

    classDef person fill:#08427b,stroke:#052e56,color:#ffffff
    classDef system fill:#1168bd,stroke:#0b4884,color:#ffffff
    classDef container fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef component fill:#85bbf0,stroke:#5d82a8,color:#000000
    classDef store fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef external fill:#999999,stroke:#6b6b6b,color:#ffffff
```

| Node | Runs | Holds |
|---|---|---|
| Home server | Docker, Tailscale | The container, the vault clone, the deploy key |
| Container | Node, the built app, git | No data of its own. It can be replaced at any time. |
| Volume | | The vault clone. It outlives the container. |
| GitHub | Actions, the registry | The app code, the public image, the private vault |

## Sequence: a release

What happens when a pull request merges to `main`?

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Job seeker
    participant Repo as App repo
    participant CI as GitHub Actions
    participant Reg as Container registry
    participant Srv as Home server

    Dev->>Repo: merges a pull request to main
    Repo->>CI: starts the build workflow
    alt the build fails
        CI-->>Dev: a failed check, the server keeps the old version
    else the build works
        CI->>Reg: pushes the image
        Dev->>Srv: runs docker compose pull and up -d
        Srv->>Reg: pulls the new image
        Srv->>Srv: replaces the container
        Srv->>Srv: pulls the vault and builds the index
    end
```

## Settings

| Setting | Where it is set | Purpose |
|---|---|---|
| `VAULT_PATH` | Compose file on the server | The folder of the vault clone inside the container |
| Deploy key path | Compose file on the server | The key that `git pull` uses |

No setting holds a secret value. The key is a file on the server and is never in the repo or the
image.

## One-time setup on the server

1. Create an SSH key on the server.
2. Add the public key to the vault repo as a deploy key. Do not give it write access.
3. Clone the vault into the volume.
4. Write the Compose file with the volume, the key mount and the port on `127.0.0.1`.
5. Run `tailscale serve` to forward the tailnet HTTPS address to that port.
6. Run `docker compose up -d`.
