import { context, propagation } from "@opentelemetry/api";
import createClient, { type Middleware } from "openapi-fetch";
import { log } from "@/lib/log";
import { apiUrl } from "./config";
import type { components, paths } from "./schema";

export type Health = components["schemas"]["Health"];

/**
 * The result of an API call. On a failure, `code` is the `code` of the problem response.
 * `api_unreachable` is the one code that Web makes itself, for an API that does not answer.
 */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; code: string; traceId?: string };

const started = new WeakMap<Request, number>();

// Sends the trace to the API and writes one log line for each call.
const traceAndLog: Middleware = {
  onRequest({ request }) {
    propagation.inject(context.active(), request.headers, {
      set: (headers, key, value) => headers.set(key, value),
    });
    started.set(request, performance.now());
    return request;
  },
  async onResponse({ request, response }) {
    const code = response.ok ? undefined : ((await response.clone().json()) as { code?: string }).code;
    log(response.status >= 500 ? "error" : "info", {
      method: request.method,
      path: new URL(request.url).pathname,
      status: response.status,
      code,
      ms: Math.round(performance.now() - (started.get(request) ?? 0)),
    });
    return response;
  },
  onError({ request }) {
    log("error", { method: request.method, path: new URL(request.url).pathname, code: "api_unreachable" });
  },
};

function client() {
  const api = createClient<paths>({ baseUrl: apiUrl(), cache: "no-store" });
  api.use(traceAndLog);
  return api;
}

export async function getHealth(): Promise<ApiResult<Health>> {
  try {
    const { data, error } = await client().GET("/api/health");
    if (data) return { ok: true, data };
    return { ok: false, code: error.code, traceId: error.traceId };
  } catch {
    return { ok: false, code: "api_unreachable" };
  }
}
