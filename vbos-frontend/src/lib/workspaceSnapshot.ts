/**
 * Capture / restore DRMIS map + UI state to a JSON workspace file.
 */
import { getDatasets } from "@/api/getDatasets";
import type { ScenarioId } from "@/config/scenarios";
import {
  DRMIS_WORKSPACE_SCHEMA_VERSION,
  type DRMISWorkspaceV1,
  type PrimaryWorkspaceId,
} from "@/types/workspace";
import { useLayerStore } from "@/store/layer-store";
import { useViewStore } from "@/store/view-store";
import { useDateStore } from "@/store/date-store";
import { useAreaStore } from "@/store/area-store";
import { useMapStore } from "@/store/map-store";
import { useComparisonStore } from "@/store/comparison-store";
import { useUiStore } from "@/store/ui-store";
import type { DatasetType } from "@/types/api";

function inferClusterFromLayers(): string {
  const { layers, getLayerMetadata } = useLayerStore.getState();
  const ids = layers.split(",").map((s) => s.trim()).filter(Boolean);
  for (const id of ids) {
    const meta = getLayerMetadata(id);
    if (meta?.cluster) return meta.cluster;
  }
  return useUiStore.getState().selectedCluster ?? "";
}

function isScenarioId(x: unknown): x is ScenarioId {
  return (
    x === "disaster" ||
    x === "climate" ||
    x === "compare" ||
    x === "forecast" ||
    x === "risk" ||
    x === "planning"
  );
}

function isDatasetType(x: unknown): x is DatasetType {
  return (
    x === "baseline" ||
    x === "estimated_damage" ||
    x === "aid_resources_needed" ||
    x === "estimate_financial_damage"
  );
}

function isPrimaryWorkspace(x: unknown): x is PrimaryWorkspaceId {
  return x === "command-centre" || x === "operations";
}

/** Build a workspace JSON object from current client state. */
export function captureWorkspace(name?: string): DRMISWorkspaceV1 {
  const layer = useLayerStore.getState();
  const view = useViewStore.getState();
  const date = useDateStore.getState();
  const area = useAreaStore.getState();
  const map = useMapStore.getState();
  const cmp = useComparisonStore.getState();
  const ui = useUiStore.getState();
  const cluster = (ui.selectedCluster || inferClusterFromLayers()).trim();

  return {
    schemaVersion: DRMIS_WORKSPACE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    app: "drmis",
    name: name?.trim() || undefined,
    scenarioId: view.scenarioId,
    primaryWorkspace: ui.primaryWorkspace,
    shellNavId: ui.shellNavId,
    cluster,
    layers: layer.layers,
    selectedViewType: ui.selectedViewType,
    selectedClimateModule: ui.selectedClimateModule,
    year: date.year,
    provinces: [...area.provinces],
    acList: [...area.acList],
    tabularAttributeFilter: layer.tabularAttributeFilter,
    tabularApiParams: layer.tabularApiParams
      ? { ...layer.tabularApiParams }
      : null,
    map: {
      latitude: map.viewState.latitude,
      longitude: map.viewState.longitude,
      zoom: map.viewState.zoom,
      mapStyle: map.mapStyle,
      mapMode: map.mapMode,
    },
    compare: {
      enabled: cmp.comparisonMode,
      view: cmp.comparisonView,
      yearLeft: cmp.yearLeft,
      yearRight: cmp.yearRight,
    },
  };
}

export type ParseWorkspaceResult =
  | { ok: true; workspace: DRMISWorkspaceV1 }
  | { ok: false; error: string };

