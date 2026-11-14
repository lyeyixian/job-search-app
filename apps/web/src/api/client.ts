import {
  type ApplicationList,
  type ApplicationSummary,
  getApplications as fetchApplications,
  getHealth as fetchHealth,
  type GetApplicationsParams,
  type Health,
  type Problem,
} from "./generated";

export type { ApplicationList, ApplicationSummary, GetApplicationsParams, Health };

/**
 * The result of an API call. On a failure, `code` is the `code` of the problem response.
 * `api_unreachable` is the one code that Web makes itself, for an API that does not answer.
 */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; code: string; traceId?: string };

type ApiResponse<T> = { status: 200; data: T } | { status: number; data: Problem };

async function result<T>(call: () => Promise<ApiResponse<T>>): Promise<ApiResult<T>> {
  try {
    const response = await call();
    if (response.status === 200) return { ok: true, data: response.data as T };
    const problem = response.data as Problem;
    return { ok: false, code: problem.code, traceId: problem.traceId };
  } catch {
    return { ok: false, code: "api_unreachable" };
  }
}

export function getHealth(): Promise<ApiResult<Health>> {
  return result(() => fetchHealth());
}

export function getApplications(params?: GetApplicationsParams): Promise<ApiResult<ApplicationList>> {
  return result(() => fetchApplications(params));
}
