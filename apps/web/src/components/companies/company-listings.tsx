import Link from "next/link";
import type { Company, CompanyListing } from "@/api/client";
import { warningText } from "@/components/board/labels";
import { Promotion } from "@/components/shortlist/shortlist";
import { day } from "@/lib/day";
import { cn } from "@/lib/utils";
import { StateLabel, TriageBadge } from "./listing-labels";

// On a wide screen a row is one line of eight columns. On a phone the same cells stack.
const COLUMNS = "lg:grid lg:grid-cols-[minmax(10rem,15rem)_5.5rem_5rem_minmax(0,1fr)_6rem_6rem_5rem_7rem] lg:gap-x-4";

function Row({ listing }: { listing: CompanyListing }) {
  const { company, slug, title, level, triage, reason, firstSeen, lastSeen, state, application, warnings } = listing;
  const notOpen = state === "closed" || state === "unknown";
  return (
    <li
      data-testid="listing-row"
      data-slug={slug}
      data-triage={triage ?? ""}
      data-state={state ?? ""}
      className={cn(
        "flex flex-col gap-1.5 border-t px-3 py-3 first:border-t-0 lg:items-baseline lg:gap-y-1 lg:py-2.5",
        COLUMNS,
        // A listing that is not open has a grey row, and its title has a line through it.
        notOpen && "bg-muted text-muted-foreground",
      )}
    >
      <Link
        href={`/companies/${company}/listings/${slug}`}
        data-testid="row-title"
        className={cn(
          "w-fit font-medium text-base leading-snug underline underline-offset-2 lg:text-sm",
          notOpen && "line-through",
        )}
      >
        {title}
      </Link>
      <p className="text-sm" data-testid="row-level">
        <span className="text-muted-foreground lg:hidden">Level: </span>
        {level || "None"}
      </p>
      <p data-testid="row-triage">
        <TriageBadge triage={triage} />
      </p>
      <p className="text-sm" data-testid="row-reason">
        {reason}
      </p>
      <p className="text-sm tabular-nums" data-testid="row-first-seen">
        <span className="text-muted-foreground lg:hidden">First seen: </span>
        {day(firstSeen)}
      </p>
      <p className="text-sm tabular-nums" data-testid="row-last-seen">
        <span className="text-muted-foreground lg:hidden">Last seen: </span>
        {day(lastSeen)}
      </p>
      <p data-testid="row-state">
        <span className="text-muted-foreground text-sm lg:hidden">State: </span>
        <StateLabel state={state} />
      </p>
      <p data-testid="row-application">
        <Promotion application={application} />
      </p>
      {warnings.length > 0 ? (
        <ul className="col-span-full flex flex-col gap-0.5 text-amber-900 text-xs" data-testid="row-warnings">
          {warnings.map((warning) => (
            <li key={warning.field}>Warning: {warningText(warning)}</li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * The listings of one company. Rejected listings are most of the market scan, so they stay
 * hidden until `showRejected`. The choice is in the query string of the page.
 */
export function CompanyListings({ company, showRejected }: { company: Company; showRejected: boolean }) {
  const rejected = company.listings.filter((listing) => listing.triage === "reject").length;
  const shown = showRejected ? company.listings : company.listings.filter((listing) => listing.triage !== "reject");
  const toggle = "flex h-10 w-fit items-center rounded-md border px-3 text-sm hover:bg-secondary";

  return (
    <section className="flex min-w-0 flex-col gap-3" aria-labelledby="listings-heading">
      <h2 id="listings-heading" className="font-semibold text-lg tracking-tight">
        Listings
      </h2>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-muted-foreground text-sm">
          <span className="font-medium text-foreground tabular-nums" data-testid="listings-count">
            {shown.length}
          </span>{" "}
          {shown.length === 1 ? "listing" : "listings"}
          {rejected > 0 && !showRejected ? (
            <>
              {". "}
              <span data-testid="listings-hidden">
                {rejected} rejected {rejected === 1 ? "listing is" : "listings are"} hidden.
              </span>
            </>
          ) : null}
        </p>
        {rejected > 0 ? (
          showRejected ? (
            <Link href={`/companies/${company.slug}`} scroll={false} className={toggle}>
              Hide rejected listings
            </Link>
          ) : (
            <Link href={`/companies/${company.slug}?rejected=show`} scroll={false} className={toggle}>
              Show rejected listings
            </Link>
          )
        ) : null}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm" data-testid="listings-empty">
          {company.listings.length === 0
            ? "This company has no listing."
            : "Each listing of this company has the triage reject."}
        </p>
      ) : (
        <div className="rounded-xl border">
          <div
            className={cn("hidden border-b bg-muted px-3 py-2 font-medium text-muted-foreground text-xs", COLUMNS)}
            aria-hidden="true"
          >
            <span>Listing</span>
            <span>Level</span>
            <span>Triage</span>
            <span>Reason</span>
            <span>First seen</span>
            <span>Last seen</span>
            <span>State</span>
            <span>Application</span>
          </div>
          <ul>
            {shown.map((listing) => (
              <Row key={listing.slug} listing={listing} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
