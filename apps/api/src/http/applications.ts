import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { getApplication, listApplications, readResume } from "../vault/applications.js";
import { BRIDGING_ACTIONS, GRADES, REQUIREMENT_KINDS } from "../vault/fit.js";
import { DIRECTIONS, REGIONS, STATUSES, VERDICTS } from "../vault/schema.js";
import type { VaultStore } from "../vault/store.js";
import { type AppEnv, problem, problemContent } from "./problem.js";

export const WarningSchema = z
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

const SlugParamSchema = z.object({
  slug: z.string().openapi({
    param: { name: "slug", in: "path" },
    description: "The name of the application's folder.",
    example: "example-co-backend-engineer",
  }),
});

const EvidencePartSchema = z
  .discriminatedUnion("type", [
    z.object({ type: z.literal("text"), text: z.string() }).openapi("EvidenceText"),
    z
      .object({
        type: z.literal("achievement"),
        ref: z.string().openapi({
          description: "The reference as the fit analysis writes it.",
          example: "northwind-software-engineer#cut-build-time",
        }),
        slug: z.string().openapi({ example: "northwind-software-engineer" }),
        anchor: z.string().openapi({ example: "cut-build-time" }),
        note: z.enum(["roles", "projects"]).nullable().openapi({
          description: "The kind of the note. `null` if no role note or project note has the slug.",
        }),
        noteTitle: z.string().nullable().openapi({ example: "Software Engineer, Northwind Traders" }),
        title: z.string().nullable().openapi({
          description: "The heading of the achievement. `null` if the note has no such achievement.",
          example: "Cut build time",
        }),
      })
      .openapi("EvidenceAchievement"),
  ])
  .openapi("EvidencePart", { description: "A piece of an evidence cell: text, or a reference to an achievement." });

const RequirementSchema = z
  .object({
    requirement: z.string().openapi({ description: "Markdown." }),
    kind: z.enum(REQUIREMENT_KINDS).nullable(),
    kindNote: z.string().nullable().openapi({ description: "The rest of the kind cell, if it has more text." }),
    firmness: z.string().openapi({ description: "Markdown.", example: "likely-flexible: a years number" }),
    grade: z.enum(GRADES).nullable(),
    evidence: z.array(EvidencePartSchema),
  })
  .openapi("Requirement");

const GapSchema = z
  .object({
    kind: z.enum(REQUIREMENT_KINDS).nullable().openapi({ description: "The group that lists the gap." }),
    requirement: z.string().nullable().openapi({ description: "Markdown." }),
    grade: z.enum(GRADES).nullable(),
    action: z.enum(BRIDGING_ACTIONS).nullable().openapi({ description: "The bridging action." }),
    text: z.string().openapi({ description: "What to do. Markdown." }),
  })
  .openapi("Gap");

const FitAnalysisSchema = z
  .object({
    verdict: z.string().openapi({ description: "The reasons for the verdict. Markdown." }),
    direction: z.string().openapi({ description: "The reasons for the direction check. Markdown." }),
    requirements: z.array(RequirementSchema),
    gaps: z.array(GapSchema),
    gapsNote: z.string().openapi({
      description: "The text of the gaps part that is not a gap. Markdown.",
      example: "No gaps.",
    }),
  })
  .openapi("FitAnalysis");

export const ApplicationSchema = ApplicationSummarySchema.extend({
  url: z
    .url()
    .nullable()
    .openapi({
      description: `The posting on the job board. ${brokenField}`,
      example: "https://example.com/careers/1001",
    }),
  analyzed: z.iso
    .date()
    .nullable()
    .openapi({ description: `The day of the last fit analysis. ${brokenField}`, example: "2026-10-05" }),
  listing: z
    .object({
      company: z.string().openapi({ example: "example-co" }),
      slug: z.string().openapi({ example: "backend-engineer-1001" }),
      title: z.string().nullable().openapi({ description: "`null` if the vault has no such listing." }),
    })
    .nullable()
    .openapi({ description: "The listing that the application came from." }),
  posting: z.string().openapi({ description: "The posting, without the fit analysis. Markdown." }),
  fit: FitAnalysisSchema.nullable().openapi({ description: "`null` if the note has no fit analysis." }),
}).openapi("Application");

const indexNotReady = {
  description: "The API has no vault index yet. Code `index_not_ready`.",
  content: problemContent,
};

const getApplicationRoute = createRoute({
  method: "get",
  path: "/applications/{slug}",
  operationId: "getApplication",
  summary: "Get one application with its posting and its fit analysis",
  tags: ["Applications"],
  request: { params: SlugParamSchema },
  responses: {
    200: {
      description: "The application.",
      content: { "application/json": { schema: ApplicationSchema } },
    },
    404: { description: "No application has the slug. Code `note_not_found`.", content: problemContent },
    503: indexNotReady,
  },
});

const getResumeRoute = createRoute({
  method: "get",
  path: "/applications/{slug}/resume.pdf",
  operationId: "getApplicationResume",
  summary: "Get the tailored resume PDF of an application",
  tags: ["Applications"],
  request: { params: SlugParamSchema },
  responses: {
    200: {
      description: "The PDF file as the vault holds it.",
      content: { "application/pdf": { schema: z.string().openapi({ format: "binary" }) } },
    },
    404: {
      description:
        "Code `note_not_found` if no application has the slug. Code `resume_not_found` if the application has no resume.",
      content: problemContent,
    },
    503: indexNotReady,
  },
});

export function applicationRoutes(store: VaultStore) {
  return new OpenAPIHono<AppEnv>()
    .openapi(getApplications, (c) => {
      const index = store.index;
      if (!index) {
        return problem(c, "index_not_ready", "The API has no vault index yet.");
      }
      return c.json(listApplications(index, c.req.valid("query")), 200);
    })
    .openapi(getApplicationRoute, (c) => {
      const index = store.index;
      if (!index) {
        return problem(c, "index_not_ready", "The API has no vault index yet.");
      }
      const { slug } = c.req.valid("param");
      const application = getApplication(index, slug);
      if (!application) {
        return problem(c, "note_not_found", `No application has the slug ${slug}.`);
      }
      return c.json(application, 200);
    })
    .openapi(getResumeRoute, async (c) => {
      const index = store.index;
      if (!index) {
        return problem(c, "index_not_ready", "The API has no vault index yet.");
      }
      const { slug } = c.req.valid("param");
      if (!index.notes.has(`applications/${slug}/posting.md`)) {
        return problem(c, "note_not_found", `No application has the slug ${slug}.`);
      }
      const pdf = await readResume(store.vaultPath, index, slug);
      if (!pdf) {
        return problem(c, "resume_not_found", `The application ${slug} has no resume.`);
      }
      return c.body(new Uint8Array(pdf), 200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${slug}-resume.pdf"`,
      });
    });
}
