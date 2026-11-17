import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { VaultStore } from "./store.js";
import { syncVault, VaultPullError } from "./sync.js";

let root: string;

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", ...args], {
    cwd,
    encoding: "utf8",
  }).trim();
}

/** Writes a note in `folder`, commits it and returns the commit. */
function save(folder: string, name: string, text: string): string {
  writeFileSync(join(folder, name), text);
  git(folder, "add", ".");
  git(folder, "commit", "--quiet", "-m", `save ${name}`);
  return git(folder, "rev-parse", "HEAD");
}

/** Makes the shared copy of a vault with one note, and a clone of it. */
function sharedAndClone(): { shared: string; clone: string } {
  const shared = join(root, "shared");
  const clone = join(root, "clone");
  mkdirSync(shared);
  git(shared, "init", "--quiet", "--initial-branch=main");
  save(shared, "first.md", "# First\n");
  git(root, "clone", "--quiet", shared, clone);
  return { shared, clone };
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "vault-sync-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("syncVault", () => {
  it("does not pull a folder that is not a git clone", async () => {
    writeFileSync(join(root, "note.md"), "# Note\n");

    expect(await syncVault(root)).toEqual({ pulled: false, commit: null });
  });

  it("does not pull a clone with no remote", async () => {
    git(root, "init", "--quiet", "--initial-branch=main");
    const commit = save(root, "note.md", "# Note\n");

    expect(await syncVault(root)).toEqual({ pulled: false, commit });
  });

  it("pulls a clone with a remote", async () => {
    const { shared, clone } = sharedAndClone();
    const commit = save(shared, "second.md", "# Second\n");

    expect(await syncVault(clone)).toEqual({ pulled: true, commit });
  });

  it("fails with a VaultPullError if git cannot reach the remote", async () => {
    const { shared, clone } = sharedAndClone();
    rmSync(shared, { recursive: true });

    await expect(syncVault(clone)).rejects.toBeInstanceOf(VaultPullError);
  });
});

describe("VaultStore.refresh", () => {
  it("shows a note that the shared copy got after the first load", async () => {
    const { shared, clone } = sharedAndClone();
    const store = new VaultStore(clone);
    const first = await store.refresh();
    expect([...first.notes.keys()]).toEqual(["first.md"]);

    const commit = save(shared, "second.md", "# Second\n");
    const second = await store.refresh();

    expect([...second.notes.keys()]).toEqual(["first.md", "second.md"]);
    expect(second.commit).toBe(commit);
    expect(second.pulled).toBe(true);
    expect(store.index?.commit).toBe(commit);
    expect(second.loadedAt.getTime()).toBeGreaterThanOrEqual(first.loadedAt.getTime());
  });

  it("keeps the old index if the pull fails", async () => {
    const { shared, clone } = sharedAndClone();
    const store = new VaultStore(clone);
    const first = await store.refresh();
    rmSync(shared, { recursive: true });

    await expect(store.refresh()).rejects.toBeInstanceOf(VaultPullError);

    expect(store.index?.loadedAt).toBe(first.loadedAt);
    expect(store.index?.commit).toBe(first.commit);
  });

  it("runs one pull for two calls at the same time", async () => {
    const { clone } = sharedAndClone();
    const store = new VaultStore(clone);

    const [a, b] = await Promise.all([store.refresh(), store.refresh()]);

    expect(a.loadedAt).toBe(b.loadedAt);
  });
});
