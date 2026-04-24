/**
 * Recommended default datasets per scenario.
 * Matched by name (case-insensitive) when no session to restore.
 */

/** Name patterns for Disaster mode – first match wins */
export const DISASTER_DEFAULT_PATTERNS = [
  "population",
  "cyclone",
  "exposure",
  "estimated damage",
  "aid resources",
];

/** Climate defaults: land cover (from useLandCoverRaster) + comparison 2020/2023 */
export const CLIMATE_DEFAULT_YEAR = "2023";
export const CLIMATE_COMPARISON_YEARS = { left: "2020", right: "2023" };

export function matchesDisasterPattern(name: string): boolean {
  const lower = name.toLowerCase();
  return DISASTER_DEFAULT_PATTERNS.some((p) => lower.includes(p));
}
