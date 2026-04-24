import * as HTTP from "./http";

export interface FieldChecksCountResponse {
  count: number;
}

export async function getFieldTeamsDeployedCount(): Promise<FieldChecksCountResponse> {
  const response = await HTTP.get("/api/v1/field-checks/?status=active&count=true");
  if (!response.ok) {
    throw new Error(`Field checks stats request failed (${response.status})`);
  }
  return response.json();
}
