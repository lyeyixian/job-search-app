"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ApplicationList, GetApplicationsParams } from "@/api/client";
import { BOARD_SEARCH_KEY } from "./board-search";
import { DIRECTION_LABEL, REGION_LABEL, VERDICT_LABEL } from "./labels";

type FilterKey = keyof GetApplicationsParams;

/** The query string of a set of choices, with its `?`. Empty if nothing is chosen. */
function searchOf(chosen: GetApplicationsParams): string {
  const query = new URLSearchParams();
  for (const [name, current] of Object.entries(chosen)) {
    if (current) query.set(name, current);
  }
  const search = query.toString();
  return search ? `?${search}` : "";
}

/**
 * The choices that narrow the board. A choice goes to the query string, so Back returns to the
 * same board and a narrowed board can be bookmarked.
 */
export function BoardFilters({
  choices,
  chosen,
}: {
  choices: ApplicationList["choices"];
  chosen: GetApplicationsParams;
}) {
  const router = useRouter();

  // The page of an application reads this, so that its link back shows the same board.
  const search = searchOf(chosen);
  useEffect(() => {
    try {
      sessionStorage.setItem(BOARD_SEARCH_KEY, search);
    } catch {
      // A browser can refuse storage. The link back then goes to the board with no filters.
    }
  }, [search]);

  function choose(key: FilterKey, value: string) {
    router.push(`/applications${searchOf({ ...chosen, [key]: value })}`);
  }

  const selects: { key: FilterKey; label: string; options: { value: string; label: string }[] }[] = [
    { key: "company", label: "Company", options: choices.companies.map((value) => ({ value, label: value })) },
    {
      key: "region",
      label: "Region",
      options: choices.regions.map((value) => ({ value, label: REGION_LABEL[value] })),
    },
    {
      key: "verdict",
      label: "Verdict",
      options: choices.verdicts.map((value) => ({ value, label: VERDICT_LABEL[value] })),
    },
    {
      key: "direction",
      label: "Direction check",
      options: choices.directions.map((value) => ({ value, label: DIRECTION_LABEL[value] })),
    },
  ];
  const narrowed = Object.values(chosen).some(Boolean);

  return (
    <div className="flex flex-wrap items-end gap-3" data-testid="board-filters">
      {selects.map(({ key, label, options }) => (
        <label key={key} className="flex min-w-36 flex-1 flex-col gap-1 text-sm sm:flex-none">
          <span className="text-muted-foreground">{label}</span>
          <select
            name={key}
            value={chosen[key] ?? ""}
            onChange={(event) => choose(key, event.target.value)}
            className="h-10 rounded-md border bg-background px-2 text-base sm:text-sm"
          >
            <option value="">All</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      {narrowed ? (
        <Link href="/applications" className="flex h-10 items-center rounded-md border px-3 text-sm hover:bg-secondary">
          Clear
        </Link>
      ) : null}
    </div>
  );
}
