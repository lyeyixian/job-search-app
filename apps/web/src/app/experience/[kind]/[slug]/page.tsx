import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { type ExperienceNote, type ExperienceNoteKind, getExperienceNote } from "@/api/client";
import { ApiProblem } from "@/components/api-problem";
import { Fact } from "@/components/companies/fact";
import { AchievementList } from "@/components/experience/achievement-list";
import { competencyName, NOTE_KIND_LABEL, PROJECT_KIND_LABEL } from "@/components/experience/labels";
import { SkillChips } from "@/components/experience/skill-chips";
import { Markdown, RevisitMark } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import { months } from "@/lib/month";

type Props = PageProps<"/experience/[kind]/[slug]">;

function kindOf(kind: string): ExperienceNoteKind | null {
  return kind === "roles" || kind === "projects" || kind === "stories" ? kind : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kind, slug } = await params;
  const known = kindOf(kind);
  const result = known ? await getExperienceNote(known, slug) : null;
  return { title: result?.ok ? result.data.title : "Experience" };
}

// The feature is docs/features/experience.md.
export default function ExperienceNotePage({ params }: Props) {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col gap-5 p-4 sm:p-6">
      <Link href="/experience" className="text-muted-foreground text-sm hover:underline">
        All experience
      </Link>
      <Suspense fallback={<p className="text-muted-foreground text-sm">Getting the note.</p>}>
        <NoteData params={params} />
      </Suspense>
    </main>
  );
}

const facts = "grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-10";
const heading = "font-semibold text-lg tracking-tight";
const noteLink = "font-medium underline underline-offset-2";

/** The months of a role or a project, with a mark if a month waits for an update. */
function Months({ note, start, end }: { note: ExperienceNote; start: string | null; end: string | null }) {
  const revisit = note.revisits.find(({ field }) => field === "start" || field === "end");
  return (
    <Fact name="Months" testId="note-months">
      <span className="tabular-nums">{months(start, end)}</span>
      {revisit ? (
        <>
          {" "}
          <RevisitMark note={revisit.text} />
        </>
      ) : null}
    </Fact>
  );
}

function RoleFacts({ note, role }: { note: ExperienceNote; role: NonNullable<ExperienceNote["role"]> }) {
  return (
    <dl className={facts}>
      <Fact name="Company" testId="note-company">
        {role.company ?? "None"}
      </Fact>
      <Fact name="Title" testId="note-job-title">
        {role.jobTitle ?? "None"}
      </Fact>
      <Fact name="Team" testId="note-team">
        {role.team ?? "None"}
      </Fact>
      <Months note={note} start={role.start} end={role.end} />
      {role.programme ? (
        <Fact name="Programme" testId="note-programme">
          <Link href={`/experience/roles/${role.programme.slug}`} className={noteLink}>
            {role.programme.title}
          </Link>
        </Fact>
      ) : null}
    </dl>
  );
}

function ProjectFacts({ note, project }: { note: ExperienceNote; project: NonNullable<ExperienceNote["project"]> }) {
  return (
    <dl className={facts}>
      <Fact name="Kind" testId="note-kind">
        {project.kind ? PROJECT_KIND_LABEL[project.kind] : "None"}
      </Fact>
      <Months note={note} start={project.start} end={project.end} />
      <Fact name="Resume" testId="note-resume">
        {project.onProfile ? "Can go on a resume" : "Not for a resume"}
      </Fact>
      {project.link ? (
        <Fact name="Link" testId="note-link">
          <a href={project.link} target="_blank" rel="noreferrer" className={noteLink}>
            Open the project
          </a>
        </Fact>
      ) : null}
    </dl>
  );
}

function StoryFacts({ story }: { story: NonNullable<ExperienceNote["story"]> }) {
  return (
    <dl className="flex flex-col gap-3">
      <Fact name="Competencies" testId="note-competencies">
        {story.competencies.length === 0 ? (
          "None"
        ) : (
          <span className="flex flex-wrap gap-1.5">
            {story.competencies.map((competency) => (
              <Badge key={competency} variant="secondary" asChild>
                <Link href={`/experience?competency=${encodeURIComponent(competency)}`}>
                  {competencyName(competency)}
                </Link>
              </Badge>
            ))}
          </span>
        )}
      </Fact>
      <Fact name="Roles" testId="note-roles">
        {story.roles.length === 0 ? (
          "None"
        ) : (
          <span className="flex flex-col gap-1">
            {story.roles.map((role) => (
              <Link key={role.slug} href={`/experience/roles/${role.slug}`} className={`w-fit ${noteLink}`}>
                {role.title}
              </Link>
            ))}
          </span>
        )}
      </Fact>
    </dl>
  );
}

/** A list of links to notes, below the text of the note. */
function NoteLinks({
  id,
  title,
  testId,
  notes,
}: {
  id: string;
  title: string;
  testId: string;
  notes: { slug: string; title: string; href: string; detail?: string }[];
}) {
  if (notes.length === 0) return null;
  return (
    <section className="flex flex-col gap-2" aria-labelledby={id}>
      <h2 id={id} className={heading}>
        {title}
      </h2>
      <ul className="flex flex-col gap-1.5" data-testid={testId}>
        {notes.map((note) => (
          <li key={note.slug} className="text-sm">
            <Link href={note.href} className={noteLink}>
              {note.title}
            </Link>
            {note.detail ? <span className="text-muted-foreground"> · {note.detail}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

async function NoteData({ params }: Pick<Props, "params">) {
  const { kind: segment, slug } = await params;
  const kind = kindOf(segment);
  if (!kind) notFound();
  const result = await getExperienceNote(kind, slug);
  if (!result.ok) {
    if (result.code === "note_not_found") notFound();
    return <ApiProblem code={result.code} traceId={result.traceId} />;
  }
  const note = result.data;
  const { role, project, story } = note;
  const headingIds = Object.fromEntries(note.achievements.map(({ title, anchor }) => [title, anchor]));

  return (
    <>
      <div>
        <p className="text-muted-foreground text-sm" data-testid="note-kind-label">
          {NOTE_KIND_LABEL[kind]}
        </p>
        <h1 className="font-semibold text-2xl tracking-tight">{note.title}</h1>
      </div>
      {role ? <RoleFacts note={note} role={role} /> : null}
      {project ? <ProjectFacts note={note} project={project} /> : null}
      {story ? <StoryFacts story={story} /> : null}
      {kind === "stories" ? null : (
        <section className="flex flex-col gap-2" aria-labelledby="skills-heading">
          <h2 id="skills-heading" className="font-medium text-muted-foreground text-xs">
            Skills
          </h2>
          <SkillChips skills={note.skills} />
        </section>
      )}
      {note.achievements.length > 0 ? <AchievementList achievements={note.achievements} /> : null}
      <div data-testid="note-body">
        <Markdown headingIds={headingIds}>{note.body}</Markdown>
      </div>
      {role ? (
        <>
          <NoteLinks
            id="stints-heading"
            title="Stints of this programme"
            testId="note-stints"
            notes={role.stints.map((stint) => ({
              slug: stint.slug,
              title: stint.team ?? stint.title,
              href: `/experience/roles/${stint.slug}`,
              detail: months(stint.start, stint.end),
            }))}
          />
          <NoteLinks
            id="stories-heading"
            title="Stories from this role"
            testId="note-stories"
            notes={role.stories.map((item) => ({ ...item, href: `/experience/stories/${item.slug}` }))}
          />
        </>
      ) : null}
    </>
  );
}
