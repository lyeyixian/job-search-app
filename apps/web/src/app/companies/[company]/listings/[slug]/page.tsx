import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getListing } from "@/api/client";
import { ApiProblem } from "@/components/api-problem";
import { regionLabel, STATUS_LABEL } from "@/components/board/labels";
import { Fact } from "@/components/companies/fact";
import { StateLabel, TriageBadge } from "@/components/companies/listing-labels";
import { Markdown } from "@/components/markdown";
import { day } from "@/lib/day";

// The feature is docs/features/company-listings.md.
export default function ListingPage({ params }: PageProps<"/companies/[company]/listings/[slug]">) {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-4xl flex-1 flex-col gap-4 p-4 sm:p-6">
      <Suspense fallback={<p className="text-muted-foreground text-sm">Getting the listing.</p>}>
        <ListingData params={params} />
      </Suspense>
    </main>
  );
}

async function ListingData({ params }: Pick<PageProps<"/companies/[company]/listings/[slug]">, "params">) {
  const { company, slug } = await params;
  const result = await getListing(company, slug);
  if (!result.ok) {
    if (result.code === "note_not_found") notFound();
    return <ApiProblem code={result.code} traceId={result.traceId} />;
  }
  const { companyName, title, region, level, firstSeen, lastSeen, url, triage, reason, state, application, body } =
    result.data;
  const notOpen = state === "closed" || state === "unknown";

  return (
    <>
      <Link href={`/companies/${company}`} className="text-muted-foreground text-sm hover:underline">
        All listings of {companyName}
      </Link>
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
        <p className="text-muted-foreground" data-testid="listing-company">
          {companyName}
        </p>
      </div>

      {notOpen ? (
        <p className="rounded-md border border-dashed bg-muted px-3 py-2 text-sm" data-testid="listing-not-open">
          {state === "closed"
            ? "This listing is closed. The last sweep did not find it."
            : "The state of this listing is unknown. The last sweep could not tell if it is open."}
        </p>
      ) : null}

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-6" data-testid="listing-facts">
        <Fact name="Region" testId="fact-region">
          {regionLabel(region)}
        </Fact>
        <Fact name="Level" testId="fact-level">
          {level || "None"}
        </Fact>
        <Fact name="First seen" testId="fact-first-seen">
          {day(firstSeen)}
        </Fact>
        <Fact name="Last seen" testId="fact-last-seen">
          {day(lastSeen)}
        </Fact>
        <Fact name="Triage" testId="fact-triage">
          <TriageBadge triage={triage} />
        </Fact>
        <Fact name="State" testId="fact-state">
          <StateLabel state={state} />
        </Fact>
      </dl>

      <p className="text-sm" data-testid="listing-reason">
        <span className="text-muted-foreground">Reason for the triage: </span>
        {reason || "None"}
      </p>

      {/* With no link and no application, this row is not on the page, so it leaves no empty space. */}
      {url || application ? (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm" data-testid="listing-links">
          {url ? (
            <a href={url} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">
              Listing on the job board
            </a>
          ) : null}
          {application ? (
            <span data-testid="listing-application">
              <span className="text-muted-foreground">Promoted to the application </span>
              {application.found ? (
                <Link href={`/applications/${application.slug}`} className="font-medium underline underline-offset-2">
                  {application.status ? STATUS_LABEL[application.status] : "No status"}
                </Link>
              ) : (
                <span className="text-destructive" title="The vault has no such application">
                  <code className="font-mono text-[0.85em]">{application.slug}</code> (missing)
                </span>
              )}
            </span>
          ) : null}
        </div>
      ) : null}

      <section className="border-t pt-4" aria-label="Text of the listing" data-testid="listing-body">
        <Markdown>{body}</Markdown>
      </section>
    </>
  );
}
