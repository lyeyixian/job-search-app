import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { EXPERIENCE_KINDS, getExperienceNote } from "../vault/experience.js";
import type { VaultStore } from "../vault/store.js";
import { type AppEnv, problem, problemContent } from "./problem.js";

export const ExperienceNoteSchema = z
  .object({
    kind: z.enum(EXPERIENCE_KINDS),
    slug: z.string().openapi({ description: "The file name without `.md`.", example: "northwind-software-engineer" }),
    title: z.string().openapi({ example: "Software Engineer, Northwind Traders" }),
    body: z.string().openapi({ description: "The note without its title. Markdown." }),
    achievements: z
      .array(
        z.object({
          anchor: z.string().openapi({
            description: "The name that a reference uses after `#`.",
            example: "cut-build-time",
          }),
          title: z.string().openapi({ description: "The `###` heading.", example: "Cut build time" }),
        }),
      )
      .openapi({ description: "The achievements of the note, in the order of the note." }),
  })
  .openapi("ExperienceNote");

const getExperienceNoteRoute = createRoute({
  method: "get",
  path: "/experience/{kind}/{slug}",
  operationId: "getExperienceNote",
  summary: "Get a role note or a project note",
  tags: ["Experience"],
  request: {
    params: z.object({
      kind: z.enum(EXPERIENCE_KINDS).openapi({ param: { name: "kind", in: "path" } }),
      slug: z.string().openapi({ param: { name: "slug", in: "path" }, example: "northwind-software-engineer" }),
    }),
  },
  responses: {
    200: {
      description: "The note.",
      content: { "application/json": { schema: ExperienceNoteSchema } },
    },
    404: { description: "No note of that kind has the slug. Code `note_not_found`.", content: problemContent },
    503: { description: "The API has no vault index yet. Code `index_not_ready`.", content: problemContent },
  },
});

export function experienceRoutes(store: VaultStore) {
  return new OpenAPIHono<AppEnv>({
    // A kind that is not `roles` or `projects` names no note.
    defaultHook: (result, c) => {
      if (!result.success) return problem(c, "note_not_found", "No note has that kind and slug.");
    },
  }).openapi(getExperienceNoteRoute, (c) => {
    const index = store.index;
    if (!index) {
      return problem(c, "index_not_ready", "The API has no vault index yet.");
    }
    const { kind, slug } = c.req.valid("param");
    const note = getExperienceNote(index, kind, slug);
    if (!note) {
      return problem(c, "note_not_found", `No note in ${kind} has the slug ${slug}.`);
    }
    return c.json(note, 200);
  });
}
