import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const REVISIT_TAG = "#revisit";

type MarkdownNode = { type: string; value?: string; children?: MarkdownNode[]; data?: Record<string, unknown> };

/**
 * A remark plugin. It puts a mark in place of each `#revisit` tag in the text of a note. The tag
 * says that the text before it waits for an update. A tag in code stays as it is.
 */
function remarkRevisit() {
  const walk = (node: MarkdownNode) => {
    if (!node.children) return;
    node.children = node.children.flatMap((child) => {
      if (child.type !== "text" || !child.value?.includes(REVISIT_TAG)) {
        walk(child);
        return [child];
      }
      return child.value.split(REVISIT_TAG).flatMap((part, i) => {
        const text = part ? [{ type: "text", value: part }] : [];
        return i === 0 ? text : [{ type: "revisit", data: { hName: "mark" }, children: [] }, ...text];
      });
    });
  };
  return (tree: MarkdownNode) => walk(tree);
}

/** The mark at a text or a value that waits for an update. `note` says what waits, if the vault says it. */
export function RevisitMark({ note }: { note?: string | undefined }) {
  return (
    <mark
      data-testid="revisit-mark"
      title="This text waits for an update"
      className="box-decoration-clone rounded-md bg-amber-100 px-1.5 py-0.5 font-medium text-amber-900 text-xs"
    >
      Revisit{note ? `: ${note}` : ""}
    </mark>
  );
}

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
    mark: () => <RevisitMark />,
  };
  return (
    <div className={cn("note-text", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkRevisit]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

/** Shows a short piece of markdown, such as a table cell, inside a line of text. */
export function InlineMarkdown({ children }: { children: string }) {
  return (
    <span className="note-text-inline">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkRevisit]}
        components={{ a: link, mark: () => <RevisitMark />, p: ({ children: text }) => <>{text}</> }}
      >
        {children}
      </ReactMarkdown>
    </span>
  );
}
