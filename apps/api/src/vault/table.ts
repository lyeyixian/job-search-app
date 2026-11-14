/** The cells of one table row. `\|` is a bar inside a cell. */
export function cells(line: string): string[] {
  const inner = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return inner.split(/(?<!\\)\|/).map((cell) => cell.replace(/\\\|/g, "|").trim());
}

const SEPARATOR = /^\|?[\s:|-]+\|?$/;

/** Reads a markdown table. Each row is a map from the header in lower case to the cell. */
export function table(lines: string[]): Map<string, string>[] {
  const rows = lines.filter((line) => line.trim().startsWith("|"));
  const header = rows[0];
  if (!header) return [];
  const names = cells(header).map((name) => name.toLowerCase());
  return rows
    .slice(1)
    .filter((line) => !SEPARATOR.test(line.trim()))
    .map((line) => new Map(cells(line).map((cell, i) => [names[i] ?? String(i), cell])));
}

/** The value of `known` that a cell holds, or null. The cell can have code marks or bold marks. */
export function enumValue<T extends string>(known: readonly T[], cell: string | undefined): T | null {
  const value = (cell ?? "").replace(/[`*]/g, "").trim().toLowerCase();
  return known.find((candidate) => candidate === value) ?? null;
}
