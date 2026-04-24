/**
 * Purely navigational mapping: risk-style labels → existing DRMIS routes (scenario, cluster,
 * climate module, compare). Adjust cluster name lists to match your API `/clusters/` names.
 *
 * NOTE: The three RAP types (estimated_damage, aid_resources_needed, estimate_financial_damage)
 * are cyclone-only outputs from the Quarto RAP tool. They appear under "Cyclone" below.
 * If other hazard RAPs are ever built (flood, volcano), add new entries here and a new
 * hazard_event model in the backend — do not reuse CycloneEvent.
 */
import type { DatasetType } from "@/types/api";
import type { ClimateModuleId } from "@/config/climate";
import type { ICluster } from "@/types/api";
import type { ScenarioId } from "@/config/scenarios";
import type { ActiveRiskSource } from "@/store/ui-store";

export type LayerBrowserTabId = "elements" | "risk_sources" | "contextual";

export const LAYER_BROWSER_TABS: { id: LayerBrowserTabId; label: string }[] = [
  { id: "elements", label: "Elements" },
  { id: "risk_sources", label: "Risk sources" },
  { id: "contextual", label: "Contextual" },
];

/** How to move the app when user picks a navigational row (no new backend entities). */
export type RiskNavTarget =
  | { type: "compare" }
  | { type: "climate"; moduleId: ClimateModuleId }
  | {
      type: "disaster";
      /** Prefer first name that exists on `clusters` (exact, case-insensitive). */
      clusterNames: string[];
      viewType?: DatasetType | null;
      /**
       * Sets activeRiskSource in ui-store. Only set for risk sources that unlock
       * RAP tabs (Damage, Resources, Financial) in the right sidebar.
       * null / omitted = clear risk source (Baseline only).
       */
      riskSource?: ActiveRiskSource;
    }
  | {
      /**
       * Expands into a sub-list of CycloneEvent records fetched from the API.
       * Clicking a specific event sets activeRiskSource: "cyclone" and
       * selectedCycloneEventId in ui-store, then jumps into disaster mode.
       */
      type: "cyclone_event_picker";
      clusterNames: string[];
    };

/** Small set of glyphs mapped to `react-icons/lu` in the layer browser UI */
export type NavGlyph =
  | "hourglass"
  | "activity"
  | "globe"
  | "waves"
  | "wind"
  | "cloudRain"
  | "mountain"
  | "sun"
  | "thermometerSun"
  | "thermometer"
  | "mapPinned"
  | "users"
  | "leaf"
  | "columns2";

export type RiskSourceEntry = {
  id: string;
  label: string;
  glyph: NavGlyph;
  target: RiskNavTarget;
};

export type RiskSourceGroup = {
  id: string;
  label: string;
  glyph: NavGlyph;
  entries: RiskSourceEntry[];
};

export const RISK_SOURCE_GROUPS: RiskSourceGroup[] = [
  {
    id: "chronic",
    label: "Chronic",
    glyph: "hourglass",
    entries: [
      {
        id: "acidification",
        label: "Acidification",
        glyph: "waves",
        target: { type: "climate", moduleId: "marine_heat" },
      },
    ],
  },
  {
    id: "acute",
    label: "Acute",
    glyph: "activity",
    entries: [
      {
        id: "coastal_flooding",
        label: "Coastal flooding",
        glyph: "waves",
        target: { type: "climate", moduleId: "coastal" },
      },
      {
        id: "cyclone",
        // Expands into a sub-list of cyclone events from the API.
        // Each event sets activeRiskSource: "cyclone" + selectedCycloneEventId.
        label: "Cyclone",
        glyph: "wind",
        target: {
          type: "cyclone_event_picker",
          clusterNames: [
            "Shelter",
            "Logistics",
            "Health",
            "Energy",
            "Education",
            "WASH",
            "Food security",
          ],
        },
      },
      {
        id: "fluvial_pluvial",
        label: "Fluvial and pluvial flooding",
        glyph: "cloudRain",
        target: { type: "climate", moduleId: "flood_risk" },
      },
      {
        id: "volcano",
        label: "Volcano",
        glyph: "mountain",
        target: {
          type: "disaster",
          clusterNames: ["Logistics", "Energy", "Emergency Telecommunications"],
          viewType: null,
        },
      },
    ],
  },
  {
    id: "climate_projections",
    label: "Climate projections",
    glyph: "globe",
    entries: [
      {
        id: "drought",
        label: "Drought",
        glyph: "sun",
        target: { type: "climate", moduleId: "indicators" },
      },
      {
        id: "heatwave",
        label: "Heatwave",
        glyph: "thermometerSun",
        target: { type: "climate", moduleId: "indicators" },
      },
      {
        id: "rainfall",
        label: "Rainfall",
        glyph: "cloudRain",
        target: { type: "climate", moduleId: "indicators" },
      },
      {
        id: "temperature",
        label: "Temperature",
        glyph: "thermometer",
        target: { type: "climate", moduleId: "indicators" },
      },
    ],
  },
];

