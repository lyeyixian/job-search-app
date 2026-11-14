import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { type CompanySummary, getCompanies } from "@/api/client";
import { ApiProblem } from "@/components/api-problem";
import { MODE_LABEL } from "@/components/board/labels";
import { Badge } from "@/components/ui/badge";
import { day } from "@/lib/day";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Companies" };

// The feature is docs/features/company-listings.md.
export default function CompaniesPage() {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-4xl flex-1 flex-col gap-4 p-4 sm:p-6">
      <h1 className="font-semibold text-2xl tracking-tight">Companies</h1>
      <Suspense fallback={<p className="text-muted-foreground text-sm">Getting the companies.</p>}>
        <CompaniesData />
      </Suspense>
    </main>
  );
}

// On a wide screen a row is one line of five columns. On a phone the name is a line and the facts wrap below it.
const COLUMNS = "sm:grid sm:grid-cols-[minmax(0,1fr)_5rem_7.5rem_6.5rem_5rem] sm:gap-x-4";

function Row({ company }: { company: CompanySummary }) {
  const { slug, name, mode, lastSwept, openShortlisted, listings } = company;
  return (
    <li
      data-testid="company-row"
      data-company={slug}
      className={cn("flex flex-wrap items-baseline gap-x-4 gap-y-1.5 border-t px-3 py-3 first:border-t-0", COLUMNS)}
    >
      <Link
        href={`/companies/${slug}`}
        data-testid="company-name"
        className="w-full font-medium text-base underline underline-offset-2 sm:w-fit sm:text-sm"
      >
        {name}
      </Link>
      <p data-testid="company-mode">
        {mode ? (
          <Badge variant={mode === "active" ? "secondary" : "outline"}>{MODE_LABEL[mode]}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">Not on the watchlist</span>
        )}
      </p>
      <p className="text-sm tabular-nums" data-testid="company-last-swept">
        <span className="text-muted-foreground sm:hidden">Last sweep: </span>
        {day(lastSwept)}
      </p>
      <p className="text-sm tabular-nums sm:text-right" data-testid="company-shortlisted">
        <span className="text-muted-foreground sm:hidden">Shortlisted: </span>
        <span className={cn(openShortlisted > 0 ? "font-medium" : "text-muted-foreground")}>{openShortlisted}</span>
      </p>
      <p className="text-sm tabular-nums sm:text-right" data-testid="company-listings">
        <span className="text-muted-foreground sm:hidden">Listings: </span>
        {listings}
      </p>
    </li>
  );
}

// The companies are read on each request. Next.js does not prerender them.
async function CompaniesData() {
  const result = await getCompanies();
  if (!result.ok) return <ApiProblem code={result.code} traceId={result.traceId} />;
  const { companies } = result.data;

  if (companies.length === 0) {
    return (
      <p className="text-sm" data-testid="companies-empty">
        The market scan has no company yet.
      </p>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        <span className="font-medium text-foreground tabular-nums" data-testid="companies-count">
          {companies.length}
        </span>{" "}
        {companies.length === 1 ? "company" : "companies"}
      </p>
      <div className="rounded-xl border">
        <div
          className={cn("hidden border-b bg-muted px-3 py-2 font-medium text-muted-foreground text-xs", COLUMNS)}
          aria-hidden="true"
        >
          <span>Company</span>
          <span>Mode</span>
          <span>Last sweep</span>
          <span className="text-right">Shortlisted</span>
          <span className="text-right">Listings</span>
        </div>
        <ul>
          {companies.map((company) => (
            <Row key={company.slug} company={company} />
          ))}
        </ul>
      </div>
    </div>
  );
}
