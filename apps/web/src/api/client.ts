import {
  type Application,
  type ApplicationList,
  type ApplicationSummary,
  type Company,
  type CompanyList,
  type CompanyListing,
  type CompanySummary,
  type EvidencePart,
  type ExperienceNote,
  type ExperienceNoteKind,
  type FitAnalysis,
  getApplication as fetchApplication,
  getApplications as fetchApplications,
  getCompanies as fetchCompanies,
  getCompany as fetchCompany,
  getExperienceNote as fetchExperienceNote,
  getHealth as fetchHealth,
  getListing as fetchListing,
  getShortlist as fetchShortlist,
  type Gap,
  type GetApplicationsParams,
  type GetShortlistParams,
  type Health,
  type Listing,
  type Problem,
  type Requirement,
  type Shortlist,
  type ShortlistListing,
} from "./generated";

export type {
  Application,
  ApplicationList,
  ApplicationSummary,
  Company,
  CompanyList,
  CompanyListing,
  CompanySummary,
  EvidencePart,
  ExperienceNote,
  ExperienceNoteKind,
  FitAnalysis,
  Gap,
  GetApplicationsParams,
  GetShortlistParams,
  Health,
  Listing,
  Requirement,
  Shortlist,
  ShortlistListing,
};

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

export function getApplication(slug: string): Promise<ApiResult<Application>> {
  return result(() => fetchApplication(slug));
}

export function getExperienceNote(kind: ExperienceNoteKind, slug: string): Promise<ApiResult<ExperienceNote>> {
  return result(() => fetchExperienceNote(kind, slug));
}

export function getShortlist(params?: GetShortlistParams): Promise<ApiResult<Shortlist>> {
  return result(() => fetchShortlist(params));
}

export function getCompanies(): Promise<ApiResult<CompanyList>> {
  return result(() => fetchCompanies());
}

export function getCompany(company: string): Promise<ApiResult<Company>> {
  return result(() => fetchCompany(company));
}

export function getListing(company: string, slug: string): Promise<ApiResult<Listing>> {
  return result(() => fetchListing(company, slug));
}
