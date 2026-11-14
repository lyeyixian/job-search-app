import type { ApplicationList, ApplicationSummary, GetApplicationsParams } from "@/api/client";
import { ApplicationCard } from "./application-card";
import { BoardFilters } from "./board-filters";
import { FINISHED_STATUSES, OPEN_STATUSES, STATUS_LABEL, type Status } from "./labels";

function CardList({ applications }: { applications: ApplicationSummary[] }) {
  if (applications.length === 0) {
    return <p className="px-1 text-muted-foreground text-sm">No applications.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {applications.map((application) => (
        <ApplicationCard key={application.slug} application={application} />
      ))}
    </ul>
  );
}

function Count({ value }: { value: number }) {
  return (
    <span
      className="rounded-full bg-background px-2 py-0.5 text-muted-foreground text-xs tabular-nums"
      data-testid="count"
    >
      {value}
    </span>
  );
}

/** The application board. The API gives the applications in card order, so the board only groups them. */
export function Board({ list, chosen }: { list: ApplicationList; chosen: GetApplicationsParams }) {
  const byStatus = new Map<Status, ApplicationSummary[]>(
    [...OPEN_STATUSES, ...FINISHED_STATUSES].map((status) => [status, []]),
  );
  for (const application of list.applications) {
    // An application with no permitted status shows in the first column, with its warning.
    byStatus.get(application.status ?? "analyzed")?.push(application);
  }
  const cards = (status: Status) => byStatus.get(status) ?? [];

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <BoardFilters choices={list.choices} chosen={chosen} />

      {/* On a phone a column is almost as wide as the screen, and a swipe goes to the next one. */}
      <div
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:snap-none md:grid-cols-4 md:overflow-visible md:px-0"
        data-testid="board-columns"
      >
        {OPEN_STATUSES.map((status) => (
          <section
            key={status}
            aria-labelledby={`column-${status}`}
            data-testid={`column-${status}`}
            className="flex w-[85vw] max-w-sm shrink-0 snap-start flex-col gap-3 rounded-xl bg-muted p-3 md:w-auto md:max-w-none"
          >
            <div className="flex items-center justify-between px-1">
              <h2 id={`column-${status}`} className="font-semibold text-sm">
                {STATUS_LABEL[status]}
              </h2>
              <Count value={cards(status).length} />
            </div>
            <CardList applications={cards(status)} />
          </section>
        ))}
      </div>

      <details className="group rounded-xl bg-muted p-3" data-testid="finished-group">
        <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 px-1 font-semibold text-sm">
          <span>Finished</span>
          {FINISHED_STATUSES.map((status) => (
            <span
              key={status}
              className="flex items-center gap-1.5 font-normal"
              data-testid={`finished-count-${status}`}
            >
              {STATUS_LABEL[status]} <Count value={cards(status).length} />
            </span>
          ))}
          <span className="ml-auto font-normal text-muted-foreground text-xs group-open:hidden">Show</span>
          <span className="ml-auto hidden font-normal text-muted-foreground text-xs group-open:inline">Hide</span>
        </summary>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {FINISHED_STATUSES.map((status) => (
            <section
              key={status}
              aria-labelledby={`group-${status}`}
              data-testid={`group-${status}`}
              className="flex flex-col gap-2"
            >
              <h3 id={`group-${status}`} className="px-1 text-muted-foreground text-sm">
                {STATUS_LABEL[status]}
              </h3>
              <CardList applications={cards(status)} />
            </section>
          ))}
        </div>
      </details>
    </div>
  );
}
