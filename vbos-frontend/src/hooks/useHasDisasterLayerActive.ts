/**
 * Returns true when a disaster overlay layer (Cyclone Intensity, Volcano, Flood, etc.)
 * is active. When true, tabular choropleth is hidden from the map (right panel only).
 */
import { useLayerStore } from "@/store/layer-store";
import { DISASTER_LAYER_NAMES } from "@/config/disaster";

function isDisasterLayer(
  metadata: { name?: string; cyclone_name?: string | null } | undefined,
): boolean {
  if (!metadata) return false;
  const name = (metadata.name ?? "").trim();
  if (metadata.cyclone_name?.trim()) return true;
  return DISASTER_LAYER_NAMES.some(
    (d) => name.toLowerCase().includes(d.toLowerCase()),
  );
}

export function useHasDisasterLayerActive(): boolean {
  const { layers, getLayerMetadata } = useLayerStore();
  const activeIds = layers.split(",").filter(Boolean);
  return activeIds.some((id) => {
    if (!id.startsWith("v") && !id.startsWith("p")) return false;
    const meta = getLayerMetadata(id);
    return isDisasterLayer(meta);
  });
}
