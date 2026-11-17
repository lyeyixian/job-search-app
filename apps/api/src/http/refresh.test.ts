import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { VaultStore } from "../vault/store.js";
import { createApp } from "./app.js";
import { HealthSchema, RefreshSchema } from "./health.js";
import { ProblemSchema } from "./problem.js";

const fixtureVault = fileURLToPath(new URL("../../../../fixtures/vault", import.meta.url));

let root: string | null = null;

afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true });
  root = null;
});

describe("POST /api/refresh", () => {
  it("reads the fixture vault again with no pull and returns the new time", async () => {
    const store = new VaultStore(fixtureVault);
    const first = await store.load();
    const app = createApp(store);

    const response = await app.request("/api/refresh", { method: "POST" });

    expect(response.status).toBe(200);
    const body = RefreshSchema.parse(await response.json());
    expect(body.pulled).toBe(false);
    expect(body.commit).toBeNull();
    expect(body.notes).toBe(first.notes.size);
    expect(store.index).not.toBe(first);
    expect(Date.parse(body.loadedAt)).toBeGreaterThanOrEqual(first.loadedAt.getTime());

    const health = HealthSchema.parse(await (await app.request("/api/health")).json());
    expect(health.vault.loadedAt).toBe(body.loadedAt);
  });

  it("returns a 502 problem with the code vault_pull_failed and keeps the old index", async () => {
    root = mkdtempSync(join(tmpdir(), "vault-refresh-"));
    execFileSync("git", ["init", "--quiet", "--initial-branch=main"], { cwd: root });
    execFileSync("git", ["remote", "add", "origin", join(root, "no-such-repo")], { cwd: root });
    const store = new VaultStore(root);
    const first = await store.load();

    const response = await createApp(store).request("/api/refresh", { method: "POST" });

    expect(response.status).toBe(502);
    expect(response.headers.get("content-type")).toContain("application/problem+json");
    expect(ProblemSchema.parse(await response.json()).code).toBe("vault_pull_failed");
    expect(store.index).toBe(first);
  });

  it("does not answer a GET", async () => {
    const store = new VaultStore(fixtureVault);
    await store.load();

    const response = await createApp(store).request("/api/refresh");

    expect(response.status).toBe(404);
  });
});
