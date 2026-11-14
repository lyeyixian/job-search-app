import Link from "next/link";
import type { GetShortlistParams, Shortlist, ShortlistListing } from "@/api/client";
import { STATUS_LABEL, warningText } from "@/components/board/labels";
import { Badge } from "@/components/ui/badge";
import { day } from "@/lib/day";
import { cn } from "@/lib/utils";
import { ShortlistFilters } from "./shortlist-filters";

// On a wide screen a row is one line of six columns. On a phone the same cells stack.
const COLUMNS = "lg:grid lg:grid-cols-[9rem_minmax(11rem,16rem)_7rem_minmax(0,1fr)_6.5rem_7.5rem] lg:gap-x-4";

/** The application of a promoted listing, as a link with its status. */
export function Promotion({ application }: { application: ShortlistListing["application"] }) {
  if (!application) {
    return <span className="text-muted-foreground text-sm">Not promoted</span>;
  }
  if (!application.found) {
    return (
      <span className="text-destructive text-sm" title="The vault has no such application">
        <code className="font-mono text-[0.85em]">{application.slug}</code> (missing)
      </span>
    );
  }
  return (
    <Badge
      asChild
      variant="secondary"
      className="min-h-8 px-2.5 text-sm hover:border-ring lg:min-h-0 lg:px-2 lg:text-xs"
    >
      <Link href={`/applications/${application.slug}`} aria-label={`Application: ${statusOf(application)}`}>
        {statusOf(application)}
      </Link>
    </Badge>
  );
}

function statusOf(application: NonNullable<ShortlistListing["application"]>): string {
  return application.status ? STATUS_LABEL[application.status] : "No status";
}

/** One listing. `first` is true for the first listing of a company. */
function Row({ listing, first }: { listing: ShortlistListing; first: boolean }) {
  const { company, companyName, slug, title, level, reason, firstSeen, application, warnings } = listing;
  return (
    <li
      data-testid="shortlist-row"
      data-company={company}
      data-slug={slug}
      className={cn(
        "flex flex-col gap-1.5 border-t px-3 py-3 lg:items-baseline lg:gap-y-1 lg:py-2.5",
        COLUMNS,
        // A stronger line starts the listings of the next company.
        first && "border-t-2 border-t-foreground/25 first:border-t-0",
      )}
    >
      <Link
        href={`/companies/${company}`}
        data-testid="row-company"
        className="w-fit text-muted-foreground text-sm underline-offset-2 hover:underline lg:font-medium lg:text-foreground"
      >
        {companyName}
      </Link>
      <Link
        href={`/companies/${company}/listings/${slug}`}
        data-testid="row-title"
        className="w-fit font-medium text-base leading-snug underline underline-offset-2 lg:text-sm"
      >
        {title}
      </Link>
      <p className="text-sm" data-testid="row-level">
        <span className="text-muted-foreground lg:hidden">Level: </span>
        {level || "None"}
      </p>
      <p className="text-sm" data-testid="row-reason">
        {reason}
      </p>
      <p className="text-sm tabular-nums" data-testid="row-first-seen">
        <span className="text-muted-foreground lg:hidden">First seen: </span>
        {day(firstSeen)}
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

/** The shortlist. The API gives the listings in row order, so the page only draws them. */
export function ShortlistView({ shortlist, chosen }: { shortlist: Shortlist; chosen: GetShortlistParams }) {
  const { listings, total, companies } = shortlist;

  if (total === 0) {
    return (
      <p className="text-sm" data-testid="shortlist-empty">
        The shortlist is empty. No open listing has the triage shortlist.
      </p>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <ShortlistFilters companies={companies} chosen={chosen} />
      <p className="text-muted-foreground text-sm">
        <span className="font-medium text-foreground tabular-nums" data-testid="shortlist-count">
          {listings.length}
        </span>{" "}
        {listings.length === 1 ? "listing" : "listings"}
        {listings.length < total ? ` of ${total}` : ""}
      </p>

      {listings.length === 0 ? (
        <p className="text-sm" data-testid="shortlist-no-match">
          No listing matches these choices.
        </p>
      ) : (
        <div className="rounded-xl border">
          <div
            className={cn("hidden border-b bg-muted px-3 py-2 font-medium text-muted-foreground text-xs", COLUMNS)}
            aria-hidden="true"
          >
            <span>Company</span>
            <span>Listing</span>
            <span>Level</span>
            <span>Reason</span>
            <span>First seen</span>
            <span>Application</span>
          </div>
          <ul>
            {listings.map((listing, i) => (
              <Row
                key={`${listing.company}/${listing.slug}`}
                listing={listing}
                first={listing.company !== listings[i - 1]?.company}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
