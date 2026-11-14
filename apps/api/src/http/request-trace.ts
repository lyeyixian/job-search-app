import { context, propagation, SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import type { MiddlewareHandler } from "hono";
import { logger } from "../logger.js";
import type { AppEnv } from "./problem.js";

const tracer = trace.getTracer("job-search-api");

/**
 * Runs each request in a span and writes one log line for it.
 * The span continues the trace of the `traceparent` header, if the request has one.
 */
export const requestTrace: MiddlewareHandler<AppEnv> = async (c, next) => {
  const parent = propagation.extract(context.active(), c.req.raw.headers, {
    get: (headers, key) => headers.get(key) ?? undefined,
    keys: (headers) => [...headers.keys()],
  });
  const span = tracer.startSpan(
    `${c.req.method} ${c.req.path}`,
    { kind: SpanKind.SERVER, attributes: { "http.request.method": c.req.method, "url.path": c.req.path } },
    parent,
  );
  const started = performance.now();

  await context.with(trace.setSpan(parent, span), next);

  const status = c.res.status;
  const code = c.get("problemCode");
  span.setAttribute("http.response.status_code", status);
  if (status >= 500) span.setStatus({ code: SpanStatusCode.ERROR });
  span.end();

  logger[status >= 500 ? "error" : "info"]({
    traceId: span.spanContext().traceId,
    method: c.req.method,
    path: c.req.path,
    status,
    ...(code ? { code } : {}),
    ms: Math.round(performance.now() - started),
  });
};
