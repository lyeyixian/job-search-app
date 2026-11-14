# Deployment

Where each part runs, and how a new version gets there.

## Deployment: version one

On which machine does each part run, and what connects the machines?

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"system-ui, sans-serif","fontSize":"14px","lineColor":"#8b949e","clusterBkg":"#161b22","clusterBorder":"#30363d","edgeLabelBackground":"#0d1117","primaryTextColor":"#e6edf3","titleColor":"#e6edf3"},"flowchart":{"curve":"linear","nodeSpacing":40,"rankSpacing":50}}}%%
flowchart TB
    subgraph devices["Own devices, device"]
        browser["<b>Browser</b><br/>[Container: web browser]<br/><small>Shows the pages</small>"]:::container
    end

    other(["<b>Any other device</b><br/>[Person]<br/><small>Not on the tailnet</small>"]):::external

    subgraph home["Home server, server"]
        ts["<b>tailscale serve</b><br/>[External: Tailscale]<br/><small>HTTPS on the tailnet</small>"]:::external
        subgraph compose["Docker Compose, runtime"]
            web["<b>Web</b><br/>[Container: Docker image]<br/><small>Port on 127.0.0.1 only</small>"]:::container
            api["<b>API</b><br/>[Container: Docker image]<br/><small>No port on the host</small>"]:::container
        end
        vol[("<b>Vault clone</b><br/>[Volume]<br/><small>Mounted at VAULT_PATH</small>")]:::store
        key[("<b>Deploy key</b><br/>[File]<br/><small>Read-only SSH key</small>")]:::store
    end

    subgraph gh["GitHub, external service"]
        apprepo[("<b>App repo</b><br/>[External: git]<br/><small>Public app code</small>")]:::external
        actions["<b>GitHub Actions</b><br/>[External]<br/><small>Builds both images</small>"]:::external
        ghcr[("<b>Container registry</b><br/>[External: ghcr.io]<br/><small>Two public images</small>")]:::external
        vaultrepo[("<b>Vault repo</b><br/>[External: git]<br/><small>Private notes</small>")]:::external
    end

    browser -- "opens pages, HTTPS" --> ts
    other -. "no route" .-x ts
    ts -- "forwards, HTTP" --> web
    web -- "calls, HTTP" --> api
    vol -. "mounted" .-> api
    key -. "mounted" .-> api
    api -- "git pull, SSH" --> vaultrepo
    apprepo -- "starts a build" --> actions
    actions -- "pushes images" --> ghcr
    compose -- "pulls images" --> ghcr

    classDef person fill:#1f6feb,stroke:#58a6ff,color:#ffffff,rx:8,ry:8
    classDef system fill:#1f6feb,stroke:#58a6ff,color:#ffffff,rx:8,ry:8
    classDef container fill:#0c2d6b,stroke:#388bfd,color:#e6edf3,rx:8,ry:8
    classDef component fill:#0c2d6b,stroke:#388bfd,color:#e6edf3,rx:8,ry:8
    classDef store fill:#0c2d6b,stroke:#388bfd,color:#e6edf3
    classDef external fill:#21262d,stroke:#8b949e,color:#c9d1d9,stroke-dasharray:4 3,rx:8,ry:8
```

| Node | Runs | Holds |
|---|---|---|
| Home server | Docker, Tailscale | Both containers, the vault clone, the deploy key |
| Web container | Node, the built Next.js app | No data. It can be replaced at any time. |
| API container | Node, the built API, git | The vault index in memory. It can be replaced at any time. |
| Volume | | The vault clone. It outlives the containers. |
| GitHub | Actions, the registry | The app code, the two public images, the private vault |

A third container, the trace viewer, runs only with the `tracing` profile and is not in the
diagram. See [Errors, logging and tracing](errors-and-logging.md).

The two containers share a private Docker network. Web calls the API by its service name. The API
has no port on the host and no route from the tailnet except through Web.

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
        CI->>Reg: pushes both images
        Dev->>Srv: runs docker compose pull and up -d
        Srv->>Reg: pulls the new images
        Srv->>Srv: replaces the containers
        Srv->>Srv: the API pulls the vault and builds the index
    end
```

## Settings

| Setting | Where it is set | Purpose |
|---|---|---|
| `VAULT_PATH` | Compose file on the server | The folder of the vault clone inside the API container |
| `API_URL` | Compose file on the server | The address of the API on the Docker network, for Web |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | The `tracing` profile of the Compose file | Where both services send traces. Not set in normal use. |
| Deploy key path | Compose file on the server | The key that `git pull` uses |

No setting holds a secret value. The key is a file on the server and is never in the repo or the
image.

## One-time setup on the server

1. Create an SSH key on the server.
2. Add the public key to the vault repo as a deploy key. Do not give it write access.
3. Clone the vault into the volume.
4. Write the Compose file with the two services, the volume, the key mount and the Web port on
   `127.0.0.1`.
5. Run `tailscale serve` to forward the tailnet HTTPS address to that port.
6. Run `docker compose up -d`.
