import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getSkill } from "@/api/client";
import { ApiProblem } from "@/components/api-problem";
import { NOTE_KIND_LABEL } from "@/components/experience/labels";
import { months } from "@/lib/month";

type Props = PageProps<"/experience/skills/[skill]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getSkill((await params).skill);
  return { title: result.ok ? result.data.name : "Skill" };
}

// The feature is docs/features/experience.md.
export default function SkillPage({ params }: Props) {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col gap-5 p-4 sm:p-6">
      <Link href="/experience/skills" className="text-muted-foreground text-sm hover:underline">
        Skills inventory
      </Link>
      <Suspense fallback={<p className="text-muted-foreground text-sm">Getting the skill.</p>}>
        <SkillData params={params} />
      </Suspense>
    </main>
  );
}

async function SkillData({ params }: Pick<Props, "params">) {
  const result = await getSkill((await params).skill);
  if (!result.ok) {
    if (result.code === "note_not_found") notFound();
    return <ApiProblem code={result.code} traceId={result.traceId} />;
  }
  const { slug, name, category, notes } = result.data;

  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-sm">Skill</p>
        <h1 className="font-semibold text-2xl tracking-tight">{name}</h1>
        <p className="text-muted-foreground text-sm" data-testid="skill-category-name">
          {category ?? "Not in the inventory"} · <code className="font-mono text-[0.85em]">{slug}</code>
        </p>
      </div>
      <section className="flex flex-col gap-3" aria-labelledby="uses-heading">
        <h2 id="uses-heading" className="font-semibold text-lg tracking-tight">
          Where you used it
        </h2>
        {notes.length === 0 ? (
          <p className="text-sm" data-testid="skill-notes-empty">
            No role note or project note lists this skill.
          </p>
        ) : (
          <ul className="rounded-xl border">
            {notes.map((note) => (
              <li
                key={`${note.kind}/${note.slug}`}
                data-testid="skill-note"
                data-slug={note.slug}
                className="flex flex-col gap-1 border-t px-3 py-3 first:border-t-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
              >
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                  <Link
                    href={`/experience/${note.kind}/${note.slug}`}
                    className="font-medium text-base underline underline-offset-2 sm:text-sm"
                  >
                    {note.title}
                  </Link>
                  <span className="text-muted-foreground text-sm">{NOTE_KIND_LABEL[note.kind]}</span>
                </div>
                <p className="shrink-0 text-sm tabular-nums">{months(note.start, note.end)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
