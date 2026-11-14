import { context, propagation } from "@opentelemetry/api";
import { log } from "@/lib/log";
import { apiUrl } from "./config";

/**
 * The fetch function of the generated client. It adds the address of the API, sends the trace
 * to the API and writes one log line for each call.
 */
export async function apiFetch<T>(path: string, options: RequestInit): Promise<T> {
  const headers = new Headers(options.headers);
  propagation.inject(context.active(), headers, {
    set: (carrier, key, value) => carrier.set(key, value),
  });

  const method = options.method ?? "GET";
  const started = performance.now();
  let response: Response;
  try {
    response = await fetch(new URL(path, apiUrl()), { ...options, headers, cache: "no-store" });
  } catch (error) {
    log("error", { method, path, code: "api_unreachable" });
    throw error;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  log(response.status >= 500 ? "error" : "info", {
    method,
    path,
    status: response.status,
    code: response.ok ? undefined : data.code,
    ms: Math.round(performance.now() - started),
  });
  return { data, status: response.status, headers: response.headers } as T;
}
