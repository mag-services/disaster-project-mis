import * as HTTP from "./http";

export type AlertSource = "USGS" | "VMGD" | "GDACS" | "DRMIS";
export type AlertType =
  | "earthquake"
  | "cyclone"
  | "flood"
  | "volcano"
  | "weather"
  | "hazard"
  | "wildfire"
  | "drought"
  | "operational";
export type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";

export interface LiveAlert {
  id: string;
  source: AlertSource;
  title: string;
  summary: string;
  issued_at: string;
  type: AlertType;
  severity: AlertSeverity;
  url?: string;
  magnitude?: number | null;
}

export interface LiveAlertsResponse {
  alerts: LiveAlert[];
  /** Map of source name → "ok" or error string */
  sources: Record<string, string>;
  updated_at: string;
  count: number;
}

export async function getLiveAlerts(): Promise<LiveAlertsResponse> {
  const response = await HTTP.get("/api/v1/alerts/live/");
  if (!response.ok) {
    throw new Error(`Live alerts request failed (${response.status})`);
  }
  return response.json();
}
