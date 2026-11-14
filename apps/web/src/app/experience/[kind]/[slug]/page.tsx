import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getExperienceNote } from "@/api/client";
import { ApiProblem } from "@/components/api-problem";
import { Markdown } from "@/components/markdown";

// A plain view of a role note or a project note, so that evidence in a fit analysis has an
// achievement to open. The feature in docs/features/experience.md replaces it.
export default function ExperienceNotePage({ params }: PageProps<"/experience/[kind]/[slug]">) {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col gap-4 p-4 sm:p-6">
      <Suspense fallback={<p className="text-muted-foreground text-sm">Getting the note.</p>}>
        <NoteData params={params} />
      </Suspense>
    </main>
  );
}

async function NoteData({ params }: Pick<PageProps<"/experience/[kind]/[slug]">, "params">) {
  const { kind, slug } = await params;
  if (kind !== "roles" && kind !== "projects") notFound();
  const result = await getExperienceNote(kind, slug);
  if (!result.ok) {
    if (result.code === "note_not_found") notFound();
    return <ApiProblem code={result.code} traceId={result.traceId} />;
  }
  const note = result.data;
  const headingIds = Object.fromEntries(note.achievements.map(({ title, anchor }) => [title, anchor]));

  return (
    <>
      <div>
        <p className="text-muted-foreground text-sm">{kind === "roles" ? "Role" : "Project"}</p>
        <h1 className="font-semibold text-2xl tracking-tight">{note.title}</h1>
      </div>
      <Markdown headingIds={headingIds}>{note.body}</Markdown>
    </>
  );
}
