/**
 * When entering Disaster mode: remove raster layers (Land cover is Climate-only).
 * When entering Climate mode: keep layers; land cover auto-activates via useLandCoverRaster.
 */
import { useEffect, useRef } from "react";
import { useViewStore } from "@/store/view-store";
import { useLayerStore } from "@/store/layer-store";
import { useAuthStore } from "@/store/auth-store";

export function useClimateModeEffect() {
  const scenarioId = useViewStore((s) => s.scenarioId);
  const { setLayers, layers } = useLayerStore();
  const prevModeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!useAuthStore.getState().token) return;

    // Disaster & Compare: remove raster layers (land cover is Climate-only)
    if (scenarioId === "disaster" || scenarioId === "compare") {
      const current = layers.split(",").filter(Boolean);
      const hasRaster = current.some((l) => l.startsWith("r"));
      if (hasRaster) {
        const nonRaster = current.filter((l) => !l.startsWith("r"));
        setLayers(nonRaster.join(","));
      }
      prevModeRef.current = scenarioId;
      return;
    }

    prevModeRef.current = scenarioId;
  }, [scenarioId, setLayers, layers]);
}
