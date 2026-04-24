import * as HTTP from "./http";

export type AuditAction = 1 | 2 | 3; // 1=Added, 2=Changed, 3=Deleted

export interface AuditLogEntry {
  id: number;
  action_time: string;
  user: string | null;
  action: "Added" | "Changed" | "Deleted";
  action_flag: AuditAction;
  /** Raw content_type model name (e.g. "tabulardataset") */
  model: string | null;
  /** Human-readable model label (e.g. "Tabular Dataset") */
  model_display: string | null;
  object_id: string | null;
  object_repr: string | null;
  change_message: string;
}

export interface AuditLogResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLogEntry[];
}

export interface AuditLogParams {
  page?: number;
  page_size?: number;
  search?: string;
  /** 1=Added, 2=Changed, 3=Deleted */
  action?: string;
  user?: string;
  model?: string;
  date_from?: string;
  date_to?: string;
  format?: "csv";
}

export async function getAuditLog(params: AuditLogParams = {}): Promise<AuditLogResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.page_size) qs.set("page_size", String(params.page_size));
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.action) qs.set("action", params.action);
  if (params.user?.trim()) qs.set("user", params.user.trim());
  if (params.model?.trim()) qs.set("model", params.model.trim());
  if (params.date_from) qs.set("date_from", params.date_from);
  if (params.date_to) qs.set("date_to", params.date_to);
  if (params.format) qs.set("format", params.format);

  const url = `/api/v1/audit/${qs.toString() ? `?${qs.toString()}` : ""}`;
  const response = await HTTP.get(url);
  if (!response.ok) {
    if (response.status === 403) throw new Error("Access denied — staff account required.");
    throw new Error(`Audit log request failed (${response.status})`);
  }
  return response.json();
}

export async function getAuditLogCsv(params: Omit<AuditLogParams, "page" | "page_size"> = {}): Promise<Blob> {
  const qs = new URLSearchParams();
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.action) qs.set("action", params.action);
  if (params.user?.trim()) qs.set("user", params.user.trim());
  if (params.model?.trim()) qs.set("model", params.model.trim());
  if (params.date_from) qs.set("date_from", params.date_from);
  if (params.date_to) qs.set("date_to", params.date_to);
  qs.set("format", "csv");

  const url = `/api/v1/audit/?${qs.toString()}`;
  const response = await HTTP.get(url);
  if (!response.ok) {
    if (response.status === 403) throw new Error("Access denied — staff account required.");
    throw new Error(`Audit CSV export failed (${response.status})`);
  }
  return response.blob();
}
