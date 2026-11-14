"use client";

import { useState } from "react";
import type { ExperienceNote } from "@/api/client";

/**
 * The achievements of a note. Each one is a link to its heading on the page, with a button that
 * copies the address of the page at that achievement.
 */
export function AchievementList({ achievements }: { achievements: ExperienceNote["achievements"] }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(anchor: string) {
    const { origin, pathname } = window.location;
    try {
      await navigator.clipboard.writeText(`${origin}${pathname}#${anchor}`);
      setCopied(anchor);
    } catch {
      // A browser can refuse the clipboard. The link of the achievement still has the address.
      setCopied(null);
    }
  }

  return (
    <nav aria-labelledby="achievements-heading" className="flex flex-col gap-2 rounded-xl border p-3 sm:p-4">
      <h2 id="achievements-heading" className="font-medium text-muted-foreground text-xs">
        Achievements
      </h2>
      <ol className="flex flex-col">
        {achievements.map(({ anchor, title }) => (
          <li
            key={anchor}
            data-testid="achievement-item"
            data-anchor={anchor}
            className="flex items-center justify-between gap-3 border-t py-1 first:border-t-0"
          >
            <a href={`#${anchor}`} className="min-w-0 py-1.5 text-sm underline underline-offset-2">
              {title}
            </a>
            <button
              type="button"
              onClick={() => copy(anchor)}
              aria-label={`Copy the link to ${title}`}
              className="h-9 shrink-0 rounded-md border px-2.5 text-xs hover:bg-secondary"
            >
              {copied === anchor ? "Copied" : "Copy link"}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
