/**
 * Climate dashboard modules. One module at a time — no mixing of content.
 */
export const CLIMATE_MODULES = [
  { id: "land_use", label: "Land Use / Land Cover Classification" },
  { id: "coastal", label: "Coastal changes" },
  { id: "flood_risk", label: "Assessing Flood Risk from Past Weather" },
  { id: "indicators", label: "Climate indicators" },
  { id: "marine_heat", label: "Marine heat waves" },
  { id: "coral_reef", label: "Coral reef mapping" },
  { id: "soil_health", label: "Soil health" },
] as const;

export type ClimateModuleId = (typeof CLIMATE_MODULES)[number]["id"];

/** Climate modules that have map layers (land_use, coastal). Others show "Coming soon". */
export const CLIMATE_MODULES_WITH_LAYERS: ClimateModuleId[] = ["land_use", "coastal"];

/** API cluster name for each climate module. Used when fetching datasets in Climate mode. */
export function getClusterForClimateModule(moduleId: ClimateModuleId): string {
  if (moduleId === "land_use") return "Land Accounts";
  if (moduleId === "coastal") return "Coastal Changes";
  return "Land Accounts"; // fallback for modules without layers (Coming soon)
}

/** Datasets to show per climate module. API filters by climate_module; we show all returned. Others show "Coming soon". */
export function isDatasetForClimateModule(
  moduleId: ClimateModuleId,
  _dataset: { dataType: string; name?: string; is_land_cover?: boolean }
): boolean {
  if (moduleId === "land_use" || moduleId === "coastal") {
    return true; // API returns only land_accounts or coastal_changes datasets
  }
  return false;
}
