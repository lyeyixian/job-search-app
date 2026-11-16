import Link from "next/link";
import type { ReactNode } from "react";
import type { Direction, Targets } from "@/api/client";
import { Backlinks } from "@/components/backlinks";
import { warningText } from "@/components/board/labels";
import { Fact } from "@/components/companies/fact";
import { Markdown } from "@/components/markdown";
import { day } from "@/lib/day";
import { month } from "@/lib/month";

/** `2026-10-21` as `21 Oct 2026`, and `2026-10` as `Oct 2026`. */
function lastUpdate(updated: string | null): string {
  return updated && updated.length === 7 ? month(updated) : day(updated);
}

/**
 * The page of the direction or of the targets: the last update, a list of the sections, the text
 * as the person wrote it, and the notes that point here. `top` goes above the list of sections.
 * The feature is docs/features/direction-and-targets.md.
 */
export function PlanNote({ note, top }: { note: Direction | Targets; top?: ReactNode }) {
  const { title, body, updated, sections, warnings, links, backlinks } = note;
  const headingIds = Object.fromEntries(sections.map((section) => [section.title, section.anchor]));

  return (
    <>
      <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
      <dl className="flex flex-wrap gap-x-10 gap-y-3">
        <Fact name="Last update" testId="plan-updated">
          {lastUpdate(updated)}
        </Fact>
      </dl>
      {top}
      {warnings.length > 0 ? (
        <ul className="flex flex-col gap-0.5 text-amber-900 text-xs" data-testid="plan-warnings">
          {warnings.map((warning) => (
            <li key={warning.field}>Warning: {warningText(warning)}</li>
          ))}
        </ul>
      ) : null}
      {sections.length > 1 ? (
        <nav aria-labelledby="sections-heading" className="flex flex-col gap-2 rounded-xl border p-3 sm:p-4">
          <h2 id="sections-heading" className="font-medium text-muted-foreground text-xs">
            Sections
          </h2>
          <ol className="flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-5" data-testid="plan-sections">
            {sections.map(({ anchor, title: name }) => (
              <li key={anchor}>
                <a href={`#${anchor}`} className="flex min-h-9 items-center text-sm underline underline-offset-2">
                  {name}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div data-testid="plan-body">
        <Markdown headingIds={headingIds} links={links} companies={"companies" in note ? note.companies : undefined}>
          {body}
        </Markdown>
      </div>
      <Backlinks backlinks={backlinks} />
    </>
  );
}

/** The link back to the Search page, above the title. */
export function BackToSearch() {
  return (
    <Link href="/search" className="text-muted-foreground text-sm hover:underline">
      Search
    </Link>
  );
}
