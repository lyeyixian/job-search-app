import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { type Note, parseNote } from "./parser.js";

export type VaultIndex = {
  /** Every parsed note, keyed by its path from the vault root. */
  notes: Map<string, Note>;
  /** The path of every file in the vault, notes and other files, from the vault root. */
  files: Set<string>;
  /** The time that this index was built. */
  loadedAt: Date;
};

async function allFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await allFiles(full)));
    } else {
      files.push(full);
    }
  }
  return files.sort();
}

/** Reads every markdown file below `vaultPath`, records the path of every file, and builds a new index. */
export async function loadVault(vaultPath: string): Promise<VaultIndex> {
  const notes = new Map<string, Note>();
  const files = new Set<string>();
  for (const file of await allFiles(vaultPath)) {
    const path = relative(vaultPath, file).split(sep).join("/");
    files.add(path);
    if (path.endsWith(".md")) {
      notes.set(path, parseNote(path, await readFile(file, "utf8")));
    }
  }
  return { notes, files, loadedAt: new Date() };
}
