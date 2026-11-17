import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { logger } from "../logger.js";
import type { VaultIndex } from "../vault/load.js";
import type { VaultStore } from "../vault/store.js";
import { VaultPullError } from "../vault/sync.js";
import { countWarnings } from "../vault/warnings.js";
import { type AppEnv, problem, problemContent } from "./problem.js";

const VaultStateSchema = z
  .object({
    notes: z.int().openapi({ description: "The count of notes in the vault index.", example: 12 }),
    loadedAt: z.iso.datetime().openapi({
      description: "The time of the last update from the vault. The API built the vault index at this time.",
      example: "2026-11-14T08:47:10.000Z",
    }),
    commit: z.string().nullable().openapi({
      description: "The commit of the vault clone that the index shows. `null` if the vault is not a git clone.",
      example: "9fceb02d0ae598e95dc970b74767f19372d61af8",
    }),
  })
  .openapi("VaultState");

export const HealthSchema = z.object({ status: z.literal("ok"), vault: VaultStateSchema }).openapi("Health");

export const RefreshSchema = VaultStateSchema.extend({
  pulled: z.boolean().openapi({
    description:
      "`true` if the API ran `git pull`. `false` if the vault is not a git clone with a remote. Then the API only read the files again.",
  }),
}).openapi("Refresh");

function stateOf(index: VaultIndex) {
  return { notes: index.notes.size, loadedAt: index.loadedAt.toISOString(), commit: index.commit };
}

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

const refreshVault = createRoute({
  method: "post",
  path: "/refresh",
  operationId: "refreshVault",
  summary: "Get the newest saved vault and build the vault index again",
  description:
    "Runs `git pull` in the vault clone, reads each note and replaces the vault index in one step. If the pull fails, the old index stays.",
  tags: ["Health"],
  responses: {
    200: {
      description: "The API has a new vault index.",
      content: { "application/json": { schema: RefreshSchema } },
    },
    502: {
      description: "The pull failed, and the old vault index stays. Code `vault_pull_failed`.",
      content: problemContent,
    },
  },
});

export function healthRoutes(store: VaultStore) {
  return new OpenAPIHono<AppEnv>()
    .openapi(getHealth, (c) => {
      const index = store.index;
      if (!index) {
        return problem(c, "index_not_ready", "The API has no vault index yet.");
      }
      return c.json({ status: "ok" as const, vault: stateOf(index) }, 200);
    })
    .openapi(refreshVault, async (c) => {
      try {
        const index = await store.refresh();
        logger.info(
          { commit: index.commit, pulled: index.pulled, notes: index.notes.size, warnings: countWarnings(index) },
          "vault refreshed",
        );
        return c.json({ ...stateOf(index), pulled: index.pulled }, 200);
      } catch (error) {
        if (!(error instanceof VaultPullError)) throw error;
        // The reason is a line from git. It names the remote or the clone, not note content.
        logger.warn({ reason: error.reason }, "vault pull failed");
        return problem(c, "vault_pull_failed", "The pull of the vault clone failed. The old vault index stays.");
      }
    });
}
