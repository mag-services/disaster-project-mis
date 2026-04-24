/**
 * Syncs tabular attribute filter with left panel selection.
 * When only ECCE is selected, KPIs, charts, and stats show only ECCE data.
 * When only Primary or Secondary is selected, same. No dropdown—selection drives display.
 */
import { useEffect } from "react";
import { useLayerStore } from "@/store/layer-store";
import { useViewStore } from "@/store/view-store";
import { useScenario } from "@/hooks/useScenario";

export function AttributeFilterSelect() {
  const scenario = useScenario();
  const {
    layers,
    setTabularAttributeFilter,
    getLayerMetadata,
  } = useLayerStore();
  const scenarioId = useViewStore((s) => s.scenarioId);

  useEffect(() => {
    if (!scenario.allowedLayerTypes.includes("tabular") || scenarioId === "climate") return;
    const layerIds = layers.split(",").filter(Boolean);
    const hasTabular = layerIds.some((l) => l.startsWith("t"));
    if (!hasTabular) return;

    const names = layerIds.map((id) => getLayerMetadata(id)?.name?.toLowerCase() ?? "");
    const hasEcce = names.some((n) => n === "ecce" || n?.includes("ecce"));
    const hasPrimary = names.some((n) => n?.includes("primary"));
    const hasSecondary = names.some((n) => n?.includes("secondary"));

    if (hasEcce && !hasPrimary && !hasSecondary) {
      setTabularAttributeFilter("ecce");
    } else if (hasPrimary && !hasEcce && !hasSecondary) {
      setTabularAttributeFilter("primary");
    } else if (hasSecondary && !hasEcce && !hasPrimary) {
      setTabularAttributeFilter("secondary");
    } else {
      setTabularAttributeFilter(null);
    }
  }, [layers, getLayerMetadata, scenario.allowedLayerTypes, scenarioId, setTabularAttributeFilter]);

  return null;
}
