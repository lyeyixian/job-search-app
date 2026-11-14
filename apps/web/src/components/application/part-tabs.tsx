"use client";

import { type KeyboardEvent, type ReactNode, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type Part = { id: string; label: string; content: ReactNode };

/**
 * The parts of a page as tabs. One selection shows a part, and the other parts are not on the
 * page, so the person does not scroll through them.
 */
export function PartTabs({ parts, first }: { parts: Part[]; first: string }) {
  const [selected, setSelected] = useState(first);
  const tabs = useRef(new Map<string, HTMLButtonElement>());
  const current = parts.find((part) => part.id === selected) ?? parts[0];

  function onKeyDown(event: KeyboardEvent) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    const index = parts.findIndex((part) => part.id === current?.id);
    const next = parts[(index + step + parts.length) % parts.length];
    if (next) {
      setSelected(next.id);
      tabs.current.get(next.id)?.focus();
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div role="tablist" aria-label="Parts of the application" className="flex gap-1 border-b" onKeyDown={onKeyDown}>
        {parts.map((part) => (
          <button
            key={part.id}
            ref={(element) => {
              if (element) tabs.current.set(part.id, element);
            }}
            type="button"
            role="tab"
            id={`tab-${part.id}`}
            aria-selected={part.id === current?.id}
            aria-controls={`part-${part.id}`}
            tabIndex={part.id === current?.id ? 0 : -1}
            onClick={() => setSelected(part.id)}
            className={cn(
              "-mb-px h-11 border-b-2 px-3 text-sm outline-none focus-visible:ring-2",
              part.id === current?.id
                ? "border-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {part.label}
          </button>
        ))}
      </div>
      {current ? (
        <section
          role="tabpanel"
          id={`part-${current.id}`}
          aria-labelledby={`tab-${current.id}`}
          data-testid={`part-${current.id}`}
          className="min-w-0"
        >
          {current.content}
        </section>
      ) : null}
    </div>
  );
}
