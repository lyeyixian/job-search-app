import Link from "next/link";
import type { ExperienceNote } from "@/api/client";

/** The skills of a note. Each skill goes to the notes that list it. */
export function SkillChips({ skills }: { skills: ExperienceNote["skills"] }) {
  if (skills.length === 0) return <p className="text-muted-foreground text-sm">None</p>;
  return (
    <ul className="flex flex-wrap gap-1.5" data-testid="note-skills">
      {skills.map(({ slug, name }) => (
        <li key={slug}>
          <Link
            href={`/experience/skills/${encodeURIComponent(slug)}`}
            className="flex min-h-8 items-center rounded-md border px-2.5 text-sm hover:bg-secondary"
          >
            {name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
