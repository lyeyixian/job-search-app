import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { listApplications } from "../vault/applications.js";
import { DIRECTIONS, REGIONS, STATUSES, VERDICTS } from "../vault/schema.js";
import type { VaultStore } from "../vault/store.js";
import { type AppEnv, problem, problemContent } from "./problem.js";

const WarningSchema = z
  .object({
    field: z.string().openapi({ description: "The frontmatter key.", example: "verdict" }),
    problem: z.enum(["missing", "invalid"]).openapi({
      description:
        "`missing` if the note does not have the key. `invalid` if the vault's rules do not permit the value.",
    }),
  })
  .openapi("Warning", { description: "A field of a note that breaks the vault's rules." });

const brokenField = "`null` also if the field has a warning.";

export const ApplicationSummarySchema = z
  .object({
    slug: z
      .string()
      .openapi({ description: "The name of the application's folder.", example: "example-co-backend-engineer" }),
    company: z.string().nullable().openapi({ description: brokenField, example: "Example Co" }),
    title: z.string().nullable().openapi({ description: brokenField, example: "Backend Engineer" }),
    region: z.enum(REGIONS).nullable().openapi({ description: brokenField }),
    status: z.enum(STATUSES).nullable().openapi({ description: brokenField }),
    captured: z.iso
      .date()
      .nullable()
      .openapi({
        description: `The day that the application was made. ${brokenField}`,
        example: "2026-10-05",
      }),
    verdict: z
      .enum(VERDICTS)
      .nullable()
      .openapi({
        description: `\`null\` before the first fit analysis. ${brokenField}`,
      }),
    direction: z
      .enum(DIRECTIONS)
      .nullable()
      .openapi({
        description: `The direction check. \`null\` before the first fit analysis. ${brokenField}`,
      }),
    hasResume: z.boolean().openapi({ description: "True if the application has a tailored resume PDF." }),
    warnings: z.array(WarningSchema),
  })
  .openapi("ApplicationSummary");

export const ApplicationListSchema = z
  .object({
    applications: z.array(ApplicationSummarySchema).openapi({
      description:
        "The applications that match the query. The order is `strong-fit`, `good-fit`, `stretch`, `skip`, then no verdict. With the same verdict, the newest application is first.",
    }),
    choices: z
      .object({
        companies: z.array(z.string()),
        regions: z.array(z.enum(REGIONS)),
        verdicts: z.array(z.enum(VERDICTS)),
        directions: z.array(z.enum(DIRECTIONS)),
      })
      .openapi({ description: "The values that at least one application has. The query does not change them." }),
  })
  .openapi("ApplicationList");

// A value that no application has matches nothing. It is not an error.
const ApplicationQuerySchema = z.object({
  company: z.string().optional().openapi({ description: "Only applications of this company.", example: "Example Co" }),
  region: z.string().optional().openapi({ description: "Only applications in this region.", example: "sg" }),
  verdict: z.string().optional().openapi({ description: "Only applications with this verdict.", example: "good-fit" }),
  direction: z.string().optional().openapi({
    description: "Only applications with this direction check.",
    example: "aligned",
  }),
});

const getApplications = createRoute({
  method: "get",
  path: "/applications",
  operationId: "getApplications",
  summary: "List the applications, best fit first",
  tags: ["Applications"],
  request: { query: ApplicationQuerySchema },
  responses: {
    200: {
      description: "The applications that match every query parameter.",
      content: { "application/json": { schema: ApplicationListSchema } },
    },
    503: {
      description: "The API has no vault index yet. Code `index_not_ready`.",
      content: problemContent,
    },
  },
});

export function applicationRoutes(store: VaultStore) {
  return new OpenAPIHono<AppEnv>().openapi(getApplications, (c) => {
    const index = store.index;
    if (!index) {
      return problem(c, "index_not_ready", "The API has no vault index yet.");
    }
    return c.json(listApplications(index, c.req.valid("query")), 200);
  });
}
