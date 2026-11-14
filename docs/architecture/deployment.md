# Deployment

Where each part runs, and how a new version gets there.

## Deployment diagram

```mermaid
flowchart TB
    subgraph devices["Own devices, on the tailnet"]
        phone["Phone browser"]
        laptop["Laptop browser"]
    end

    subgraph home["Home server"]
        ts["tailscale serve<br/>HTTPS :443 on the tailnet name"]
        subgraph compose["Docker Compose"]
            c["Container: job-search-app<br/>image from ghcr.io<br/>port on 127.0.0.1 only"]
        end
        vol[("Volume: vault clone<br/>mounted at VAULT_PATH")]
        key["File: deploy key<br/>mounted read-only"]
    end

    subgraph gh["GitHub"]
        apprepo["App repo, public"]
        actions["GitHub Actions"]
        ghcr[("Container registry, public image")]
        vaultrepo[("Vault repo, private")]
    end

    other["Any other device"]

    phone -- "HTTPS over the tailnet" --> ts
    laptop -- "HTTPS over the tailnet" --> ts
    other -. "no route" .-x ts
    ts -- "HTTP 127.0.0.1" --> c
    c --- vol
    c --- key
    c -- "git pull over SSH" --> vaultrepo
    apprepo -- "merge to main" --> actions
    actions -- "build and push" --> ghcr
    ghcr -- "docker compose pull" --> c
```

| Node | Runs | Holds |
|---|---|---|
| Home server | Docker, Tailscale | The container, the vault clone, the deploy key |
| Container | Node, the built app, git | No data of its own. It can be replaced at any time. |
| Volume | | The vault clone. It outlives the container. |
| GitHub | Actions, the registry | The app code, the public image, the private vault |

## A release

```mermaid
sequenceDiagram
    actor Dev as Person
    participant Repo as App repo
    participant CI as GitHub Actions
    participant Reg as Container registry
    participant Srv as Home server

    Dev->>Repo: merge a pull request to main
    Repo->>CI: start the build workflow
    CI->>CI: build the image
    CI->>Reg: push the image
    Dev->>Srv: docker compose pull && docker compose up -d
    Srv->>Reg: pull the new image
    Srv->>Srv: replace the container
    Note over Srv: on start, the app pulls the vault and builds the index
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
