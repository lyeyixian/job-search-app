import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ResolvedLink } from "@/api/client";
import { NoteLink } from "@/components/note-link";
import { cn } from "@/lib/utils";

const REVISIT_TAG = "#revisit";

type MarkdownNode = { type: string; value?: string; children?: MarkdownNode[]; data?: Record<string, unknown> };

// `[[note]]`, `[[note#achievement]]` and `[[note|label]]`. In a table, the note writes the bar as `\|`.
const WIKILINK = /\[\[([^\]|#\\]+)(?:#([^\]|\\]+))?(?:\\?\|([^\]]*))?\]\]/g;

/**
 * A remark plugin. It puts a `wikilink` node in place of each `[[wikilink]]` in the text of a
 * note. The node holds the link as the link table of the API names it, and the label if the
 * writer gave one. A wikilink in code stays as it is.
 */
function remarkWikilinks() {
  const walk = (node: MarkdownNode) => {
    if (!node.children) return;
    node.children = node.children.flatMap((child) => {
      if (child.type !== "text" || !child.value?.includes("[[")) {
        walk(child);
        return [child];
      }
      const parts: MarkdownNode[] = [];
      let end = 0;
      for (const match of child.value.matchAll(WIKILINK)) {
        const [whole, target = "", anchor, label] = match;
        if (match.index > end) parts.push({ type: "text", value: child.value.slice(end, match.index) });
        const ref = anchor ? `${target.trim()}#${anchor.trim()}` : target.trim();
        parts.push({
          type: "wikilink",
          data: { hName: "a", hProperties: { dataWikilink: ref, dataLabel: label?.trim() ?? "" } },
          children: [{ type: "text", value: whole }],
        });
        end = match.index + whole.length;
      }
      if (end < child.value.length) parts.push({ type: "text", value: child.value.slice(end) });
      return parts;
    });
  };
  return (tree: MarkdownNode) => walk(tree);
}

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

type WikilinkProps = { "data-wikilink"?: string; "data-label"?: string };

/**
 * A link in the text of a note. A `[[wikilink]]` goes to the page of a note, by the link table
 * of the API. Each other link goes to a website. It opens in a new tab, so the app stays open.
 */
function linkWith(links: ResolvedLink[] | undefined): Components["a"] {
  return ({ href, children, ...props }) => {
    const { "data-wikilink": ref, "data-label": label } = props as WikilinkProps;
    if (ref === undefined) {
      return (
        <a href={href} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    }
    const found = links?.find((candidate) => candidate.ref === ref);
    // With no link table, the text stays as the note writes it.
    return found ? <NoteLink link={found} label={label || undefined} /> : <>{children}</>;
  };
}

const plugins = [remarkGfm, remarkRevisit, remarkWikilinks];

/**
 * Shows the markdown of a note. Raw HTML in the note shows as text. `headingIds` gives an `id` to
 * each `###` heading whose text is a key, so that a link can open the page at that heading. `links`
 * is the link table of the API for this text.
 */
export function Markdown({
  children,
  className,
  headingIds,
  links,
}: {
  children: string;
  className?: string;
  headingIds?: Record<string, string>;
  links?: ResolvedLink[] | undefined;
}) {
  const components: Components = {
    a: linkWith(links),
    h3: ({ children: heading }) => <h3 id={headingIds?.[textOf(heading).trim()]}>{heading}</h3>,
    mark: () => <RevisitMark />,
  };
  return (
    <div className={cn("note-text", className)}>
      <ReactMarkdown remarkPlugins={plugins} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

/** Shows a short piece of markdown, such as a table cell, inside a line of text. */
export function InlineMarkdown({ children, links }: { children: string; links?: ResolvedLink[] | undefined }) {
  return (
    <span className="note-text-inline">
      <ReactMarkdown
        remarkPlugins={plugins}
        components={{ a: linkWith(links), mark: () => <RevisitMark />, p: ({ children: text }) => <>{text}</> }}
      >
        {children}
      </ReactMarkdown>
    </span>
  );
}
