import { getDatasets } from "@/api/getDatasets";
import type { MapQueryPlan } from "@/types/mapQuery";
import type { DatasetType } from "@/types/api";
import { useLayerStore } from "@/store/layer-store";
import { useAreaStore } from "@/store/area-store";
import { useDateStore } from "@/store/date-store";
import { useUiStore } from "@/store/ui-store";
import { useViewStore } from "@/store/view-store";

const VIEW_TYPES: DatasetType[] = [
  "baseline",
  "estimated_damage",
  "aid_resources_needed",
  "estimate_financial_damage",
];

/**
 * Apply a server-validated {@link MapQueryPlan} to zustand map/layer state.
 * Map bounds follow province selection via existing Map `fitBounds` logic.
 */
export async function applyMapQueryPlan(plan: MapQueryPlan): Promise<void> {
  const scenario = plan.scenario === "climate" ? "climate" : "disaster";
  useViewStore.getState().setScenario(scenario);

  if (plan.cluster) {
    useUiStore.getState().setSelectedCluster(plan.cluster);
  }

  if (plan.view_type != null && VIEW_TYPES.includes(plan.view_type)) {
    useUiStore.getState().setSelectedViewType(plan.view_type);
  }

  if (plan.year && /^\d{4}$/.test(plan.year)) {
    useDateStore.getState().setYear(plan.year);
  }

  useAreaStore.getState().setProvinces(plan.provinces ?? []);
  useAreaStore.getState().setAcList(plan.area_councils ?? []);

  useLayerStore
    .getState()
    .setTabularAttributeFilter(plan.attribute_icontains ?? null);

  if (plan.tabular_dataset_id != null) {
    useLayerStore.getState().setTabularApiParams({
      provinces:
        plan.provinces && plan.provinces.length > 0 ? plan.provinces : undefined,
      area_councils:
        plan.area_councils && plan.area_councils.length > 0
          ? plan.area_councils
          : undefined,
      attribute: plan.attribute_icontains ?? undefined,
      value_gte:
        plan.value_gte != null && Number.isFinite(plan.value_gte)
          ? String(plan.value_gte)
          : undefined,
      value_lte:
        plan.value_lte != null && Number.isFinite(plan.value_lte)
          ? String(plan.value_lte)
          : undefined,
    });
  } else {
    useLayerStore.getState().setTabularApiParams(null);
  }

  const cluster = plan.cluster;
  if (cluster) {
    useViewStore.getState().setLayerPanelSwitching(true);
    try {
      const groups = await getDatasets(cluster, scenario);
      const datasets = groups.flatMap((g) => g.datasets);
      useLayerStore.getState().setAllDatasets(datasets);
    } finally {
      useViewStore.getState().setLayerPanelSwitching(false);
    }
  }

  const layerParts: string[] = [];
  if (plan.tabular_dataset_id != null) {
    layerParts.push(`t${plan.tabular_dataset_id}`);
  }
  for (const vid of plan.vector_layer_ids ?? []) {
    if (typeof vid === "number" && Number.isFinite(vid)) {
      layerParts.push(`v${vid}`);
    }
  }
  useLayerStore.getState().setLayers(layerParts.join(","));
}
