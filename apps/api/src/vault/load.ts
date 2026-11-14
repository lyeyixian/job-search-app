import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { type Note, parseNote } from "./parser.js";

export type VaultIndex = {
  /** Every parsed note, keyed by its path from the vault root. */
  notes: Map<string, Note>;
  /** The time that this index was built. */
  loadedAt: Date;
};

async function markdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await markdownFiles(full)));
    } else if (entry.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files.sort();
}

/** Reads every markdown file below `vaultPath` and builds a new index. */
export async function loadVault(vaultPath: string): Promise<VaultIndex> {
  const notes = new Map<string, Note>();
  for (const file of await markdownFiles(vaultPath)) {
    const path = relative(vaultPath, file).split(sep).join("/");
    notes.set(path, parseNote(path, await readFile(file, "utf8")));
  }
  return { notes, loadedAt: new Date() };
}
