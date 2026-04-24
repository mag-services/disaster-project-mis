/**
 * Persists current view state to session store for smart restore on next visit.
 */
import { useEffect } from "react";
import { useLayerStore } from "@/store/layer-store";
import { useViewStore } from "@/store/view-store";
import { useDateStore } from "@/store/date-store";
import { useAreaStore } from "@/store/area-store";
import { useSessionStore } from "@/store/session-store";

export function useSessionSave() {
  const layers = useLayerStore((s) => s.layers);
  const scenarioId = useViewStore((s) => s.scenarioId);
  const year = useDateStore((s) => s.year);
  const provinces = useAreaStore((s) => s.provinces);
  const saveSession = useSessionStore((s) => s.saveSession);

  useEffect(() => {
    saveSession({ layers, scenarioId, year, province: provinces[0] ?? "" });
  }, [layers, scenarioId, year, provinces, saveSession]);
}
