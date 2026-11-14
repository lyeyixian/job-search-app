import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  EXPERIENCE_KINDS,
  getExperienceNote,
  getOverview,
  getSkill,
  getSkills,
  PROJECT_KINDS,
} from "../vault/experience.js";
import type { VaultStore } from "../vault/store.js";
import { type AppEnv, problem, problemContent } from "./problem.js";

const month = (description: string, example: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .nullable()
    .openapi({ description, example });
const start = month("The first month, as `YYYY-MM`.", "2023-07");
const updated = z.string().nullable().openapi({
  description: "The month or the day of the last change to the note.",
  example: "2026-10",
});

const noteRef = {
  kind: z.enum(EXPERIENCE_KINDS),
  slug: z.string().openapi({ description: "The file name without `.md`.", example: "northwind-software-engineer" }),
  title: z.string().openapi({ example: "Software Engineer, Northwind Traders" }),
};
const NoteRefSchema = z.object(noteRef).openapi("NoteRef", { description: "A note that a different note names." });

const SkillSchema = z
  .object({
    slug: z.string().openapi({ example: "postgres" }),
    name: z.string().openapi({
      description: "The name in the skills inventory. The slug if the inventory does not have the skill.",
      example: "PostgreSQL",
    }),
  })
  .openapi("Skill");

const InventorySkillSchema = SkillSchema.extend({
  uses: z.int().openapi({
    description: "The number of role notes and project notes that list the skill.",
    example: 2,
  }),
}).openapi("InventorySkill");

const roleFacts = {
  company: z.string().nullable().openapi({ example: "Northwind Traders" }),
  jobTitle: z
    .string()
    .nullable()
    .openapi({ description: "The `title` key of the note.", example: "Software Engineer" }),
  team: z.string().nullable().openapi({ example: "Developer Tools" }),
  start,
  end: month("The last month. `null` for the current role.", "2024-10"),
};

const RoleSummarySchema = z
  .object({
    slug: z.string().openapi({ example: "northwind-software-engineer" }),
    title: z
      .string()
      .openapi({ description: "The title of the note.", example: "Software Engineer, Northwind Traders" }),
    ...roleFacts,
    programme: z.string().nullable().openapi({
      description: "The slug of the role note for the programme that this stint is part of.",
      example: "northwind-graduate-programme",
    }),
  })
  .openapi("RoleSummary");

const stints = z.array(RoleSummarySchema).openapi({
  description: "The stints of the programme, newest first. Empty if the role is not a programme.",
});

const projectFacts = {
  kind: z.enum(PROJECT_KINDS).nullable().openapi({
    description: "`null` if the note has a value that the vault's rules do not permit.",
    example: "side-project",
  }),
  start,
  end: month("The last month. `null` for a project that continues.", "2024-06"),
  onProfile: z.boolean().openapi({ description: "`true` if the project can go on a resume." }),
};

const storyFacts = {
  competencies: z.array(z.string()).openapi({ example: ["ownership", "technical-depth"] }),
  roles: z.array(NoteRefSchema).openapi({
    description: "The role notes that the story comes from. A slug with no role note is not here.",
  }),
};

export const ExperienceOverviewSchema = z
  .object({
    profile: z
      .object({
        body: z.string().openapi({ description: "The profile without its title. Markdown." }),
        updated,
      })
      .nullable()
      .openapi({ description: "`null` if the vault has no profile." }),
    roles: z.array(RoleSummarySchema.extend({ stints }).openapi("RoleEntry")).openapi({
      description:
        "The role notes, newest first. A stint of a programme is in `stints` of the programme and not in this list.",
    }),
    projects: z
      .array(
        z
          .object({
            slug: z.string().openapi({ example: "recipe-box" }),
            title: z.string().openapi({ example: "Recipe box" }),
            ...projectFacts,
          })
          .openapi("ProjectSummary"),
      )
      .openapi({ description: "The project notes, newest first." }),
    stories: z
      .array(
        z
          .object({
            slug: z.string().openapi({ example: "slow-build" }),
            title: z.string().openapi({ example: "The slow build" }),
            ...storyFacts,
          })
          .openapi("StorySummary"),
      )
      .openapi({ description: "The stories, in the order of the titles." }),
  })
  .openapi("ExperienceOverview");

export const ExperienceNoteSchema = z
  .object({
    kind: z.enum(EXPERIENCE_KINDS),
    slug: z.string().openapi({ description: "The file name without `.md`.", example: "northwind-software-engineer" }),
    title: z.string().openapi({
      description:
        "The first `#` heading. If the note has none, a role note has its job title, its company and its team, and each other note has its slug as words.",
      example: "Software Engineer, Northwind Traders",
    }),
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
      .openapi({ description: "The achievements of the note, in the order of the note. Empty for a story." }),
    skills: z.array(SkillSchema).openapi({ description: "The skills that the note lists. Empty for a story." }),
    revisits: z
      .array(
        z.object({
          field: z.string().openapi({ description: "The frontmatter key.", example: "start" }),
          text: z
            .string()
            .openapi({ description: "The comment without the tag. Can be empty.", example: "exact month" }),
        }),
      )
      .openapi({
        description:
          "Each frontmatter key whose line has a comment with the tag `#revisit`. A tag in the text of the note stays in `body`.",
      }),
    role: z
      .object({
        ...roleFacts,
        programme: z.object(noteRef).nullable().openapi({
          description: "The programme that this stint is part of. `null` if the vault has no role note for it.",
        }),
        stints,
        stories: z.array(NoteRefSchema).openapi({ description: "The stories that come from the role." }),
      })
      .nullable()
      .openapi({ description: "The facts of a role note. `null` for each other kind." }),
    project: z
      .object({
        ...projectFacts,
        link: z.url().nullable().openapi({
          description: "The web address of the project.",
          example: "https://example.com/recipe-box",
        }),
      })
      .nullable()
      .openapi({ description: "The facts of a project note. `null` for each other kind." }),
    story: z
      .object(storyFacts)
      .nullable()
      .openapi({ description: "The facts of a story. `null` for each other kind." }),
  })
  .openapi("ExperienceNote");

export const SkillsInventorySchema = z
  .object({
    updated,
    pinned: z.string().openapi({
      description: "The `Pinned` section of the inventory, as markdown. Can be empty.",
    }),
    categories: z
      .array(
        z.object({
          name: z.string().openapi({ description: "The `##` heading.", example: "Languages" }),
          skills: z.array(InventorySkillSchema),
        }),
      )
      .openapi({ description: "The categories in the order of the inventory." }),
    unlisted: z.array(InventorySkillSchema).openapi({
      description: "The skills that a note lists and the inventory does not have.",
    }),
  })
  .openapi("SkillsInventory");

export const SkillUseSchema = SkillSchema.extend({
  category: z.string().nullable().openapi({
    description: "The category in the inventory. `null` if the inventory does not have the skill.",
    example: "Tools",
  }),
  notes: z
    .array(NoteRefSchema.extend({ start, end: month("The last month. `null` if the work continues.", "2024-10") }))
    .openapi({ description: "Each role note and project note that lists the skill, newest first." }),
}).openapi("SkillUse");

const notReady = { description: "The API has no vault index yet. Code `index_not_ready`.", content: problemContent };

const getExperienceRoute = createRoute({
  method: "get",
  path: "/experience",
  operationId: "getExperience",
  summary: "Get the profile and the lists of role notes, project notes and stories",
  tags: ["Experience"],
  responses: {
    200: { description: "The overview.", content: { "application/json": { schema: ExperienceOverviewSchema } } },
    503: notReady,
  },
});

const getSkillsRoute = createRoute({
  method: "get",
  path: "/experience/skills",
  operationId: "getSkills",
  summary: "Get the skills inventory",
  tags: ["Experience"],
  responses: {
    200: { description: "The inventory.", content: { "application/json": { schema: SkillsInventorySchema } } },
    503: notReady,
  },
});

const getSkillRoute = createRoute({
  method: "get",
  path: "/experience/skills/{skill}",
  operationId: "getSkill",
  summary: "Get one skill with each role note and project note that lists it",
  tags: ["Experience"],
  request: {
    params: z.object({
      skill: z.string().openapi({ param: { name: "skill", in: "path" }, example: "postgres" }),
    }),
  },
  responses: {
    200: { description: "The skill.", content: { "application/json": { schema: SkillUseSchema } } },
    404: {
      description: "The inventory does not have the skill, and no note lists it. Code `note_not_found`.",
      content: problemContent,
    },
    503: notReady,
  },
});

const getExperienceNoteRoute = createRoute({
  method: "get",
  path: "/experience/{kind}/{slug}",
  operationId: "getExperienceNote",
  summary: "Get a role note, a project note or a story",
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
    503: notReady,
  },
});

