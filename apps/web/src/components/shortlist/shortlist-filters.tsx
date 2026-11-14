"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { GetShortlistParams, Shortlist } from "@/api/client";

/**
 * The choices that narrow the shortlist. A choice goes to the query string, so Back returns to
 * the same shortlist and a narrowed shortlist can be bookmarked.
 */
export function ShortlistFilters({
  companies,
  chosen,
}: {
  companies: Shortlist["companies"];
  chosen: GetShortlistParams;
}) {
  const router = useRouter();

  function choose(next: GetShortlistParams) {
    const query = new URLSearchParams();
    if (next.company) query.set("company", next.company);
    if (next.promoted === "hide") query.set("promoted", "hide");
    const search = query.toString();
    router.push(search ? `/shortlist?${search}` : "/shortlist");
  }

  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-3" data-testid="shortlist-filters">
      <label className="flex min-w-36 flex-1 flex-col gap-1 text-sm sm:flex-none">
        <span className="text-muted-foreground">Company</span>
        <select
          name="company"
          value={chosen.company ?? ""}
          onChange={(event) => choose({ ...chosen, company: event.target.value })}
          className="h-10 rounded-md border bg-background px-2 text-base sm:text-sm"
        >
          <option value="">All</option>
          {companies.map((company) => (
            <option key={company.slug} value={company.slug}>
              {company.name} ({company.count})
            </option>
          ))}
        </select>
      </label>
      <label className="flex h-10 items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="promoted"
          checked={chosen.promoted === "hide"}
          onChange={(event) => choose({ ...chosen, promoted: event.target.checked ? "hide" : "" })}
          className="size-4"
        />
        Hide promoted listings
      </label>
      {chosen.company || chosen.promoted ? (
        <Link href="/shortlist" className="flex h-10 items-center rounded-md border px-3 text-sm hover:bg-secondary">
          Clear
        </Link>
      ) : null}
    </div>
  );
}
