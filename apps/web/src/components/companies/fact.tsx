import type { ReactNode } from "react";

/** One name and its value in a list of facts. */
export function Fact({ name, testId, children }: { name: string; testId: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground text-xs">{name}</dt>
      <dd className="text-sm" data-testid={testId}>
        {children}
      </dd>
    </div>
  );
}
