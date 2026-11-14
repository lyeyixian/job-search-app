import Link from "next/link";
import type { EvidencePart, FitAnalysis, Gap, Requirement } from "@/api/client";
import { InlineMarkdown, Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const GRADE_LABEL = { met: "Met", partial: "Partial", gap: "Gap" } as const;

// Each grade has its own colour, its own mark and its own word, so colour is not the only sign.
const GRADE_STYLE = {
  met: "border-transparent bg-emerald-100 text-emerald-900",
  partial: "border-transparent bg-amber-100 text-amber-900",
  gap: "border-transparent bg-red-100 text-red-900",
} as const;
const GRADE_MARK = { met: "✓", partial: "◐", gap: "✕" } as const;

const KIND_LABEL = { "must-have": "Must-have", "nice-to-have": "Nice-to-have" } as const;
const ACTION_LABEL = { positioning: "Positioning", learning: "Learning" } as const;
const ACTION_STYLE = {
  positioning: "border-transparent bg-sky-100 text-sky-900",
  learning: "border-transparent bg-violet-100 text-violet-900",
} as const;

function GradeBadge({ grade }: { grade: Requirement["grade"] }) {
  if (!grade) return <span className="text-muted-foreground">No grade</span>;
  return (
    <Badge variant="outline" className={GRADE_STYLE[grade]} data-testid="grade" data-grade={grade}>
      <span aria-hidden="true">{GRADE_MARK[grade]}</span>
      {GRADE_LABEL[grade]}
    </Badge>
  );
}

function Evidence({ parts }: { parts: EvidencePart[] }) {
  if (parts.length === 0) return <span className="text-muted-foreground">No evidence</span>;
  return (
    <>
      {parts.map((part, index) => {
        // The parts of a cell keep their order, so the index is a stable key.
        const key = `${index}`;
        if (part.type === "text") {
          // Markdown drops the space at each end of a text, so the space goes back around it.
          return (
            <span key={key}>
              {/^\s/.test(part.text) ? " " : null}
              <InlineMarkdown>{part.text}</InlineMarkdown>
              {/\s$/.test(part.text) ? " " : null}
            </span>
          );
        }
        if (!part.note || !part.title) {
          // The vault has no such achievement. Text with a mark, not a link.
          return (
            <span
              key={key}
              className="text-destructive"
              data-testid="evidence-missing"
              title="The vault has no such achievement"
            >
              <code className="font-mono text-[0.85em]">{part.ref}</code> (missing)
            </span>
          );
        }
        return (
          <Link
            key={key}
            href={`/experience/${part.note}/${part.slug}#${part.anchor}`}
            title={part.noteTitle ?? undefined}
            className="font-medium underline underline-offset-2"
            data-testid="evidence-link"
          >
            {part.title}
          </Link>
        );
      })}
    </>
  );
}

// On a phone a row is a block and each cell starts with the name of its column.
const cell = "px-3 py-2 align-top max-md:block max-md:px-0 max-md:py-0.5";
const cellName = "mr-2 font-medium text-muted-foreground text-xs md:hidden";

function RequirementsTable({ requirements }: { requirements: Requirement[] }) {
  return (
    <table className="w-full text-left text-sm max-md:block" data-testid="requirements">
      <thead className="text-muted-foreground text-xs max-md:hidden">
        <tr className="border-b">
          {["Requirement", "Kind", "Firmness", "Grade", "Evidence"].map((name) => (
            <th key={name} scope="col" className="px-3 py-2 font-medium">
              {name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="max-md:flex max-md:flex-col max-md:gap-3">
        {requirements.map((row) => (
          <tr
            key={row.requirement}
            className="border-b max-md:flex max-md:flex-col max-md:gap-1 max-md:rounded-lg max-md:border max-md:p-3"
            data-testid="requirement"
          >
            <td className={cn(cell, "font-medium md:w-[26%]")} data-testid="requirement-name">
              <InlineMarkdown>{row.requirement}</InlineMarkdown>
            </td>
            <td className={cn(cell, "md:w-[14%]")} data-testid="requirement-kind">
              <span className={cellName}>Kind</span>
              {row.kind ? KIND_LABEL[row.kind] : null}
              {row.kindNote ? <span className="text-muted-foreground"> ({row.kindNote})</span> : null}
            </td>
            <td className={cn(cell, "md:w-[18%]")} data-testid="requirement-firmness">
              <span className={cellName}>Firmness</span>
              <InlineMarkdown>{row.firmness}</InlineMarkdown>
            </td>
            <td className={cell} data-testid="requirement-grade">
              <span className={cellName}>Grade</span>
              <GradeBadge grade={row.grade} />
            </td>
            <td className={cell} data-testid="requirement-evidence">
              <span className={cellName}>Evidence</span>
              <Evidence parts={row.evidence} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Gaps({ gaps, note }: { gaps: Gap[]; note: string }) {
  return (
    <div className="flex flex-col gap-3">
      {note ? <Markdown>{note}</Markdown> : null}
      {gaps.length > 0 ? (
        <ul className="flex flex-col gap-2" data-testid="gaps">
          {gaps.map((gap) => (
            <li
              key={`${gap.requirement}-${gap.text}`}
              className="flex flex-col gap-1.5 rounded-lg border p-3"
              data-testid="gap"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                {gap.action ? (
                  <Badge variant="outline" className={ACTION_STYLE[gap.action]} data-testid="gap-action">
                    {ACTION_LABEL[gap.action]}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground" data-testid="gap-action">
                    No bridging action
                  </Badge>
                )}
                {gap.kind ? <Badge variant="outline">{KIND_LABEL[gap.kind]}</Badge> : null}
                <GradeBadge grade={gap.grade} />
              </div>
              {gap.requirement ? (
                <p className="font-medium text-sm" data-testid="gap-requirement">
                  <InlineMarkdown>{gap.requirement}</InlineMarkdown>
                </p>
              ) : null}
              <p className="text-sm leading-relaxed">
                <InlineMarkdown>{gap.text}</InlineMarkdown>
              </p>
            </li>
          ))}
        </ul>
      ) : null}
      {gaps.length === 0 && !note ? <p className="text-muted-foreground text-sm">No gaps.</p> : null}
    </div>
  );
}

function Heading({ children }: { children: string }) {
  return <h3 className="font-semibold text-base">{children}</h3>;
}

/** The four parts of a fit analysis: the verdict, the direction check, the requirements and the gaps. */
export function FitAnalysisView({ fit }: { fit: NonNullable<FitAnalysis> }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        <section className="flex flex-col gap-2" data-testid="fit-verdict">
          <Heading>Verdict</Heading>
          <Markdown>{fit.verdict}</Markdown>
        </section>
        <section className="flex flex-col gap-2" data-testid="fit-direction">
          <Heading>Direction check</Heading>
          <Markdown>{fit.direction}</Markdown>
        </section>
      </div>
      <section className="flex flex-col gap-2">
        <Heading>Requirements</Heading>
        <RequirementsTable requirements={fit.requirements} />
      </section>
      <section className="flex flex-col gap-2">
        <Heading>Gaps and bridging actions</Heading>
        <Gaps gaps={fit.gaps} note={fit.gapsNote} />
      </section>
    </div>
  );
}
