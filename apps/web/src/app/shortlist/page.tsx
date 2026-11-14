import type { Metadata } from "next";
import { Suspense } from "react";
import { type GetShortlistParams, getShortlist } from "@/api/client";
import { ApiProblem } from "@/components/api-problem";
import { ShortlistView } from "@/components/shortlist/shortlist";

export const metadata: Metadata = { title: "Shortlist" };

// The feature is docs/features/shortlist.md.
export default function ShortlistPage({ searchParams }: PageProps<"/shortlist">) {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-4 p-4 sm:p-6">
      <h1 className="font-semibold text-2xl tracking-tight">Shortlist</h1>
      <Suspense fallback={<p className="text-muted-foreground text-sm">Getting the shortlist.</p>}>
        <ShortlistData searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function one(value: string | string[] | undefined): string | undefined {
  return (Array.isArray(value) ? value[0] : value) || undefined;
}

// The shortlist is read on each request. Next.js does not prerender it.
async function ShortlistData({ searchParams }: Pick<PageProps<"/shortlist">, "searchParams">) {
  const query = await searchParams;
  const chosen: GetShortlistParams = {};
  const company = one(query.company);
  if (company) chosen.company = company;
  if (one(query.promoted) === "hide") chosen.promoted = "hide";

  const shortlist = await getShortlist(chosen);
  if (!shortlist.ok) return <ApiProblem code={shortlist.code} traceId={shortlist.traceId} />;
  return <ShortlistView shortlist={shortlist.data} chosen={chosen} />;
}
