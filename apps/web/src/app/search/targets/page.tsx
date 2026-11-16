import type { Metadata } from "next";
import { Suspense } from "react";
import { getTargets } from "@/api/client";
import { ApiProblem } from "@/components/api-problem";
import { BackToSearch, PlanNote } from "@/components/search/plan-note";

export const metadata: Metadata = { title: "Targets" };

// The feature is docs/features/direction-and-targets.md.
export default function TargetsPage() {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col gap-5 p-4 sm:p-6">
      <BackToSearch />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Getting the targets.</p>}>
        <TargetsData />
      </Suspense>
    </main>
  );
}

// The targets are read on each request. Next.js does not prerender them.
async function TargetsData() {
  const result = await getTargets();
  if (!result.ok) return <ApiProblem code={result.code} traceId={result.traceId} />;
  return <PlanNote note={result.data} />;
}
