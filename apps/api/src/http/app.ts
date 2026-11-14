import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { logger } from "../logger.js";
import type { VaultStore } from "../vault/store.js";
import { applicationRoutes } from "./applications.js";
import { experienceRoutes } from "./experience.js";
import { healthRoutes } from "./health.js";
import { type AppEnv, problem } from "./problem.js";
import { requestTrace } from "./request-trace.js";

export const openApiInfo = {
  openapi: "3.1.0",
  info: {
    title: "Job search API",
    version: "0.1.0",
    description: "A REST API over the vault. Each error is an RFC 9457 Problem Details response with a `code`.",
  },
};

export function createApp(store: VaultStore) {
  const app = new OpenAPIHono<AppEnv>().basePath("/api");

  app.use(requestTrace);

  app.route("/", healthRoutes(store));
  app.route("/", applicationRoutes(store));
  app.route("/", experienceRoutes(store));

  app.doc31("/openapi.json", openApiInfo);
  app.get("/docs", Scalar({ url: "/api/openapi.json", pageTitle: "Job search API" }));

  app.notFound((c) => problem(c, "route_not_found", `No route matches ${c.req.method} ${c.req.path}.`));

  app.onError((error, c) => {
    // The stack names code, not note content.
    logger.error({ err: { name: error.name, stack: error.stack } }, "unhandled error");
    return problem(c, "internal_error", "The API failed to handle the request.");
  });

  return app;
}
