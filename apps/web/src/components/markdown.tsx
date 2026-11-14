import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node.props as { children?: ReactNode }).children);
  }
  return "";
}

// A link in a note goes to a website. It opens in a new tab, so the app stays open.
const link: Components["a"] = ({ href, children }) => (
  <a href={href} target="_blank" rel="noreferrer">
    {children}
  </a>
);

/**
 * Shows the markdown of a note. Raw HTML in the note shows as text. `headingIds` gives an `id` to
 * each `###` heading whose text is a key, so that a link can open the page at that heading.
 */
export function Markdown({
  children,
  className,
  headingIds,
}: {
  children: string;
  className?: string;
  headingIds?: Record<string, string>;
}) {
  const components: Components = {
    a: link,
    h3: ({ children: heading }) => <h3 id={headingIds?.[textOf(heading).trim()]}>{heading}</h3>,
  };
  return (
    <div className={cn("note-text", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

/** Shows a short piece of markdown, such as a table cell, inside a line of text. */
export function InlineMarkdown({ children }: { children: string }) {
  return (
    <span className="note-text-inline">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: link, p: ({ children: text }) => <>{text}</> }}>
        {children}
      </ReactMarkdown>
    </span>
  );
}
