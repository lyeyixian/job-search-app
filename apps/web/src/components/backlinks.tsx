import Link from "next/link";
import type { Backlink } from "@/api/client";
import { pageHref } from "@/components/note-link";

const KIND_LABEL: Record<Backlink["page"]["kind"], string> = {
  roles: "Roles",
  projects: "Projects",
  stories: "Stories",
  applications: "Applications",
  listings: "Listings",
  profile: "Profile",
  skills: "Skills inventory",
};

/**
 * The notes that name the note of the page, grouped by kind. With a link to one achievement, the
 * note shows the name of that achievement. The feature is docs/features/links-between-notes.md.
 */
export function Backlinks({ backlinks }: { backlinks: Backlink[] }) {
  if (backlinks.length === 0) return null;
  // The API puts the notes of one kind together.
  const kinds = [...new Set(backlinks.map((backlink) => backlink.page.kind))];

  return (
    <section className="flex flex-col gap-3 border-t pt-4" aria-labelledby="backlinks-heading" data-testid="backlinks">
      <h2 id="backlinks-heading" className="font-semibold text-lg tracking-tight">
        Notes that point here
      </h2>
      {kinds.map((kind) => (
        <div key={kind} className="flex flex-col gap-1.5" data-testid="backlink-group" data-kind={kind}>
          <h3 className="font-medium text-muted-foreground text-xs">{KIND_LABEL[kind]}</h3>
          <ul className="flex flex-col gap-1.5">
            {backlinks
              .filter((backlink) => backlink.page.kind === kind)
              .map(({ page, title, achievements }) => (
                <li key={`${page.company}/${page.slug}`} className="text-sm" data-testid="backlink">
                  <Link href={pageHref(page)} className="font-medium underline underline-offset-2">
                    {title}
                  </Link>
                  {achievements.length > 0 ? (
                    <span className="text-muted-foreground" data-testid="backlink-achievements">
                      {" · "}
                      {achievements.map((achievement) => achievement.title).join(", ")}
                    </span>
                  ) : null}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
