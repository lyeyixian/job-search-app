import matter from "gray-matter";
import type { Root } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

export type NoteLink = {
  /** The link target as the note writes it, without the label and the anchor. */
  target: string;
  /** The heading or achievement after `#`, if the link has one. */
  anchor: string | null;
};

export type Note = {
  /** Path from the vault root, with forward slashes. */
  path: string;
  /** The file name without `.md`. */
  slug: string;
  /** The `type` key of the frontmatter, or null if the note has none. */
  type: string | null;
  frontmatter: Record<string, unknown>;
  body: string;
  links: NoteLink[];
};

const WIKILINK = /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|[^\]]*)?\]\]/g;
const processor = unified().use(remarkParse);

/** Finds the wikilinks in a note body. Skips code blocks and inline code. */
export function findLinks(body: string): NoteLink[] {
  const tree = processor.parse(body) as Root;
  const links: NoteLink[] = [];
  visit(tree, "text", (node) => {
    for (const match of node.value.matchAll(WIKILINK)) {
      const target = match[1]?.trim();
      if (target) {
        links.push({ target, anchor: match[2]?.trim() ?? null });
      }
    }
  });
  return links;
}

/** Splits a note into frontmatter and body, and finds its links. */
export function parseNote(path: string, source: string): Note {
  const { data, content } = matter(source);
  const fileName = path.split("/").at(-1) ?? path;
  return {
    path,
    slug: fileName.replace(/\.md$/, ""),
    type: typeof data.type === "string" ? data.type : null,
    frontmatter: data,
    body: content,
    links: findLinks(content),
  };
}
