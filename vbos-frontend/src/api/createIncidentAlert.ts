import * as HTTP from "./http";

export interface CreateIncidentAlertInput {
  title: string;
  summary: string;
  type:
    | "earthquake"
    | "cyclone"
    | "flood"
    | "volcano"
    | "weather"
    | "hazard"
    | "wildfire"
    | "drought"
    | "operational";
  severity: "critical" | "high" | "medium" | "low" | "info";
  province_name?: string;
  area_council_name?: string;
  issued_at?: string;
  photo?: File | null;
}

export async function createIncidentAlert(input: CreateIncidentAlertInput): Promise<unknown> {
  const formData = new FormData();
  formData.append("title", input.title);
  formData.append("summary", input.summary);
  formData.append("type", input.type);
  formData.append("severity", input.severity);
  if (input.province_name) formData.append("province_name", input.province_name);
  if (input.area_council_name) formData.append("area_council_name", input.area_council_name);
  if (input.issued_at) formData.append("issued_at", input.issued_at);
  if (input.photo) formData.append("photo", input.photo);

  const response = await HTTP.postFormData("/api/v1/alerts/", formData);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const details = typeof err === "object" && err
      ? Object.values(err).flat().join(" ") || err.detail
      : "";
    throw new Error(String(details || `Incident alert request failed (${response.status})`));
  }
  return response.json();
}
