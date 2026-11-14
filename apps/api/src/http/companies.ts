import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { getCompanies, getCompany, getListing, MODES } from "../vault/companies.js";
import { LISTING_STATES, TRIAGES } from "../vault/shortlist.js";
import type { VaultStore } from "../vault/store.js";
import { type AppEnv, problem, problemContent } from "./problem.js";
import { PromotionSchema, ShortlistListingSchema } from "./shortlist.js";

const day = (description: string, example: string) => z.iso.date().nullable().openapi({ description, example });

const TriageSchema = z.enum(TRIAGES).nullable().openapi({
  description: "`null` if the company index has a value that the vault's rules do not permit.",
  example: "shortlist",
});
const StateSchema = z.enum(LISTING_STATES).nullable().openapi({
  description: "`null` if the company index has a value that the vault's rules do not permit.",
  example: "open",
});
const ModeSchema = z.enum(MODES).nullable();

export const CompanyListSchema = z
  .object({
    companies: z
      .array(
        z
          .object({
            slug: z
              .string()
              .openapi({ description: "The folder of the company in the market scan.", example: "example-co" }),
            name: z.string().openapi({ example: "Example Co" }),
            mode: ModeSchema.openapi({ description: "`null` if the company is not on the watchlist." }),
            lastSwept: day(
              "The day in the watchlist. If the watchlist has none, the newest day of the sweep log.",
              "2026-10-20",
            ),
            openShortlisted: z.int().openapi({
              description: "The number of open listings with the triage `shortlist`.",
              example: 2,
            }),
            listings: z.int().openapi({ description: "The number of listings in the company index.", example: 4 }),
          })
          .openapi("CompanySummary"),
      )
      .openapi({ description: "Each company that has a listing index, in the order of the names." }),
  })
  .openapi("CompanyList");

const CompanyListingSchema = ShortlistListingSchema.extend({
  triage: TriageSchema,
  lastSeen: day("The day of the last sweep that found the listing.", "2026-10-20"),
  state: StateSchema,
}).openapi("CompanyListing");

export const CompanySchema = z
  .object({
    slug: z.string().openapi({ example: "example-co" }),
    name: z.string().openapi({ example: "Example Co" }),
    watchlist: z
      .object({
        mode: ModeSchema,
        lastSwept: day("The day of the last sweep.", "2026-10-20"),
        board: z.url().nullable().openapi({
          description: "The web address of the job board.",
          example: "https://example.com/careers",
        }),
        notes: z.string().openapi({ description: "The notes about the company, as markdown. Can be empty." }),
        pay: z.string().openapi({ description: "The note about the pay, as markdown. Can be empty." }),
        remote: z.string().openapi({ description: "The note about remote work, as markdown. Can be empty." }),
      })
      .nullable()
      .openapi({
        description:
          "What the watchlist says about the company, without the instructions for a sweep. `null` if the company is not on the watchlist.",
      }),
    sweeps: z.array(z.iso.date()).openapi({
      description: "The day of each sweep, newest first.",
      example: ["2026-10-20", "2026-10-08"],
    }),
    listings: z.array(CompanyListingSchema).openapi({
      description:
        "Each listing of the company. The order is `shortlist`, `maybe`, then `reject`. With the same triage, open listings are first, then the listing first seen most recently.",
    }),
  })
  .openapi("Company");

export const ListingSchema = z
  .object({
    company: z.string().openapi({ example: "example-co" }),
    companyName: z.string().openapi({ example: "Example Co" }),
    slug: z.string().openapi({ example: "backend-engineer-1001" }),
    title: z.string().openapi({ example: "Backend Engineer" }),
    region: z.string().nullable().openapi({
      description: "`sg`, `remote` or the slug of a different place.",
      example: "sg",
    }),
    level: z.string().openapi({ description: "The level label from the job board.", example: "Mid" }),
    firstSeen: day("The day of the first sweep that found the listing.", "2026-10-01"),
    url: z.url().nullable().openapi({
      description: "The web address of the listing on the job board.",
      example: "https://example.com/careers/1001",
    }),
    triage: TriageSchema,
    reason: z.string().openapi({ description: "The reason for the triage. One line." }),
    lastSeen: day("The day of the last sweep that found the listing.", "2026-10-20"),
    state: StateSchema,
    application: PromotionSchema,
    body: z.string().openapi({
      description: "The text of the listing as the job board had it, as markdown, without the title line.",
    }),
  })
  .openapi("Listing", {
    description:
      "One listing record. `triage`, `reason`, `lastSeen`, `state` and `application` come from the company index.",
  });

const company = z.string().openapi({
  param: { name: "company", in: "path" },
  description: "The folder of the company in the market scan.",
  example: "example-co",
});
const CompanyParamSchema = z.object({ company });
const ListingParamSchema = z.object({
  company,
  slug: z.string().openapi({
    param: { name: "slug", in: "path" },
    description: "The file name of the listing record without `.md`.",
    example: "backend-engineer-1001",
  }),
});

const notReady = { description: "The API has no vault index yet. Code `index_not_ready`.", content: problemContent };

const getCompaniesRoute = createRoute({
  method: "get",
  path: "/companies",
  operationId: "getCompanies",
  summary: "List the companies of the market scan",
  tags: ["Market scan"],
  responses: {
    200: {
      description: "Each company that has a listing index.",
      content: { "application/json": { schema: CompanyListSchema } },
    },
    503: notReady,
  },
});

const getCompanyRoute = createRoute({
  method: "get",
  path: "/companies/{company}",
  operationId: "getCompany",
  summary: "Get one company with its listings, its sweeps and its watchlist entry",
  tags: ["Market scan"],
  request: { params: CompanyParamSchema },
  responses: {
    200: { description: "The company.", content: { "application/json": { schema: CompanySchema } } },
    404: { description: "No company has the folder. Code `note_not_found`.", content: problemContent },
    503: notReady,
  },
});

const getListingRoute = createRoute({
  method: "get",
  path: "/companies/{company}/listings/{slug}",
  operationId: "getListing",
  summary: "Get one listing with its full text",
  tags: ["Market scan"],
  request: { params: ListingParamSchema },
  responses: {
    200: { description: "The listing.", content: { "application/json": { schema: ListingSchema } } },
    404: { description: "The company has no such listing. Code `note_not_found`.", content: problemContent },
    503: notReady,
  },
});

export function companyRoutes(store: VaultStore) {
  return new OpenAPIHono<AppEnv>()
    .openapi(getCompaniesRoute, (c) => {
      const index = store.index;
      if (!index) {
        return problem(c, "index_not_ready", "The API has no vault index yet.");
      }
      return c.json({ companies: getCompanies(index) }, 200);
    })
    .openapi(getCompanyRoute, (c) => {
      const index = store.index;
      if (!index) {
        return problem(c, "index_not_ready", "The API has no vault index yet.");
      }
      const { company: slug } = c.req.valid("param");
      const found = getCompany(index, slug);
      if (!found) {
        return problem(c, "note_not_found", `No company has the folder ${slug}.`);
      }
      return c.json(found, 200);
    })
    .openapi(getListingRoute, (c) => {
      const index = store.index;
      if (!index) {
        return problem(c, "index_not_ready", "The API has no vault index yet.");
      }
      const { company: folder, slug } = c.req.valid("param");
      const listing = getListing(index, folder, slug);
      if (!listing) {
        return problem(c, "note_not_found", `The company ${folder} has no listing with the slug ${slug}.`);
      }
      return c.json(listing, 200);
    });
}
