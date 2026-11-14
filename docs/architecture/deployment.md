# Deployment

Where each part runs, and how a new version gets there.

## Deployment: version one

On which machine does each part run, and what connects the machines?

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"system-ui, sans-serif","fontSize":"14px","lineColor":"#57606a","clusterBkg":"#f6f8fa","clusterBorder":"#d0d7de","edgeLabelBackground":"#ffffff","primaryTextColor":"#1f2328"},"flowchart":{"curve":"linear","nodeSpacing":40,"rankSpacing":50}}}%%
flowchart TB
    subgraph devices["Own devices, device"]
        browser["<b>Browser</b><br/>[Container: web browser]<br/><small>Shows the pages</small>"]:::container
    end

    other(["<b>Any other device</b><br/>[Person]<br/><small>Not on the tailnet</small>"]):::external

    subgraph home["Home server, server"]
        ts["<b>tailscale serve</b><br/>[External: Tailscale]<br/><small>HTTPS on the tailnet</small>"]:::external
        subgraph compose["Docker Compose, runtime"]
            c["<b>Next.js app</b><br/>[Container: Docker image]<br/><small>Port on 127.0.0.1 only</small>"]:::container
        end
        vol[("<b>Vault clone</b><br/>[Volume]<br/><small>Mounted at VAULT_PATH</small>")]:::store
        key[("<b>Deploy key</b><br/>[File]<br/><small>Read-only SSH key</small>")]:::store
    end

    subgraph gh["GitHub, external service"]
        apprepo[("<b>App repo</b><br/>[External: git]<br/><small>Public app code</small>")]:::external
        actions["<b>GitHub Actions</b><br/>[External]<br/><small>Builds the image</small>"]:::external
        ghcr[("<b>Container registry</b><br/>[External: ghcr.io]<br/><small>Public image</small>")]:::external
        vaultrepo[("<b>Vault repo</b><br/>[External: git]<br/><small>Private notes</small>")]:::external
    end

    browser -- "opens pages, HTTPS" --> ts
    other -. "no route" .-x ts
    ts -- "forwards, HTTP" --> c
    vol -. "mounted" .-> c
    key -. "mounted" .-> c
    c -- "git pull, SSH" --> vaultrepo
    apprepo -- "starts a build" --> actions
    actions -- "pushes image" --> ghcr
    c -- "pulls image" --> ghcr

    classDef person fill:#0b3d6b,stroke:#0b3d6b,color:#ffffff,rx:8,ry:8
    classDef system fill:#1f6feb,stroke:#1a5fcc,color:#ffffff,rx:8,ry:8
    classDef container fill:#ddf4ff,stroke:#54aeff,color:#0a3069,rx:8,ry:8
    classDef component fill:#ddf4ff,stroke:#54aeff,color:#0a3069,rx:8,ry:8
    classDef store fill:#ddf4ff,stroke:#54aeff,color:#0a3069
    classDef external fill:#f6f8fa,stroke:#8c959f,color:#424a53,stroke-dasharray:4 3,rx:8,ry:8
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
