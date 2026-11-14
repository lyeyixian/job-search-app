import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getApplications } from "@/api/client";
import { ApiProblem } from "@/components/api-problem";

// A placeholder, so that a card on the board has a page to open. The feature in
// docs/features/application-page.md replaces it, with its own endpoint.
export default function ApplicationPage({ params }: PageProps<"/applications/[slug]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4 sm:p-6">
      <Link href="/applications" className="text-muted-foreground text-sm hover:underline">
        Back to the board
      </Link>
      <Suspense fallback={<p className="text-muted-foreground text-sm">Getting the application.</p>}>
        <ApplicationData params={params} />
      </Suspense>
    </main>
  );
}

async function ApplicationData({ params }: Pick<PageProps<"/applications/[slug]">, "params">) {
  const { slug } = await params;
  const list = await getApplications();
  if (!list.ok) return <ApiProblem code={list.code} traceId={list.traceId} />;

  const application = list.data.applications.find((candidate) => candidate.slug === slug);
  if (!application) notFound();

  return (
    <>
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{application.title ?? "No title"}</h1>
        <p className="text-muted-foreground" data-testid="application-company">
          {application.company ?? "No company"}
        </p>
      </div>
      <p className="text-sm">The page of an application is not built yet.</p>
    </>
  );
}
