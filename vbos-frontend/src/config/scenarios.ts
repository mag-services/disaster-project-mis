/**
 * Scenario Engine: unified configuration for view modes (Disaster, Climate, etc.).
 * Replaces scattered if (viewMode === "climate") with scenario-driven logic.
 */

export type ScenarioId =
  | "disaster"
  | "climate"
  | "compare"
  | "forecast"
  | "risk"
  | "planning";

export type LayerType = "tabular" | "vector" | "raster";

export type SidebarLayout = "standard" | "climate";

export interface ScenarioUiConfig {
  showStats: boolean;
  showComparison: boolean;
  sidebarLayout: SidebarLayout;
}

export interface Scenario {
  id: ScenarioId;
  label: string;
  allowedLayerTypes: LayerType[];
  /** Cluster types to show (e.g. "baseline"). Empty = all types. */
  allowedClusterTypes: string[];
  defaultLayers?: string[];
  uiConfig: ScenarioUiConfig;
}

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  disaster: {
    id: "disaster",
    label: "Disaster",
    allowedLayerTypes: ["tabular", "vector"],
    allowedClusterTypes: [],
    uiConfig: {
      showStats: true,
      showComparison: false,
      sidebarLayout: "standard",
    },
  },
  climate: {
    id: "climate",
    label: "Climate",
    allowedLayerTypes: ["vector", "raster"],
    allowedClusterTypes: ["baseline", "drivers"],
    uiConfig: {
      showStats: false,
      showComparison: true,
      sidebarLayout: "climate",
    },
  },
  /** Tabular / vector side-by-side compare (header “Compare” tab). */
  compare: {
    id: "compare",
    label: "Compare",
    allowedLayerTypes: ["tabular", "vector"],
    allowedClusterTypes: [],
    uiConfig: {
      showStats: true,
      showComparison: false,
      sidebarLayout: "standard",
    },
  },
  forecast: {
    id: "forecast",
    label: "Forecast",
    allowedLayerTypes: ["tabular", "vector", "raster"],
    allowedClusterTypes: [],
    uiConfig: {
      showStats: true,
      showComparison: false,
      sidebarLayout: "standard",
    },
  },
  risk: {
    id: "risk",
    label: "Risk",
    allowedLayerTypes: ["tabular", "vector", "raster"],
    allowedClusterTypes: [],
    uiConfig: {
      showStats: true,
      showComparison: false,
      sidebarLayout: "standard",
    },
  },
  planning: {
    id: "planning",
    label: "Planning",
    allowedLayerTypes: ["tabular", "vector", "raster"],
    allowedClusterTypes: [],
    uiConfig: {
      showStats: true,
      showComparison: false,
      sidebarLayout: "standard",
    },
  },
};

/** Primary map contexts (Resilience workspace); switched from Map data or shortcuts. */
export const ACTIVE_SCENARIOS: ScenarioId[] = ["disaster", "climate", "compare"];

export function getScenario(id: ScenarioId): Scenario {
  return SCENARIOS[id];
}

export function isLayerAllowed(scenario: Scenario, dataType: string): boolean {
  const normalized = dataType === "pmtiles" ? "vector" : dataType;
  return scenario.allowedLayerTypes.includes(normalized as LayerType);
}

export function isClusterTypeAllowed(scenario: Scenario, clusterType: string): boolean {
  if (scenario.allowedClusterTypes.length === 0) return true;
  return scenario.allowedClusterTypes.includes(clusterType);
}
