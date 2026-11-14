import Link from "next/link";
import { notFound } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { type Application, getApplication } from "@/api/client";
import { ApiProblem } from "@/components/api-problem";
import { BackToBoard } from "@/components/application/back-to-board";
import { FitAnalysisView } from "@/components/application/fit-analysis";
import { type Part, PartTabs } from "@/components/application/part-tabs";
import { ResumeView } from "@/components/application/resume-view";
import {
  DIRECTION_LABEL,
  DIRECTION_STYLE,
  REGION_LABEL,
  STATUS_LABEL,
  VERDICT_LABEL,
  VERDICT_STYLE,
  warningText,
} from "@/components/board/labels";
import { Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// The feature is docs/features/application-page.md.
export default function ApplicationPage({ params }: PageProps<"/applications/[slug]">) {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-4 p-4 sm:p-6">
      <BackToBoard />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Getting the application.</p>}>
        <ApplicationData params={params} />
      </Suspense>
    </main>
  );
}

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** `2026-10-05` as `5 Oct 2026`. A day in the vault has no time zone. */
function day(value: string | null): string {
  return value ? dayFormat.format(new Date(`${value}T00:00:00Z`)) : "None";
}

function Fact({ name, testId, children }: { name: string; testId: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground text-xs">{name}</dt>
      <dd className="text-sm" data-testid={testId}>
        {children}
      </dd>
    </div>
  );
}

function Facts({ application }: { application: Application }) {
  const { region, status, verdict, direction, captured, analyzed, url, listing } = application;
  return (
    <>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-6" data-testid="application-facts">
        <Fact name="Region" testId="fact-region">
          {region ? REGION_LABEL[region] : "None"}
        </Fact>
        <Fact name="Status" testId="fact-status">
          {status ? STATUS_LABEL[status] : "None"}
        </Fact>
        <Fact name="Verdict" testId="fact-verdict">
          {verdict ? (
            <Badge variant="outline" className={VERDICT_STYLE[verdict]}>
              {VERDICT_LABEL[verdict]}
            </Badge>
          ) : (
            "None"
          )}
        </Fact>
        <Fact name="Direction check" testId="fact-direction">
          {direction ? (
            <Badge variant="outline" className={cn(DIRECTION_STYLE[direction])}>
              {DIRECTION_LABEL[direction]}
            </Badge>
          ) : (
            "None"
          )}
        </Fact>
        <Fact name="Captured" testId="fact-captured">
          {day(captured)}
        </Fact>
        <Fact name="Last fit analysis" testId="fact-analyzed">
          {day(analyzed)}
        </Fact>
      </dl>

      {/* With no link and no listing, this row is not on the page, so it leaves no empty space. */}
      {url || listing ? (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm" data-testid="application-links">
          {url ? (
            <a href={url} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">
              Posting on the job board
            </a>
          ) : null}
          {listing ? (
            <span data-testid="application-listing">
              <span className="text-muted-foreground">From the listing </span>
              {listing.title ? (
                <Link
                  href={`/companies/${listing.company}/listings/${listing.slug}`}
                  className="font-medium underline underline-offset-2"
                >
                  {listing.title}
                </Link>
              ) : (
                <span className="text-destructive" title="The vault has no such listing">
                  <code className="font-mono text-[0.85em]">
                    {listing.company}/{listing.slug}
                  </code>{" "}
                  (missing)
                </span>
              )}
            </span>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

async function ApplicationData({ params }: Pick<PageProps<"/applications/[slug]">, "params">) {
  const { slug } = await params;
  const result = await getApplication(slug);
  if (!result.ok) {
    if (result.code === "note_not_found") notFound();
    return <ApiProblem code={result.code} traceId={result.traceId} />;
  }
  const application = result.data;
  const { company, title, fit, posting, hasResume, warnings } = application;

  const fitPart: Part = {
    id: "fit",
    label: "Fit analysis",
    content: fit ? (
      <FitAnalysisView fit={fit} />
    ) : (
      <p className="text-muted-foreground text-sm">This application has no fit analysis yet.</p>
    ),
  };
  const postingPart: Part = { id: "posting", label: "Posting", content: <Markdown>{posting}</Markdown> };
  const resumePart: Part = {
    id: "resume",
    label: "Resume",
    content: hasResume ? (
      <ResumeView url={`/api/applications/${slug}/resume.pdf`} fileName={`${slug}-resume.pdf`} />
    ) : (
      <p className="text-muted-foreground text-sm" data-testid="no-resume">
        No resume exists yet for this application.
      </p>
    ),
  };

  return (
    <>
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{title ?? "No title"}</h1>
        <p className="text-muted-foreground" data-testid="application-company">
          {company ?? "No company"}
        </p>
      </div>
      <Facts application={application} />
      {warnings.length > 0 ? (
        <ul className="flex flex-col gap-0.5 text-amber-900 text-xs" data-testid="application-warnings">
          {warnings.map((warning) => (
            <li key={warning.field}>Warning: {warningText(warning)}</li>
          ))}
        </ul>
      ) : null}
      {/* The fit analysis is what the person acts on, so it comes first when the note has one. */}
      <PartTabs parts={[fitPart, postingPart, resumePart]} first={fit ? "fit" : "posting"} />
    </>
  );
}
