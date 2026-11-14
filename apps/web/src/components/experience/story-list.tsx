import Link from "next/link";
import type { StorySummary } from "@/api/client";
import { cn } from "@/lib/utils";
import { competencyName } from "./labels";

/**
 * The stories, with one choice for each competency. The choice is in the query string of the
 * page, so Back returns to the same stories and a choice can be bookmarked.
 */
export function StoryList({ stories, competency }: { stories: StorySummary[]; competency: string | undefined }) {
  const counts = new Map<string, number>();
  for (const story of stories) {
    for (const name of story.competencies) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const competencies = [...counts].sort(([a], [b]) => a.localeCompare(b));
  const shown = competency ? stories.filter((story) => story.competencies.includes(competency)) : stories;
  const choice = "flex min-h-9 items-center rounded-md border px-2.5 text-sm hover:bg-secondary";
  const current = "border-primary bg-primary text-primary-foreground hover:bg-primary";

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <nav aria-label="Competency" data-testid="competency-choices">
        <ul className="flex flex-wrap gap-1.5">
          <li>
            <Link
              href="/experience"
              scroll={false}
              aria-current={competency ? undefined : "true"}
              className={cn(choice, !competency && current)}
            >
              All ({stories.length})
            </Link>
          </li>
          {competencies.map(([name, count]) => (
            <li key={name}>
              <Link
                href={`/experience?competency=${encodeURIComponent(name)}`}
                scroll={false}
                aria-current={competency === name ? "true" : undefined}
                className={cn(choice, competency === name && current)}
              >
                {competencyName(name)} ({count})
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {shown.length === 0 ? (
        <p className="text-sm" data-testid="stories-empty">
          No story has this competency.
        </p>
      ) : (
        <ul className="rounded-xl border">
          {shown.map(({ slug, title, competencies: own, roles }) => (
            <li
              key={slug}
              data-testid="story-row"
              data-slug={slug}
              className="flex flex-col gap-1 border-t px-3 py-3 first:border-t-0"
            >
              <Link
                href={`/experience/stories/${slug}`}
                data-testid="story-title"
                className="w-fit font-medium text-base underline underline-offset-2 sm:text-sm"
              >
                {title}
              </Link>
              <p className="text-muted-foreground text-sm" data-testid="story-competencies">
                {own.map(competencyName).join(" · ") || "No competency"}
              </p>
              <p className="text-sm" data-testid="story-roles">
                <span className="text-muted-foreground">From: </span>
                {roles.length === 0
                  ? "No role"
                  : roles.map((role, i) => (
                      <span key={role.slug}>
                        {i > 0 ? ", " : ""}
                        <Link href={`/experience/roles/${role.slug}`} className="underline underline-offset-2">
                          {role.title}
                        </Link>
                      </span>
                    ))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
