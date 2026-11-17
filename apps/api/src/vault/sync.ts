import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

// A pull that takes longer than this does not answer.
const TIMEOUT_MS = 60_000;

/** The pull of the vault clone failed. `reason` is the first line that git wrote, and holds no note content. */
export class VaultPullError extends Error {
  readonly reason: string;

  constructor(reason: string) {
    super("The pull of the vault clone failed.");
    this.name = "VaultPullError";
    this.reason = reason;
  }
}

export type SyncResult = {
  /** True if the vault is a git clone with a remote, and git pulled it. */
  pulled: boolean;
  /** The commit of the clone after the pull. `null` if the vault is not a git clone. */
  commit: string | null;
};

async function git(vaultPath: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await run("git", ["-C", vaultPath, ...args], {
      timeout: TIMEOUT_MS,
      // git must fail, not wait for a password.
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    });
    return stdout.trim();
  } catch (error) {
    const { stderr, killed, message } = error as Error & { stderr?: string; killed?: boolean };
    const firstLine = (stderr || message).split("\n").find((line) => line.trim() !== "") ?? "";
    throw new VaultPullError(killed ? `git did not answer in ${TIMEOUT_MS / 1000} seconds` : firstLine.trim());
  }
}

/**
 * Gets the newest saved vault. If `vaultPath` is a git clone with a remote, runs `git pull`
 * there. A folder that is not a clone, such as the fixture vault, and a clone with no remote
 * stay as they are.
 *
 * The pull only moves forward. If the clone has commits that the remote does not have, the pull
 * fails and the clone stays as it is.
 */
export async function syncVault(vaultPath: string): Promise<SyncResult> {
  if (!existsSync(join(vaultPath, ".git"))) return { pulled: false, commit: null };
  const hasRemote = (await git(vaultPath, ["remote"])) !== "";
  if (hasRemote) await git(vaultPath, ["pull", "--ff-only", "--quiet"]);
  // A clone with no commit has no HEAD.
  const commit = await git(vaultPath, ["rev-parse", "--verify", "--quiet", "HEAD"]).catch(() => null);
  return { pulled: hasRemote, commit };
}
