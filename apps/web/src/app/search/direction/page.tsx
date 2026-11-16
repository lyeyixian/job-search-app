import type { Metadata } from "next";
import { Suspense } from "react";
import { getDirection } from "@/api/client";
import { ApiProblem } from "@/components/api-problem";
import { competencyName } from "@/components/experience/labels";
import { BackToSearch, PlanNote } from "@/components/search/plan-note";
import { ReviewReminder } from "@/components/search/review-reminder";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Direction" };

// The feature is docs/features/direction-and-targets.md.
export default function DirectionPage() {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col gap-5 p-4 sm:p-6">
      <BackToSearch />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Getting the direction.</p>}>
        <DirectionData />
      </Suspense>
    </main>
  );
}

// The direction is read on each request. Next.js does not prerender it.
async function DirectionData() {
  const result = await getDirection();
  if (!result.ok) return <ApiProblem code={result.code} traceId={result.traceId} />;
  const direction = result.data;

  return (
    <PlanNote
      note={direction}
      top={
        <>
          {direction.updated ? <ReviewReminder updated={direction.updated} /> : null}
          <section className="flex flex-col gap-2" aria-labelledby="target-roles-heading">
            <h2 id="target-roles-heading" className="font-medium text-muted-foreground text-xs">
              Target roles
            </h2>
            {direction.targetRoles.length === 0 ? (
              <p className="text-sm">None</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5" data-testid="target-roles">
                {direction.targetRoles.map((role) => (
                  <li key={role}>
                    {/* `backend-engineer` as `Backend engineer`. */}
                    <Badge variant="secondary">{competencyName(role)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      }
    />
  );
}
