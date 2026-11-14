import type { Metadata } from "next";
import { Suspense } from "react";
import { type GetApplicationsParams, getApplications } from "@/api/client";
import { ApiProblem } from "@/components/api-problem";
import { Board } from "@/components/board/board";

export const metadata: Metadata = { title: "Applications" };

export default function ApplicationsPage({ searchParams }: PageProps<"/applications">) {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-4 p-4 sm:p-6">
      <h1 className="font-semibold text-2xl tracking-tight">Applications</h1>
      <Suspense fallback={<p className="text-muted-foreground text-sm">Getting the applications.</p>}>
        <BoardData searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function one(value: string | string[] | undefined): string | undefined {
  return (Array.isArray(value) ? value[0] : value) || undefined;
}

// The board is read on each request. Next.js does not prerender it.
async function BoardData({ searchParams }: Pick<PageProps<"/applications">, "searchParams">) {
  const query = await searchParams;
  const chosen: GetApplicationsParams = {};
  for (const key of ["company", "region", "verdict", "direction"] as const) {
    const value = one(query[key]);
    if (value) chosen[key] = value;
  }

  const list = await getApplications(chosen);
  if (!list.ok) return <ApiProblem code={list.code} traceId={list.traceId} />;
  return <Board list={list.data} chosen={chosen} />;
}
