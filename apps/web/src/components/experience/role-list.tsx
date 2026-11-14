import Link from "next/link";
import type { RoleEntry, RoleSummary } from "@/api/client";
import { months } from "@/lib/month";

function Role({ role }: { role: RoleSummary }) {
  const { slug, title, company, jobTitle, team, start, end } = role;
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Link
          href={`/experience/roles/${slug}`}
          data-testid="role-title"
          className="w-fit font-medium text-base underline underline-offset-2 sm:text-sm"
        >
          {jobTitle ?? title}
        </Link>
        <p className="text-sm">
          <span data-testid="role-company">{company ?? "No company"}</span>
          <span className="text-muted-foreground"> · </span>
          <span data-testid="role-team" className="text-muted-foreground">
            {team ?? "No team"}
          </span>
        </p>
      </div>
      <p className="shrink-0 text-sm tabular-nums" data-testid="role-months">
        {months(start, end)}
      </p>
    </div>
  );
}

/** The roles, newest first. The stints of a programme are in one group below the programme. */
export function RoleList({ roles }: { roles: RoleEntry[] }) {
  return (
    <ul className="rounded-xl border" data-testid="role-list">
      {roles.map((role) => (
        <li
          key={role.slug}
          data-testid="role-row"
          data-slug={role.slug}
          className="flex flex-col gap-3 border-t px-3 py-3 first:border-t-0"
        >
          <Role role={role} />
          {role.stints.length > 0 ? (
            <div className="flex flex-col gap-2 border-l-2 pl-3" data-testid="programme-stints">
              <p className="font-medium text-muted-foreground text-xs">
                {role.stints.length} {role.stints.length === 1 ? "stint" : "stints"} of this programme
              </p>
              <ul className="flex flex-col gap-3">
                {role.stints.map((stint) => (
                  <li key={stint.slug} data-testid="stint-row" data-slug={stint.slug}>
                    <Role role={stint} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
