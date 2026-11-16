import Link from "next/link";
import type { ReactNode } from "react";
import type { NotePage, ResolvedLink } from "@/api/client";
import { cn } from "@/lib/utils";

/** The address of the page of a note. With `anchor`, the address opens the page at that achievement. */
export function pageHref(page: NotePage, anchor?: string | null): string {
  const hash = anchor ? `#${anchor}` : "";
  switch (page.kind) {
    case "applications":
      return `/applications/${page.slug}`;
    case "listings":
      return `/companies/${page.company}/listings/${page.slug}`;
    case "profile":
      return "/experience";
    case "skills":
      return "/experience/skills";
    case "direction":
      return "/search/direction";
    case "targets":
      return "/search/targets";
    default:
      return `/experience/${page.kind}/${page.slug}${hash}`;
  }
}

/**
 * A name of a note or an achievement that the vault does not have. Text with a mark, not a link.
 * `name` is the name as the note writes it.
 */
export function MissingLink({
  name,
  label,
  what = "note",
  testId = "missing-link",
}: {
  name: string;
  label?: string | undefined;
  what?: string;
  testId?: string;
}) {
  return (
    <span className="text-destructive" data-testid={testId} title={`The vault has no such ${what}`}>
      {label || <code className="font-mono text-[0.85em]">{name}</code>} (missing)
    </span>
  );
}

/**
 * One link of a note. A target with a page is a link with the title of the target, or with the
 * text that the writer gave. A missing target is text with a mark. A note with no page is text.
 */
export function NoteLink({
  link,
  label,
  className,
}: {
  link: ResolvedLink;
  label?: string | undefined;
  className?: string;
}): ReactNode {
  if (link.state === "missing" || (link.state === "found" && !link.page)) {
    return <MissingLink name={link.ref} label={label} what={link.ref.includes("#") ? "achievement" : "note"} />;
  }
  const text = label || link.title || link.ref;
  if (link.state !== "found" || !link.page) return <span data-testid="note-name">{text}</span>;
  return (
    <Link
      href={pageHref(link.page, link.anchor)}
      className={cn("font-medium underline underline-offset-2", className)}
      data-testid="note-link"
    >
      {text}
    </Link>
  );
}
