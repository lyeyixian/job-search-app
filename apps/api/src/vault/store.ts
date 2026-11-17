import { trace } from "@opentelemetry/api";
import { loadVault, type VaultIndex } from "./load.js";
import { type SyncResult, syncVault } from "./sync.js";

const tracer = trace.getTracer("job-search-api");

/** Runs one step of a Refresh in a child span of the request. */
async function step<T>(name: string, work: () => Promise<T>): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      return await work();
    } finally {
      span.end();
    }
  });
}

/** Holds the current vault index. A load builds a new index and swaps it in. */
export class VaultStore {
  #index: VaultIndex | null = null;
  #refresh: Promise<VaultIndex & SyncResult> | null = null;
  readonly vaultPath: string;

  constructor(vaultPath: string) {
    this.vaultPath = vaultPath;
  }

  /** The current index, or null before the first load completes. */
  get index(): VaultIndex | null {
    return this.#index;
  }

  /** Reads the files of the vault as they are and swaps the new index in. No pull. */
  async load(commit: string | null = null): Promise<VaultIndex> {
    const index = await step("vault.parse", () => loadVault(this.vaultPath, commit));
    await step("vault.swap", async () => {
      this.#index = index;
    });
    return index;
  }

  /**
   * Pulls the vault clone, then reads the files and swaps the new index in. If the pull or the
   * parse fails, the old index stays and the error goes to the caller. A pull failure is a
   * `VaultPullError`. Two calls at the same time share one pull.
   */
  refresh(): Promise<VaultIndex & SyncResult> {
    this.#refresh ??= (async () => {
      const sync = await step("vault.pull", () => syncVault(this.vaultPath));
      return { ...(await this.load(sync.commit)), ...sync };
    })().finally(() => {
      this.#refresh = null;
    });
    return this.#refresh;
  }
}
