import * as HTTP from "./http";
import type { DRMISWorkspaceV1 } from "@/types/workspace";

const API_BASE = "/api/v1/workspaces";

/** Parse JSON error body from DRF (detail or wrapped validation errors). */
async function readApiErrorMessage(res: Response): Promise<string> {
  const fallback = res.statusText || `HTTP ${res.status}`;
  const text = await res.text();
  if (!text) return fallback;
  try {
    const body = JSON.parse(text) as Record<string, unknown>;
    if (typeof body.detail === "string") return body.detail;
    if (body.detail && typeof body.detail === "object")
      return JSON.stringify(body.detail);
    if (body.errors && typeof body.errors === "object")
      return JSON.stringify(body.errors);
  } catch {
    /* not JSON — e.g. Django HTML 500 page */
  }
  if (res.status >= 500 && text.length < 200 && !text.includes("<"))
    return text;
  if (res.status >= 500)
    return `${fallback}. If the backend was updated recently, run database migrations (e.g. datasets 0046_map_saved_workspace).`;
  return fallback;
}

export interface MapWorkspaceListItem {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface MapWorkspaceDetailResponse extends MapWorkspaceListItem {
  payload: DRMISWorkspaceV1;
}

function unwrapList(data: unknown): MapWorkspaceListItem[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "results" in data) {
    const r = (data as { results: unknown }).results;
    return Array.isArray(r) ? r : [];
  }
  return [];
}

export async function listMapWorkspaces(): Promise<MapWorkspaceListItem[]> {
  const res = await HTTP.get(`${API_BASE}/`);
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res));
  }
  const data: unknown = await res.json();
  return unwrapList(data);
}

export async function createMapWorkspace(
  name: string,
  payload: DRMISWorkspaceV1,
): Promise<MapWorkspaceListItem> {
  const res = await HTTP.post(`${API_BASE}/`, { name, payload });
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res));
  }
  return res.json() as Promise<MapWorkspaceListItem>;
}

export async function getMapWorkspace(id: number): Promise<DRMISWorkspaceV1> {
  const res = await HTTP.get(`${API_BASE}/${id}/`);
  if (!res.ok) throw new Error(res.statusText);
  const data = (await res.json()) as MapWorkspaceDetailResponse;
  return data.payload;
}

export async function deleteMapWorkspace(id: number): Promise<void> {
  const res = await HTTP._delete(`${API_BASE}/${id}/`);
  if (!res.ok) throw new Error(res.statusText);
}
