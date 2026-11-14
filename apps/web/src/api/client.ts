import { getHealth as fetchHealth, type Health } from "./generated";

export type { Health };

/**
 * The result of an API call. On a failure, `code` is the `code` of the problem response.
 * `api_unreachable` is the one code that Web makes itself, for an API that does not answer.
 */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; code: string; traceId?: string };

export async function getHealth(): Promise<ApiResult<Health>> {
  try {
    const response = await fetchHealth();
    if (response.status === 200) return { ok: true, data: response.data };
    return { ok: false, code: response.data.code, traceId: response.data.traceId };
  } catch {
    return { ok: false, code: "api_unreachable" };
  }
}
