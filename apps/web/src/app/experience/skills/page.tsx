import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getSkills, type SkillsInventory } from "@/api/client";
import { ApiProblem } from "@/components/api-problem";
import { Markdown } from "@/components/markdown";

export const metadata: Metadata = { title: "Skills inventory" };

// The feature is docs/features/experience.md.
export default function SkillsPage() {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-4xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <Link href="/experience" className="text-muted-foreground text-sm hover:underline">
        All experience
      </Link>
      <h1 className="font-semibold text-2xl tracking-tight">Skills inventory</h1>
      <Suspense fallback={<p className="text-muted-foreground text-sm">Getting the skills.</p>}>
        <SkillsData />
      </Suspense>
    </main>
  );
}

const heading = "font-semibold text-lg tracking-tight";

function Category({ name, skills }: { name: string; skills: SkillsInventory["unlisted"] }) {
  return (
    <section className="flex flex-col gap-2" data-testid="skill-category" data-category={name}>
      <h2 className={heading}>{name}</h2>
      <ul className="grid gap-x-6 sm:grid-cols-2">
        {skills.map(({ slug, name: skill, uses }) => (
          <li key={slug} data-testid="skill-row" data-skill={slug} className="border-t">
            <Link
              href={`/experience/skills/${encodeURIComponent(slug)}`}
              className="flex min-h-10 items-baseline justify-between gap-3 py-2 text-sm hover:bg-secondary"
            >
              <span className="min-w-0 underline underline-offset-2">{skill}</span>
              <span className="shrink-0 text-muted-foreground text-xs tabular-nums" data-testid="skill-uses">
                {uses === 0 ? "No note" : `${uses} ${uses === 1 ? "note" : "notes"}`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// The inventory is read on each request. Next.js does not prerender it.
async function SkillsData() {
  const result = await getSkills();
  if (!result.ok) return <ApiProblem code={result.code} traceId={result.traceId} />;
  const { pinned, categories, unlisted } = result.data;

  if (!pinned && categories.length === 0 && unlisted.length === 0) {
    return (
      <p className="text-sm" data-testid="skills-empty">
        The vault has no skills inventory.
      </p>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6" data-testid="skills-inventory">
      {pinned ? (
        <section
          className="flex flex-col gap-2 rounded-xl border bg-muted p-3 sm:p-4"
          data-testid="skills-pinned"
          aria-labelledby="pinned-heading"
        >
          <h2 id="pinned-heading" className={heading}>
            Pinned
          </h2>
          <Markdown>{pinned}</Markdown>
        </section>
      ) : null}
      {categories.map((category) => (
        <Category key={category.name} name={category.name} skills={category.skills} />
      ))}
      {unlisted.length > 0 ? (
        <div className="flex flex-col gap-2" data-testid="skills-unlisted">
          <Category name="Not in the inventory" skills={unlisted} />
          <p className="text-muted-foreground text-sm">
            A note lists each of these skills, and the inventory has no item for it.
          </p>
        </div>
      ) : null}
    </div>
  );
}
