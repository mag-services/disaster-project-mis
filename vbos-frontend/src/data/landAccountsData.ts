/**
 * Land Accounts: Physical Account (Opening, Additions, Reductions, Net change, Closing)
 * and Land Cover Change Matrix (transition from→to) by province.
 * Data is fetched from API via useLandAccounts(); static JSON is fallback.
 */
export const LAND_ACCOUNT_PROVINCES = [
  "Torba",
  "Sanma",
  "Penama",
  "Malampa",
  "Shefa",
  "Tafea",
] as const;

export const LAND_ACCOUNT_CATEGORIES = [
  "Water Bodies",
  "Grassland",
  "Mangrove",
  "Bareland",
  "Built Up",
  "Forest",
] as const;

export type LandAccountCategory = (typeof LAND_ACCOUNT_CATEGORIES)[number];

export interface PhysicalAccount {
  opening: Record<LandAccountCategory, number>;
  additions: Record<LandAccountCategory, number>;
  reductions: Record<LandAccountCategory, number>;
  net_change: Record<LandAccountCategory, number>;
  closing: Record<LandAccountCategory, number>;
}

export interface ChangeMatrix {
  [from: string]: Record<string, number>;
}

export interface ProvinceLandAccount {
  physical_account: PhysicalAccount;
  unit: string;
  change_matrix?: ChangeMatrix;
}

export interface LandAccountsData {
  provinces: Record<string, ProvinceLandAccount>;
}
