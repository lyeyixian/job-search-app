import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { VaultStore } from "../vault/store.js";
import { type AppEnv, problem, problemContent } from "./problem.js";

export const HealthSchema = z
  .object({
    status: z.literal("ok"),
    vault: z.object({
      notes: z.int().openapi({ description: "The count of notes in the vault index.", example: 12 }),
      loadedAt: z.iso.datetime().openapi({
        description: "The time that the API built the vault index.",
        example: "2026-11-14T08:47:10.000Z",
      }),
    }),
  })
  .openapi("Health");

const getHealth = createRoute({
  method: "get",
  path: "/health",
  operationId: "getHealth",
  summary: "Check that the API answers and has a vault index",
  tags: ["Health"],
  responses: {
    200: {
      description: "The API has a vault index.",
      content: { "application/json": { schema: HealthSchema } },
    },
    503: {
      description: "The API has no vault index yet. Code `index_not_ready`.",
      content: problemContent,
    },
  },
});

export function healthRoutes(store: VaultStore) {
  return new OpenAPIHono<AppEnv>().openapi(getHealth, (c) => {
    const index = store.index;
    if (!index) {
      return problem(c, "index_not_ready", "The API has no vault index yet.");
    }
    return c.json(
      { status: "ok" as const, vault: { notes: index.notes.size, loadedAt: index.loadedAt.toISOString() } },
      200,
    );
  });
}
