import { warningText } from "@/components/board/labels";

/** The warnings of a note: one line for each field that breaks the vault's rules. */
export function NoteWarnings({
  warnings,
  testId = "note-warnings",
}: {
  warnings: { field: string; problem: "missing" | "invalid" }[];
  testId?: string;
}) {
  if (warnings.length === 0) return null;
  return (
    <ul className="flex flex-col gap-0.5 text-amber-900 text-xs" data-testid={testId}>
      {warnings.map((warning) => (
        <li key={warning.field}>Warning: {warningText(warning)}</li>
      ))}
    </ul>
  );
}
