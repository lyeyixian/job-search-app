import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { type Company, getCompany } from "@/api/client";
import { ApiProblem } from "@/components/api-problem";
import { MODE_LABEL } from "@/components/board/labels";
import { CompanyListings } from "@/components/companies/company-listings";
import { Fact } from "@/components/companies/fact";
import { Markdown } from "@/components/markdown";
import { day } from "@/lib/day";

// The feature is docs/features/company-listings.md.
export default function CompanyPage({ params, searchParams }: PageProps<"/companies/[company]">) {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <Link href="/companies" className="text-muted-foreground text-sm hover:underline">
        All companies
      </Link>
      <Suspense fallback={<p className="text-muted-foreground text-sm">Getting the company.</p>}>
        <CompanyData params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

/** What the watchlist says about the company. The instructions for a sweep are not in the data. */
function Watchlist({ watchlist }: { watchlist: NonNullable<Company["watchlist"]> }) {
  const { mode, lastSwept, board, notes, pay, remote } = watchlist;
  return (
    <section className="flex flex-col gap-4" aria-labelledby="watchlist-heading" data-testid="company-watchlist">
      <h2 id="watchlist-heading" className="sr-only">
        Watchlist
      </h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-10">
        <Fact name="Mode" testId="watchlist-mode">
          {mode ? MODE_LABEL[mode] : "None"}
        </Fact>
        <Fact name="Last sweep" testId="watchlist-last-swept">
          {day(lastSwept)}
        </Fact>
        <Fact name="Job board" testId="watchlist-board">
          {board ? (
            <a href={board} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">
              Open the job board
            </a>
          ) : (
            "None"
          )}
        </Fact>
      </dl>
      <dl className="grid gap-x-10 gap-y-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Fact name="Notes" testId="watchlist-notes">
          {notes ? <Markdown>{notes}</Markdown> : "None"}
        </Fact>
        <Fact name="Pay" testId="watchlist-pay">
          {pay ? <Markdown>{pay}</Markdown> : "None"}
        </Fact>
        <Fact name="Remote work" testId="watchlist-remote">
          {remote ? <Markdown>{remote}</Markdown> : "None"}
        </Fact>
      </dl>
    </section>
  );
}

function Sweeps({ sweeps }: { sweeps: string[] }) {
  return (
    <section className="flex flex-col gap-2" aria-labelledby="sweeps-heading">
      <h2 id="sweeps-heading" className="font-semibold text-lg tracking-tight">
        Sweeps
      </h2>
      {sweeps.length === 0 ? (
        <p className="text-muted-foreground text-sm">The sweep log has no day.</p>
      ) : (
        <ol className="flex flex-wrap gap-x-2 gap-y-1.5 text-sm tabular-nums" data-testid="company-sweeps">
          {sweeps.map((sweep) => (
            <li key={sweep} className="rounded-md border px-2 py-0.5">
              {day(sweep)}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

async function CompanyData({ params, searchParams }: PageProps<"/companies/[company]">) {
  const { company: slug } = await params;
  const { rejected } = await searchParams;
  const result = await getCompany(slug);
  if (!result.ok) {
    if (result.code === "note_not_found") notFound();
    return <ApiProblem code={result.code} traceId={result.traceId} />;
  }
  const company = result.data;

  return (
    <>
      <h1 className="font-semibold text-2xl tracking-tight">{company.name}</h1>
      {company.watchlist ? (
        <Watchlist watchlist={company.watchlist} />
      ) : (
        <p className="text-muted-foreground text-sm" data-testid="company-not-watched">
          This company is not on the watchlist.
        </p>
      )}
      <Sweeps sweeps={company.sweeps} />
      <CompanyListings company={company} showRejected={rejected === "show"} />
    </>
  );
}
