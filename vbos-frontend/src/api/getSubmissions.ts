import * as HTTP from "./http";

export type SubmissionStatus = "draft" | "submitted" | "approved" | "rejected";

export interface AreaSubmission {
  id: number;
  dataset: number;
  dataset_name: string;
  province: number;
  province_name: string;
  area_council: number | null;
  area_council_name: string | null;
  year: number;
  status: SubmissionStatus;
  submitted_at: string | null;
  submitted_by: number;
  submitted_by_username: string;
  reviewed_by: number | null;
  reviewed_at: string | null;
  rejection_reason: string;
  created: string;
  updated: string;
}

export interface SubmissionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AreaSubmission[];
}

export async function getRecentSubmissions(params: {
  status?: string;
  ordering?: string;
  limit?: number;
} = {}): Promise<SubmissionsResponse> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.ordering) qs.set("ordering", params.ordering);
  if (params.limit) qs.set("page_size", String(params.limit));

  const url = `/api/v1/area-submissions/${qs.toString() ? `?${qs.toString()}` : ""}`;
  const response = await HTTP.get(url);
  if (!response.ok) {
    throw new Error(`Submissions request failed (${response.status})`);
  }
  return response.json();
}
