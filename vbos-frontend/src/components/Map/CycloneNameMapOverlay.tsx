/**
 * Small overlay on the map showing the active cyclone/event name.
 * Appears in the top-left when a layer with cyclone_name is enabled.
 */
import { useLayerStore } from "@/store/layer-store";
import { LuWind } from "react-icons/lu";

export function CycloneNameMapOverlay() {
  const { layers, getLayerMetadata } = useLayerStore();
  const layerIds = layers ? layers.split(",").map((l) => l.trim()).filter(Boolean) : [];

  const activeCycloneLayer = layerIds.find((id) => {
    const meta = getLayerMetadata(id);
    return meta?.cyclone_name?.trim();
  });

  const metadata = activeCycloneLayer ? getLayerMetadata(activeCycloneLayer) : null;
  const cycloneName = metadata?.cyclone_name?.trim();

  if (!cycloneName) return null;

  return (
    <div
      className="absolute left-3 top-3 z-[400] flex items-center gap-2 rounded-md border border-border/80 bg-background/95 px-3 py-2 shadow-sm backdrop-blur-sm"
      role="status"
      aria-label={`Active event: ${cycloneName}`}
    >
      <LuWind className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-sm font-medium">{cycloneName}</span>
    </div>
  );
}
