import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { noteLinks, notePath } from "../vault/links.js";
import { getDirection, getTargets } from "../vault/plan.js";
import type { VaultStore } from "../vault/store.js";
import { WarningSchema } from "./applications.js";
import { backlinks, links } from "./links.js";
import { type AppEnv, problem, problemContent } from "./problem.js";

const planNote = {
  title: z.string().openapi({ description: "The first `#` heading of the note.", example: "Direction" }),
  body: z.string().openapi({ description: "The note without its title. Markdown." }),
  updated: z
    .string()
    .regex(/^\d{4}-\d{2}(-\d{2})?$/)
    .nullable()
    .openapi({
      description:
        "The month or the day of the last change, as `YYYY-MM` or `YYYY-MM-DD`. `null` if the field has a warning.",
      example: "2026-10",
    }),
  sections: z
    .array(
      z
        .object({
          anchor: z.string().openapi({ example: "target-roles" }),
          title: z.string().openapi({ description: "The `##` heading.", example: "Target roles" }),
        })
        .openapi("Section"),
    )
    .openapi({ description: "The `##` headings of the note, in the order of the note." }),
  warnings: z.array(WarningSchema),
  links,
  backlinks,
};

export const DirectionSchema = z
  .object({
    ...planNote,
    targetRoles: z.array(z.string()).openapi({
      description: "The slugs of the target roles. Empty if the field has a warning.",
      example: ["backend-engineer", "platform-engineer"],
    }),
  })
  .openapi("Direction");

export const TargetsSchema = z
  .object({
    ...planNote,
    companies: z
      .array(
        z.object({
          text: z.string().openapi({ description: "The name as the targets write it.", example: "Example Co" }),
          slug: z
            .string()
            .openapi({ description: "The folder of the company in the market scan.", example: "example-co" }),
        }),
      )
      .openapi({
        description:
          "Each company that starts a list item or a table cell of the text, and that the market scan has. A company that the market scan does not have is not here.",
      }),
  })
  .openapi("Targets");

const notReady = { description: "The API has no vault index yet. Code `index_not_ready`.", content: problemContent };

const getDirectionRoute = createRoute({
  method: "get",
  path: "/search/direction",
  operationId: "getDirection",
  summary: "Get the direction of the search",
  tags: ["Search"],
  responses: {
    200: { description: "The direction.", content: { "application/json": { schema: DirectionSchema } } },
    404: { description: "The vault has no direction. Code `note_not_found`.", content: problemContent },
    503: notReady,
  },
});

const getTargetsRoute = createRoute({
  method: "get",
  path: "/search/targets",
  operationId: "getTargets",
  summary: "Get the targets of the search",
  tags: ["Search"],
  responses: {
    200: { description: "The targets.", content: { "application/json": { schema: TargetsSchema } } },
    404: { description: "The vault has no targets. Code `note_not_found`.", content: problemContent },
    503: notReady,
  },
});

export function planRoutes(store: VaultStore) {
  return new OpenAPIHono<AppEnv>()
    .openapi(getDirectionRoute, (c) => {
      const index = store.index;
      if (!index) {
        return problem(c, "index_not_ready", "The API has no vault index yet.");
      }
      const direction = getDirection(index);
      if (!direction) {
        return problem(c, "note_not_found", "The vault has no direction.");
      }
      return c.json({ ...direction, ...noteLinks(index, notePath.direction) }, 200);
    })
    .openapi(getTargetsRoute, (c) => {
      const index = store.index;
      if (!index) {
        return problem(c, "index_not_ready", "The API has no vault index yet.");
      }
      const targets = getTargets(index);
      if (!targets) {
        return problem(c, "note_not_found", "The vault has no targets.");
      }
      return c.json({ ...targets, ...noteLinks(index, notePath.targets) }, 200);
    });
}
