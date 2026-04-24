import * as HTTP from "./http";
import {
  getOfflineDrafts,
  deleteOfflineDraft,
  type OfflineDraft,
} from "@/lib/offlineStorage";

const API_BASE = "/api/v1";

export type AreaSubmissionStatus = "draft" | "submitted" | "approved" | "rejected";

export interface AreaSubmissionItem {
  attribute: string;
  value: number;
}

export interface AreaSubmission {
  id: number;
  dataset: number;
  dataset_name: string;
  province: number;
  province_name: string;
  area_council: number | null;
  area_council_name: string | null;
  year: number;
  items: AreaSubmissionItem[];
  status: AreaSubmissionStatus;
  submitted_at: string | null;
  submitted_by: number;
  submitted_by_username: string;
  reviewed_by: number | null;
  reviewed_at: string | null;
  rejection_reason: string;
  created: string;
  updated: string;
}

export interface AreaAdminAreas {
  provinces: { id: number; name: string }[];
  area_councils: { id: number; name: string; province_id: number; province_name: string }[];
}

export interface CreateSubmissionPayload {
  dataset: number;
  province: number;
  area_council?: number | null;
  year: number;
  items: AreaSubmissionItem[];
}

export async function getAreaAdminAreas(): Promise<AreaAdminAreas> {
  const res = await HTTP.get(`${API_BASE}/area-submissions/areas/`);
  if (!res.ok) throw new Error("Failed to fetch area admin areas");
  return res.json();
}

export async function getAreaSubmissions(): Promise<AreaSubmission[]> {
  const res = await HTTP.get(`${API_BASE}/area-submissions/`);
  if (!res.ok) throw new Error("Failed to fetch area submissions");
  const data = await res.json();
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function getAreaSubmission(id: number): Promise<AreaSubmission> {
  const res = await HTTP.get(`${API_BASE}/area-submissions/${id}/`);
  if (!res.ok) throw new Error("Failed to fetch submission");
  return res.json();
}

export async function createAreaSubmission(
  payload: CreateSubmissionPayload,
): Promise<AreaSubmission> {
  const res = await HTTP.post(`${API_BASE}/area-submissions/`, payload as unknown as Record<string, unknown>);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create submission");
  }
  return res.json();
}

export async function updateAreaSubmission(
  id: number,
  payload: Partial<CreateSubmissionPayload>,
): Promise<AreaSubmission> {
  const res = await HTTP.patch(`${API_BASE}/area-submissions/${id}/`, payload);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update submission");
  }
  return res.json();
}

export async function submitAreaSubmission(id: number): Promise<AreaSubmission> {
  const res = await HTTP.post(`${API_BASE}/area-submissions/${id}/submit/`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to submit");
  }
  return res.json();
}

export async function approveAreaSubmission(id: number): Promise<AreaSubmission> {
  const res = await HTTP.post(`${API_BASE}/area-submissions/${id}/approve/`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to approve");
  }
  return res.json();
}

export async function rejectAreaSubmission(
  id: number,
  reason?: string,
): Promise<AreaSubmission> {
  const res = await HTTP.post(`${API_BASE}/area-submissions/${id}/reject/`, {
    rejection_reason: reason ?? "",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to reject");
  }
  return res.json();
}

/** Sync offline drafts to server. Returns number of drafts successfully synced. */
export async function syncOfflineDrafts(): Promise<number> {
  const drafts = await getOfflineDrafts();
  let synced = 0;
  for (const draft of drafts) {
    try {
      await createAreaSubmission(draft.payload);
      await deleteOfflineDraft(draft.id);
      synced++;
    } catch {
      // Keep in IndexedDB for next sync attempt
    }
  }
  return synced;
}

/** Local draft shaped like AreaSubmission for display in the list. */
export interface LocalDraftDisplay extends Omit<AreaSubmission, "id"> {
  id: string;
  status: "draft";
  dataset_name: string;
  province_name: string;
  area_council_name: string | null;
  isLocal: true;
}

export function offlineDraftToDisplay(
  draft: OfflineDraft,
  areas: AreaAdminAreas,
  datasets: { id: number; name: string }[],
): LocalDraftDisplay {
  const p = draft.payload;
  const province = areas.provinces.find((x) => x.id === p.province);
  const areaCouncil = p.area_council
    ? areas.area_councils.find((x) => x.id === p.area_council)
    : null;
  const dataset = datasets.find((d) => d.id === p.dataset);
  return {
    id: draft.id,
    dataset: p.dataset,
    dataset_name: draft.datasetName ?? dataset?.name ?? `Dataset ${p.dataset}`,
    province: p.province,
    province_name: draft.provinceName ?? province?.name ?? `Province ${p.province}`,
    area_council: p.area_council ?? null,
    area_council_name: draft.areaCouncilName ?? areaCouncil?.name ?? null,
    year: p.year,
    items: p.items,
    status: "draft",
    submitted_at: null,
    submitted_by: 0,
    submitted_by_username: "",
    reviewed_by: null,
    reviewed_at: null,
    rejection_reason: "",
    created: draft.createdAt,
    updated: draft.createdAt,
    isLocal: true,
  };
}
