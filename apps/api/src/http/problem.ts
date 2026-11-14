import { z } from "@hono/zod-openapi";
import { trace } from "@opentelemetry/api";
import type { Context } from "hono";

const DOCS = "https://github.com/lyeyixian/job-search-app/blob/main/docs/architecture/errors-and-logging.md";

/** Each code has a row in docs/architecture/errors-and-logging.md. */
export const problems = {
  route_not_found: { status: 404, title: "Route not found" },
  note_not_found: { status: 404, title: "Note not found" },
  resume_not_found: { status: 404, title: "Resume not found" },
  index_not_ready: { status: 503, title: "Index not ready" },
  internal_error: { status: 500, title: "Internal error" },
} as const;

export type ProblemCode = keyof typeof problems;

export const ProblemSchema = z
  .object({
    type: z.url().openapi({ example: `${DOCS}#index_not_ready` }),
    title: z.string().openapi({ example: "Index not ready" }),
    status: z.int().openapi({ example: 503 }),
    detail: z.string().openapi({ example: "The API has no vault index yet." }),
    code: z.string().openapi({
      description: "A stable name for the error. Clients decide what to do from this field.",
      example: "index_not_ready",
    }),
    traceId: z.string().openapi({ example: "4bf92f3577b34da6a3ce929d0e0e4736" }),
  })
  .openapi("Problem", { description: "An RFC 9457 Problem Details object with a `code`." });

export type Problem = z.infer<typeof ProblemSchema>;

export type AppEnv = { Variables: { problemCode?: ProblemCode } };

/** The `content` entry of an error response in a route definition. */
export const problemContent = {
  "application/problem+json": { schema: ProblemSchema },
};

export function problemBody(code: ProblemCode, detail: string): Problem {
  const { status, title } = problems[code];
  return {
    type: `${DOCS}#${code}`,
    title,
    status,
    detail,
    code,
    traceId: trace.getActiveSpan()?.spanContext().traceId ?? "",
  };
}

/** Builds a Problem Details response and records the code for the request log. */
export function problem<C extends ProblemCode>(c: Context<AppEnv>, code: C, detail: string) {
  c.set("problemCode", code);
  const status: (typeof problems)[C]["status"] = problems[code].status;
  return c.json(problemBody(code, detail), status, {
    "Content-Type": "application/problem+json",
  });
}
