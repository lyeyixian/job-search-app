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
  /** Each frontmatter key whose line has a comment with the tag `#revisit`. */
  revisits: Revisit[];
};

/** A value in the frontmatter that waits for an update. */
export type Revisit = {
  /** The frontmatter key. */
  field: string;
  /** The comment without the tag. Can be empty. */
  text: string;
};

export const REVISIT_TAG = "#revisit";
const COMMENTED_KEY = /^([a-z][a-z0-9-]*):.*?\s(#.*)$/;

/** Finds the frontmatter lines that have a comment with the tag `#revisit`. The YAML parser drops comments. */
export function findRevisits(frontmatter: string): Revisit[] {
  const revisits: Revisit[] = [];
  for (const line of frontmatter.split("\n")) {
    const match = COMMENTED_KEY.exec(line);
    const comment = match?.[2] ?? "";
    if (!match?.[1] || !comment.includes(REVISIT_TAG)) continue;
    revisits.push({
      field: match[1],
      text: comment.replaceAll(REVISIT_TAG, "").replace(/^#/, "").replace(/\s+/g, " ").trim(),
    });
  }
  return revisits;
}

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
  const { data, content, matter: rawFrontmatter } = matter(source);
  const fileName = path.split("/").at(-1) ?? path;
  return {
    path,
    slug: fileName.replace(/\.md$/, ""),
    type: typeof data.type === "string" ? data.type : null,
    frontmatter: data,
    body: content,
    links: findLinks(content),
    revisits: findRevisits(rawFrontmatter ?? ""),
  };
}
