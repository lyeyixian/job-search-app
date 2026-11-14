import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { STATUSES } from "../vault/schema.js";
import { getShortlist } from "../vault/shortlist.js";
import type { VaultStore } from "../vault/store.js";
import { WarningSchema } from "./applications.js";
import { type AppEnv, problem, problemContent } from "./problem.js";

export const PromotionSchema = z
  .object({
    slug: z.string().openapi({ example: "example-co-backend-engineer" }),
    found: z.boolean().openapi({ description: "False if the vault has no such application." }),
    status: z.enum(STATUSES).nullable().openapi({
      description: "`null` if the application does not exist or has no permitted status.",
    }),
  })
  .nullable()
  .openapi({ description: "The application that the listing was promoted to. `null` if it was not promoted." });

export const ShortlistListingSchema = z
  .object({
    company: z
      .string()
      .openapi({ description: "The folder of the company in the market scan.", example: "example-co" }),
    companyName: z.string().openapi({ example: "Example Co" }),
    slug: z.string().openapi({
      description: "The file name of the listing record without `.md`.",
      example: "backend-engineer-1001",
    }),
    title: z.string().openapi({ example: "Backend Engineer" }),
    level: z.string().openapi({ description: "The level label from the job board.", example: "Mid" }),
    reason: z.string().openapi({
      description: "The reason for the triage. One line.",
      example: "Backend work on developer tools",
    }),
    firstSeen: z.iso.date().nullable().openapi({
      description: "The day of the first sweep that found the listing. `null` if the row has a warning for it.",
      example: "2026-10-01",
    }),
    application: PromotionSchema,
    warnings: z.array(WarningSchema).openapi({ description: "`field` is the column of the company index." }),
  })
  .openapi("ShortlistListing");

export const ShortlistSchema = z
  .object({
    listings: z.array(ShortlistListingSchema).openapi({
      description:
        "The listings that match the query. The companies are in the order of their names. In a company, the listing first seen most recently is first.",
    }),
    total: z.int().openapi({
      description: "The number of open listings with the triage `shortlist`. The query does not change it.",
      example: 45,
    }),
    companies: z
      .array(
        z.object({
          slug: z.string().openapi({ example: "example-co" }),
          name: z.string().openapi({ example: "Example Co" }),
          count: z.int().openapi({ description: "The number of its listings on the shortlist.", example: 2 }),
        }),
      )
      .openapi({ description: "The companies with a listing on the shortlist. The query does not change them." }),
  })
  .openapi("Shortlist");

// A value that no listing has matches nothing. It is not an error.
const ShortlistQuerySchema = z.object({
  company: z.string().optional().openapi({
    description: "Only listings of this company. The value is the folder of the company.",
    example: "example-co",
  }),
  promoted: z.string().optional().openapi({
    description: "`hide` leaves out each listing that has an application. Each other value does nothing.",
    example: "hide",
  }),
});

const getShortlistRoute = createRoute({
  method: "get",
  path: "/shortlist",
  operationId: "getShortlist",
  summary: "List the open shortlisted listings of all companies",
  tags: ["Market scan"],
  request: { query: ShortlistQuerySchema },
  responses: {
    200: {
      description: "The open listings with the triage `shortlist` that match every query parameter.",
      content: { "application/json": { schema: ShortlistSchema } },
    },
    503: {
      description: "The API has no vault index yet. Code `index_not_ready`.",
      content: problemContent,
    },
  },
});

export function shortlistRoutes(store: VaultStore) {
  return new OpenAPIHono<AppEnv>().openapi(getShortlistRoute, (c) => {
    const index = store.index;
    if (!index) {
      return problem(c, "index_not_ready", "The API has no vault index yet.");
    }
    return c.json(getShortlist(index, c.req.valid("query")), 200);
  });
}