/** Parse and validate workspace JSON from a file or string. */
export function parseWorkspaceJson(raw: string): ParseWorkspaceResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: "File is not valid JSON." };
  }
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Workspace root must be an object." };
  }
  const o = data as Record<string, unknown>;
  if (o.app !== "drmis") {
    return { ok: false, error: "Not a DRMIS workspace file (missing app: drmis)." };
  }
  if (o.schemaVersion !== DRMIS_WORKSPACE_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Unsupported workspace version (got ${String(o.schemaVersion)}, need ${DRMIS_WORKSPACE_SCHEMA_VERSION}).`,
    };
  }
  if (!isScenarioId(o.scenarioId)) {
    return { ok: false, error: "Invalid or missing scenarioId." };
  }
  if (typeof o.layers !== "string") {
    return { ok: false, error: "Invalid layers (expected string)." };
  }
  if (!isPrimaryWorkspace(o.primaryWorkspace)) {
    return { ok: false, error: "Invalid primaryWorkspace." };
  }
  if (typeof o.shellNavId !== "string") {
    return { ok: false, error: "Invalid shellNavId." };
  }
  if (typeof o.cluster !== "string") {
    return { ok: false, error: "Invalid cluster." };
  }
  const st = o.selectedViewType;
  if (st != null && !isDatasetType(st)) {
    return { ok: false, error: "Invalid selectedViewType." };
  }
  if (typeof o.selectedClimateModule !== "string") {
    return { ok: false, error: "Invalid selectedClimateModule." };
  }
  if (typeof o.year !== "string") {
    return { ok: false, error: "Invalid year." };
  }
  if (!Array.isArray(o.provinces) || !o.provinces.every((p) => typeof p === "string")) {
    return { ok: false, error: "Invalid provinces array." };
  }
  if (!Array.isArray(o.acList) || !o.acList.every((p) => typeof p === "string")) {
    return { ok: false, error: "Invalid acList array." };
  }
  const m = o.map;
  if (!m || typeof m !== "object") {
    return { ok: false, error: "Invalid map object." };
  }
  const mo = m as Record<string, unknown>;
  if (
    typeof mo.latitude !== "number" ||
    typeof mo.longitude !== "number" ||
    typeof mo.zoom !== "number" ||
    typeof mo.mapStyle !== "string" ||
    (mo.mapMode !== "2d" && mo.mapMode !== "3d")
  ) {
    return { ok: false, error: "Invalid map fields." };
  }
  const c = o.compare;
  if (!c || typeof c !== "object") {
    return { ok: false, error: "Invalid compare object." };
  }
  const co = c as Record<string, unknown>;
  if (
    typeof co.enabled !== "boolean" ||
    (co.view !== "swipe" && co.view !== "delta") ||
    typeof co.yearLeft !== "string" ||
    typeof co.yearRight !== "string"
  ) {
    return { ok: false, error: "Invalid compare fields." };
  }
  let tabularAttributeFilter: string | null = null;
  if (o.tabularAttributeFilter != null) {
    if (typeof o.tabularAttributeFilter !== "string") {
      return { ok: false, error: "Invalid tabularAttributeFilter." };
    }
    tabularAttributeFilter = o.tabularAttributeFilter;
  }
  let tabularApiParams: DRMISWorkspaceV1["tabularApiParams"] = null;
  if (o.tabularApiParams != null) {
    if (typeof o.tabularApiParams !== "object") {
      return { ok: false, error: "Invalid tabularApiParams." };
    }
    const t = o.tabularApiParams as Record<string, unknown>;
    tabularApiParams = {
      provinces: Array.isArray(t.provinces)
        ? t.provinces.filter((x): x is string => typeof x === "string")
        : undefined,
      area_councils: Array.isArray(t.area_councils)
        ? t.area_councils.filter((x): x is string => typeof x === "string")
        : undefined,
      attribute: typeof t.attribute === "string" ? t.attribute : undefined,
      value_gte: typeof t.value_gte === "string" ? t.value_gte : undefined,
      value_lte: typeof t.value_lte === "string" ? t.value_lte : undefined,
    };
  }

  const workspace: DRMISWorkspaceV1 = {
    schemaVersion: DRMIS_WORKSPACE_SCHEMA_VERSION,
    exportedAt: typeof o.exportedAt === "string" ? o.exportedAt : new Date().toISOString(),
    app: "drmis",
    name: typeof o.name === "string" ? o.name : undefined,
    scenarioId: o.scenarioId,
    primaryWorkspace: o.primaryWorkspace,
    shellNavId: o.shellNavId,
    cluster: o.cluster,
    layers: o.layers,
    selectedViewType: st == null ? null : st,
    selectedClimateModule: o.selectedClimateModule,
    year: o.year,
    provinces: o.provinces as string[],
    acList: o.acList as string[],
    tabularAttributeFilter,
    tabularApiParams,
    map: {
      latitude: mo.latitude as number,
      longitude: mo.longitude as number,
      zoom: mo.zoom as number,
      mapStyle: mo.mapStyle as string,
      mapMode: mo.mapMode as "2d" | "3d",
    },
    compare: {
      enabled: co.enabled as boolean,
      view: co.view as "swipe" | "delta",
      yearLeft: co.yearLeft as string,
      yearRight: co.yearRight as string,
    },
  };

  return { ok: true, workspace };
}

/** Validate workspace object returned from API (same rules as JSON file). */
export function parseWorkspaceValue(data: unknown): ParseWorkspaceResult {
  try {
    return parseWorkspaceJson(JSON.stringify(data));
  } catch {
    return { ok: false, error: "Invalid workspace data." };
  }
}

function scenarioForDatasets(scenarioId: ScenarioId): "disaster" | "climate" | undefined {
  if (scenarioId === "climate") return "climate";
  if (scenarioId === "disaster" || scenarioId === "compare") return "disaster";
  return undefined;
}

/**
 * Apply a validated workspace: updates stores and URL. Refetches cluster datasets when possible.
 */
export async function applyWorkspace(workspace: DRMISWorkspaceV1): Promise<void> {
  const {
    setScenario,
    setLayerPanelSwitching,
  } = useViewStore.getState();
  const {
    setLayers,
    setAllDatasets,
    setTabularAttributeFilter,
    setTabularApiParams,
    setTabularLayerData,
  } = useLayerStore.getState();
  const { setYear } = useDateStore.getState();
  const { setProvinces, setAcList } = useAreaStore.getState();
  const { setViewState, setMapStyle, setMapMode, syncToUrl } = useMapStore.getState();
  const {
    setComparisonMode,
    setComparisonView,
    setYearLeft,
    setYearRight,
  } = useComparisonStore.getState();
  const {
    setPrimaryWorkspace,
    setShellNavId,
    setSelectedCluster,
    setSelectedViewType,
    setSelectedClimateModule,
  } = useUiStore.getState();

  setPrimaryWorkspace(workspace.primaryWorkspace);
  setShellNavId(workspace.shellNavId);

  setScenario(workspace.scenarioId);

  if (workspace.scenarioId === "compare" && workspace.compare.enabled) {
    setYearLeft(workspace.compare.yearLeft);
    setYearRight(workspace.compare.yearRight);
    setComparisonView(workspace.compare.view);
    setComparisonMode(true);
  } else {
    setComparisonMode(false);
  }

  setSelectedCluster(workspace.cluster);
  setSelectedViewType(workspace.selectedViewType);
  setSelectedClimateModule(workspace.selectedClimateModule);
  setYear(workspace.year);

  setTabularLayerData([]);
  setTabularAttributeFilter(workspace.tabularAttributeFilter);
  setTabularApiParams(workspace.tabularApiParams);

  setViewState({
    latitude: workspace.map.latitude,
    longitude: workspace.map.longitude,
    zoom: workspace.map.zoom,
  });
  setMapStyle(workspace.map.mapStyle);
  setMapMode(workspace.map.mapMode);

  const cluster = workspace.cluster.trim();
  const dsScenario = scenarioForDatasets(workspace.scenarioId);

  if (cluster && dsScenario) {
    setLayerPanelSwitching(true);
    try {
      const groups = await getDatasets(cluster, dsScenario);
      const datasets = groups.flatMap((g) => g.datasets);
      setAllDatasets(datasets);
    } catch {
      /* still apply layers; metadata may be incomplete until user picks cluster */
    } finally {
      setLayerPanelSwitching(false);
    }
  }

  setLayers(workspace.layers);

  setProvinces([...workspace.provinces]);
  if (workspace.acList.length > 0) {
    setAcList([...workspace.acList]);
  }

  syncToUrl();
}
