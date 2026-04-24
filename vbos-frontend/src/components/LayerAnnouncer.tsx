/**
 * Visually hidden live region that announces layer changes to screen readers.
 * Kept in DOM so aria-live updates are reliably announced.
 */
import { useEffect, useRef, useState } from "react";
import { useLayerStore } from "@/store/layer-store";

export function LayerAnnouncer() {
  const layers = useLayerStore((s) => s.layers);
  const getLayerMetadata = useLayerStore((s) => s.getLayerMetadata);
  const prevLayersRef = useRef<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const layerIds = layers
      ? layers.split(",").map((l) => l.trim()).filter(Boolean)
      : [];
    const prevLayers = prevLayersRef.current;
    const prevIds = prevLayers
      ? prevLayers.split(",").map((l) => l.trim()).filter(Boolean)
      : [];

    if (prevLayersRef.current === null) {
      prevLayersRef.current = layers;
      return;
    }

    const prevSet = new Set(prevIds);
    const currSet = new Set(layerIds);
    const added = layerIds.filter((id) => !prevSet.has(id));
    const removed = prevIds.filter((id) => !currSet.has(id));

    let message: string;
    const n = layerIds.length;

    if (n === 0) {
      message = "All datasets cleared.";
    } else if (added.length > 0 && removed.length === 0) {
      const names = added
        .map((id) => getLayerMetadata(id)?.name ?? `Layer ${id}`)
        .slice(0, 3);
      const more = added.length > 3 ? ` and ${added.length - 3} more` : "";
      message =
        added.length === 1
          ? `Added ${names[0]}. ${n} dataset${n === 1 ? "" : "s"} selected.`
          : `Added ${names.join(", ")}${more}. ${n} datasets selected.`;
    } else if (removed.length > 0 && added.length === 0) {
      const names = removed
        .map((id) => getLayerMetadata(id)?.name ?? `Layer ${id}`)
        .slice(0, 3);
      const more = removed.length > 3 ? ` and ${removed.length - 3} more` : "";
      message =
        removed.length === 1
          ? `Removed ${names[0]}. ${n} dataset${n === 1 ? "" : "s"} selected.`
          : `Removed ${names.join(", ")}${more}. ${n} datasets selected.`;
    } else if (added.length > 0 || removed.length > 0) {
      message = `Layers updated. ${n} dataset${n === 1 ? "" : "s"} selected.`;
    } else {
      prevLayersRef.current = layers;
      return;
    }

    prevLayersRef.current = layers;
    setAnnouncement(message);
    const id = setTimeout(() => setAnnouncement(""), 1500);
    return () => clearTimeout(id);
  }, [layers, getLayerMetadata]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
