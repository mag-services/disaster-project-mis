import * as HTTP from "./http";
import type { LandAccountsData } from "@/data/landAccountsData";

const API_URL = "/api/v1/land-accounts/";

/** Fetch land accounts from API. Falls back to empty provinces if API unavailable. */
export async function getLandAccounts(): Promise<LandAccountsData> {
  const res = await HTTP.get(API_URL);
  if (!res.ok) {
    return { provinces: {} };
  }
  const data = (await res.json()) as LandAccountsData;
  return data?.provinces ? data : { provinces: {} };
}

/** Update land accounts (admin only). */
export async function updateLandAccounts(data: LandAccountsData): Promise<LandAccountsData> {
  const res = await HTTP.put(API_URL, data as unknown as Record<string, unknown>);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string })?.detail ?? "Failed to update land accounts");
  }
  return (await res.json()) as LandAccountsData;
}
