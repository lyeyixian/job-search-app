# Server runbook

The commands that put the app on the home server and keep it current. The design is in
[Deployment](deployment.md). This page has no host name, user name or tailnet name, because the
repo is public. Replace each `<value>` with your own.

## Before you start

The server has Docker with the Compose plugin, git, and Tailscale. Your user is in the `docker`
group. Port 3000 on `127.0.0.1` is free, or you set `WEB_PORT` to a free port.

Both images are public on `ghcr.io`, so the server does not log in to the registry.

## Folder layout on the server

```
~/srv/job-search-app/
  compose.yaml      a copy of the file in this repo
  .env              VAULT_DIR, and WEB_PORT if not 3000
  deploy-key/       the SSH key pair that reads the vault repo
  vault/            the vault clone
```

Only `compose.yaml` comes from this repo. There is no checkout of the app on the server.

## First install

1. Make the folder and the key.

   ```sh
   mkdir -p ~/srv/job-search-app/deploy-key
   cd ~/srv/job-search-app
   chmod 700 deploy-key
   ssh-keygen -t ed25519 -N "" -C "job-search-app vault deploy key" -f deploy-key/id_ed25519
   cat deploy-key/id_ed25519.pub
   ```

2. Add the public key to the vault repo on GitHub, in Settings, Deploy keys. Do not select
   "Allow write access".

3. Clone the vault with the key. Make the clone use the key for each later pull.

   ```sh
   key="$PWD/deploy-key/id_ed25519"
   GIT_SSH_COMMAND="ssh -i $key -o IdentitiesOnly=yes" \
     git clone git@github.com:<owner>/<vault-repo>.git vault
   git -C vault config core.sshCommand "ssh -i $key -o IdentitiesOnly=yes"
   ```

4. Get the Compose file and set the vault folder.

   ```sh
   curl -fsSL https://raw.githubusercontent.com/lyeyixian/job-search-app/main/compose.yaml -o compose.yaml
   printf 'VAULT_DIR=./vault\n' > .env
   ```

5. Start the app.

   ```sh
   docker compose pull
   docker compose up -d
   ```

6. Give the app an HTTPS address on the tailnet. This example uses a Tailscale Service.

   1. In the Tailscale admin console, in Services, create a service named `<name>` on `tcp:443`.
   2. In the access controls, let the tag of the server host `svc:<name>`, and let your devices
      reach it.
   3. On the server, add the Serve entry.

      ```sh
      tailscale serve --bg --service=svc:<name> --https=443 http://127.0.0.1:3000
      ```

   4. In the admin console, open the service and approve the server as its host.

   The Serve entry is in the state of Tailscale on the server, not in a file. A rebuilt server
   needs sub-steps 3 and 4 again.

7. Do the checks in [Check the app](#check-the-app).

## Update the app

Do this after a pull request merges and the release workflow has pushed the images.

```sh
cd ~/srv/job-search-app
docker compose pull
docker compose up -d
```

If the pull request changed `compose.yaml`, get the new file first with the `curl` command from
step 4 of the first install.

Old images stay on the disk. Remove them when you want the space back.

```sh
docker image prune
```

## Update the vault

The API reads the vault when it starts and keeps the index in memory. The API does not run
`git pull` yet. Until it does, pull on the server and restart the API.

```sh
cd ~/srv/job-search-app
git -C vault pull --ff-only
docker compose restart api
```

Because the API does not pull, the deploy key is not mounted in the API container. The key stays
in `deploy-key/` and only the clone on the server uses it. Add the mount when the API starts to
pull.

## Check the app

```sh
cd ~/srv/job-search-app
docker compose ps                                              # both services are Up, api is healthy
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/   # 200
docker compose logs --tail 20 api                              # "vault index built" with a note count
tailscale serve status                                         # the entry that proxies to 127.0.0.1:3000
```

Then open the tailnet address in a browser on one of your devices.

## If something is wrong

| You see | Do this |
|---|---|
| `api` is not healthy | Read `docker compose logs api`. Make sure that `.env` has `VAULT_DIR=./vault` and that `vault/` holds the clone. |
| The pages show made-up notes | `VAULT_DIR` is not set, so Compose looked for `fixtures/vault/`. Write `.env` again and run `docker compose up -d`. |
| `git pull` asks for a password or fails with "Permission denied" | The clone does not use the deploy key, or the key is not on the vault repo. Do step 3 of the first install again. |
| The tailnet address does not open | Run `tailscale serve status`. If the entry is there, approve the host for the service in the admin console. |
| The app must go back one version | In `compose.yaml` on the server, change `latest` to the commit tag of the last good image for both services. Then run `docker compose up -d`. |

## Stop or remove the app

```sh
cd ~/srv/job-search-app
docker compose down                                            # stops both containers
tailscale serve clear svc:<name>                               # removes the tailnet address
```

`docker compose down` does not delete the vault clone or the key.
