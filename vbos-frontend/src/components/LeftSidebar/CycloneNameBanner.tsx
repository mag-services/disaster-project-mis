/**
 * Displays the cyclone/event name when a layer with cyclone_name is active.
 * Shown in the left sidebar when Cyclone Intensity (or similar) layer is enabled.
 */
import { useLayerStore } from "@/store/layer-store";
import { LuWind } from "react-icons/lu";

export function CycloneNameBanner() {
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
    <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <LuWind className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Active event
        </p>
        <p className="truncate text-sm font-medium">{cycloneName}</p>
      </div>
    </div>
  );
}