export type ContextualEntry = {
  id: string;
  label: string;
  description?: string;
  glyph: NavGlyph;
  target: RiskNavTarget;
};

/** Baselines / admin-style entry points — cluster lists are fallbacks if present in API. */
export const CONTEXTUAL_ENTRIES: ContextualEntry[] = [
  {
    id: "admin_boundaries",
    label: "Administrative boundaries",
    description: "Provinces and area councils where available",
    glyph: "mapPinned",
    target: {
      type: "disaster",
      clusterNames: ["Administrative", "Business"],
    },
  },
  {
    id: "baseline_exposure",
    label: "Baseline & exposure",
    description: "Sector baselines and population-style indicators",
    glyph: "users",
    target: {
      type: "disaster",
      clusterNames: ["Gender & Protection", "Health", "Education"],
      viewType: "baseline",
    },
  },
  {
    id: "land_cover",
    label: "Land cover & land use",
    glyph: "leaf",
    target: { type: "climate", moduleId: "land_use" },
  },
  {
    id: "compare_years",
    label: "Compare years",
    description: "Swipe, deltas, and dual-year context",
    glyph: "columns2",
    target: { type: "compare" },
  },
];

export function pickClusterName(
  clusters: ICluster[] | undefined,
  names: string[],
): string | null {
  if (!clusters?.length || !names.length) return null;
  const lower = new Map(clusters.map((c) => [c.name.toLowerCase(), c.name]));
  for (const n of names) {
    const hit = lower.get(n.toLowerCase());
    if (hit) return hit;
  }
  return null;
}

export type ApplyRiskNavDeps = {
  clusters: ICluster[] | undefined;
  switchToMode: (id: ScenarioId) => void;
  setSelectedCluster: (v: string) => void;
  setSelectedClimateModule: (v: string) => void;
  setSelectedViewType: (v: DatasetType | null) => void;
  setActiveRiskSource: (v: ActiveRiskSource) => void;
  setSelectedCycloneEventId: (id: number | null) => void;
};

/**
 * Apply navigational jump. If no cluster matches, still switches scenario and clears view type
 * so the user picks a cluster from Elements.
 * Non-cyclone and climate/compare targets clear the active risk source so the right sidebar
 * reverts to Baseline-only.
 *
 * Note: `cyclone_event_picker` targets are NOT handled here — they expand in the UI as a
 * sub-accordion (see LayerBrowserBrowse). Use `applyCycloneEventNavigation` instead.
 */
export function applyRiskNavigation(
  target: RiskNavTarget,
  d: ApplyRiskNavDeps,
): void {
  if (target.type === "compare") {
    d.switchToMode("compare");
    d.setSelectedViewType(null);
    d.setActiveRiskSource(null);
    return;
  }
  if (target.type === "climate") {
    d.switchToMode("climate");
    d.setSelectedClimateModule(target.moduleId);
    d.setSelectedViewType(null);
    d.setActiveRiskSource(null);
    return;
  }
  if (target.type === "cyclone_event_picker") {
    // Handled by the accordion UI; calling this function for a picker target is a no-op
    // to avoid accidental state mutations.
    return;
  }
  d.switchToMode("disaster");
  const cluster = pickClusterName(d.clusters, target.clusterNames);
  if (cluster) d.setSelectedCluster(cluster);
  if (target.viewType !== undefined) {
    d.setSelectedViewType(target.viewType ?? null);
  }
  // Only unlock RAP tabs if this risk source explicitly provides them.
  d.setActiveRiskSource(target.riskSource ?? null);
}

/**
 * Apply navigation when a specific cyclone event is chosen from the event sub-accordion.
 * Sets the active risk source to "cyclone" and records the chosen event ID so that
 * TabularDatasetSelect can filter RAP datasets to that event only.
 */
export function applyCycloneEventNavigation(
  eventId: number,
  clusterNames: string[],
  d: ApplyRiskNavDeps,
): void {
  d.switchToMode("disaster");
  const cluster = pickClusterName(d.clusters, clusterNames);
  if (cluster) d.setSelectedCluster(cluster);
  d.setSelectedViewType("estimated_damage");
  d.setActiveRiskSource("cyclone");
  d.setSelectedCycloneEventId(eventId);
}
