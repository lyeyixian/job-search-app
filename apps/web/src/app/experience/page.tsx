import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getExperience, type ProjectSummary } from "@/api/client";
import { ApiProblem } from "@/components/api-problem";
import { PROJECT_KIND_LABEL } from "@/components/experience/labels";
import { RoleList } from "@/components/experience/role-list";
import { StoryList } from "@/components/experience/story-list";
import { Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import { months } from "@/lib/month";

export const metadata: Metadata = { title: "Experience" };

// The feature is docs/features/experience.md.
export default function ExperiencePage({ searchParams }: PageProps<"/experience">) {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-4xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Experience</h1>
        <Link
          href="/experience/skills"
          className="flex h-10 items-center rounded-md border px-3 text-sm hover:bg-secondary"
        >
          Skills inventory
        </Link>
      </div>
      <Suspense fallback={<p className="text-muted-foreground text-sm">Getting the experience.</p>}>
        <ExperienceData searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function Count({ count }: { count: number }) {
  return <span className="font-normal text-muted-foreground text-sm tabular-nums"> {count}</span>;
}

function Project({ project }: { project: ProjectSummary }) {
  const { slug, title, kind, start, end, onProfile } = project;
  return (
    <li
      data-testid="project-row"
      data-slug={slug}
      className="flex flex-col gap-1.5 border-t px-3 py-3 first:border-t-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
    >
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1.5">
        <Link
          href={`/experience/projects/${slug}`}
          data-testid="project-title"
          className="w-fit font-medium text-base underline underline-offset-2 sm:text-sm"
        >
          {title}
        </Link>
        <span className="text-muted-foreground text-sm" data-testid="project-kind">
          {kind ? PROJECT_KIND_LABEL[kind] : "No kind"}
        </span>
        <span data-testid="project-resume">
          {onProfile ? (
            <Badge variant="outline" className="border-transparent bg-emerald-100 text-emerald-900">
              For a resume
            </Badge>
          ) : (
            <Badge variant="outline" className="border-foreground/40 border-dashed text-muted-foreground">
              Not for a resume
            </Badge>
          )}
        </span>
      </div>
      <p className="shrink-0 text-sm tabular-nums" data-testid="project-months">
        {months(start, end)}
      </p>
    </li>
  );
}

function one(value: string | string[] | undefined): string | undefined {
  return (Array.isArray(value) ? value[0] : value) || undefined;
}

// The experience is read on each request. Next.js does not prerender it.
async function ExperienceData({ searchParams }: Pick<PageProps<"/experience">, "searchParams">) {
  const competency = one((await searchParams).competency);
  const result = await getExperience();
  if (!result.ok) return <ApiProblem code={result.code} traceId={result.traceId} />;
  const { profile, roles, projects, stories } = result.data;
  const heading = "font-semibold text-lg tracking-tight";

  return (
    <>
      <section className="flex flex-col gap-3" aria-labelledby="profile-heading">
        <h2 id="profile-heading" className={heading}>
          Profile
        </h2>
        {profile ? (
          <div className="rounded-xl border p-3 sm:p-4" data-testid="profile">
            <Markdown>{profile.body}</Markdown>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm" data-testid="profile-empty">
            The vault has no profile.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="roles-heading">
        <h2 id="roles-heading" className={heading}>
          Roles
          <Count count={roles.reduce((count, role) => count + 1 + role.stints.length, 0)} />
        </h2>
        {roles.length === 0 ? (
          <p className="text-muted-foreground text-sm">The vault has no role note.</p>
        ) : (
          <RoleList roles={roles} />
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="projects-heading">
        <h2 id="projects-heading" className={heading}>
          Projects
          <Count count={projects.length} />
        </h2>
        {projects.length === 0 ? (
          <p className="text-muted-foreground text-sm">The vault has no project note.</p>
        ) : (
          <ul className="rounded-xl border" data-testid="project-list">
            {projects.map((project) => (
              <Project key={project.slug} project={project} />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="stories-heading">
        <h2 id="stories-heading" className={heading}>
          Stories
          <Count count={stories.length} />
        </h2>
        {stories.length === 0 ? (
          <p className="text-muted-foreground text-sm">The vault has no story.</p>
        ) : (
          <StoryList stories={stories} competency={competency} />
        )}
      </section>
    </>
  );
}
