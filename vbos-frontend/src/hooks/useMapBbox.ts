import { useState, useCallback, useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";

/** Vanuatu default bbox (minLon, minLat, maxLon, maxLat) for initial load before map ready. */
const DEFAULT_BBOX = "166,-21,170,-12";

/**
 * Returns the current map bounds as in_bbox query string (minLon,minLat,maxLon,maxLat).
 * Updates on moveend. Used for vector layer bbox filtering to avoid loading entire dataset.
 */
export function useMapBbox(): string {
  const map = useMap();
  const [bbox, setBbox] = useState(DEFAULT_BBOX);

  const updateBbox = useCallback(() => {
    if (!map) return;
    try {
      const b = map.getBounds();
      const w = b.getWest();
      const s = b.getSouth();
      const e = b.getEast();
      const n = b.getNorth();
      if (Number.isFinite(w) && Number.isFinite(s) && Number.isFinite(e) && Number.isFinite(n)) {
        setBbox(`${w},${s},${e},${n}`);
      }
    } catch {
      // Keep previous bbox if getBounds fails
    }
  }, [map]);

  useMapEvents({
    load: updateBbox,
    moveend: updateBbox,
  });

  useEffect(() => {
    updateBbox();
  }, [updateBbox]);

  return bbox;
}
