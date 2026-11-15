import { z } from "@hono/zod-openapi";
import { LINK_STATES, PAGE_KINDS } from "../vault/links.js";

const notePage = {
  kind: z.enum(PAGE_KINDS).openapi({ example: "roles" }),
  slug: z.string().openapi({
    description: "The file name without `.md`, or the folder name for an application.",
    example: "northwind-software-engineer",
  }),
  company: z.string().nullable().openapi({
    description: "The folder of the company. `null` if the note is not a listing.",
    example: null,
  }),
};
const NotePageSchema = z
  .object(notePage)
  .openapi("NotePage", { description: "The page of a note. Web makes the address from it." });

const AchievementRefSchema = z.object({
  anchor: z.string().openapi({ example: "cut-build-time" }),
  title: z.string().openapi({ example: "Cut build time" }),
});

export const ResolvedLinkSchema = z
  .object({
    ref: z.string().openapi({
      description: "The link as the note writes it, without the brackets and the label: `note` or `note#achievement`.",
      example: "northwind-software-engineer#cut-build-time",
    }),
    state: z.enum(LINK_STATES).openapi({
      description:
        "`found` if the target has a page. `missing` if the vault has no such note or no such achievement. `no-page` if the note exists and the app has no page for it, such as a journal file.",
    }),
    page: z.object(notePage).nullable().openapi({
      description: "The page of the target. Web makes the address from it. `null` if the state is not `found`.",
    }),
    anchor: z.string().nullable().openapi({
      description: "The achievement that the link names. `null` if the link names a whole note.",
      example: "cut-build-time",
    }),
    title: z.string().nullable().openapi({
      description: "The title of the achievement or of the note. `null` if the state is `missing`.",
      example: "Cut build time",
    }),
  })
  .openapi("ResolvedLink", { description: "One `[[wikilink]]` of a note, resolved against the vault." });

export const BacklinkSchema = z
  .object({
    page: NotePageSchema,
    title: z.string().openapi({ example: "Backend Engineer, Example Co" }),
    achievements: z.array(AchievementRefSchema).openapi({
      description: "The achievements of this note that the other note names. Can be empty.",
    }),
  })
  .openapi("Backlink", { description: "A note that names the note of the response." });

/** The link table of the markdown in a response. */
export const links = z.array(ResolvedLinkSchema).openapi({
  description:
    "Each `[[wikilink]]` in the markdown of this response, one time, with its target. The markdown keeps the links as the note writes them.",
});

/** The notes that name the note of a response. */
export const backlinks = z.array(BacklinkSchema).openapi({
  description:
    "Each note that names this note in its text, in its facts or in the evidence of its fit analysis. The notes of one kind are together, in the order of the titles.",
});