export function experienceRoutes(store: VaultStore) {
  return (
    new OpenAPIHono<AppEnv>({
      // A kind that is not a folder of experience notes names no note.
      defaultHook: (result, c) => {
        if (!result.success) return problem(c, "note_not_found", "No note has that kind and slug.");
      },
    })
      .openapi(getExperienceRoute, (c) => {
        const index = store.index;
        if (!index) {
          return problem(c, "index_not_ready", "The API has no vault index yet.");
        }
        return c.json(getOverview(index), 200);
      })
      .openapi(getSkillsRoute, (c) => {
        const index = store.index;
        if (!index) {
          return problem(c, "index_not_ready", "The API has no vault index yet.");
        }
        return c.json(getSkills(index), 200);
      })
      // This route is before the route of a note, so that `skills` is not read as a kind.
      .openapi(getSkillRoute, (c) => {
        const index = store.index;
        if (!index) {
          return problem(c, "index_not_ready", "The API has no vault index yet.");
        }
        const { skill: slug } = c.req.valid("param");
        const skill = getSkill(index, slug);
        if (!skill) {
          return problem(c, "note_not_found", `No note lists the skill ${slug}.`);
        }
        return c.json(skill, 200);
      })
      .openapi(getExperienceNoteRoute, (c) => {
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
      })
  );
}
