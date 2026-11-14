import { loadVault, type VaultIndex } from "./load.js";

/** Holds the current vault index. A load builds a new index and swaps it in. */
export class VaultStore {
  #index: VaultIndex | null = null;
  readonly vaultPath: string;

  constructor(vaultPath: string) {
    this.vaultPath = vaultPath;
  }

  /** The current index, or null before the first load completes. */
  get index(): VaultIndex | null {
    return this.#index;
  }

  async load(): Promise<VaultIndex> {
    const index = await loadVault(this.vaultPath);
    this.#index = index;
    return index;
  }
}
