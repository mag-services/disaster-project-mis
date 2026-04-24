/**
 * Impact Mode: estimate affected population from hazard + population (+ infrastructure) data.
 * Sums population in areas where hazard/damage value > 0.
 */
import { useMemo } from "react";
import { useAreaStore } from "@/store/area-store";
import { useLayerStore } from "@/store/layer-store";
import { useDateStore } from "@/store/date-store";
import { useImpactModeStore } from "@/store/impact-mode-store";
import {
  getProvinceAttributeValueSum,
  getAreaCouncilAttributeValueSum,
} from "@/utils/getAttributes";
import { getAttributes } from "@/utils/getAttributes";
import { isPopulationAttr, isHazardAttr } from "@/config/impactMode";

export function useEstimatedAffectedPopulation() {
  const { tabularLayerData } = useLayerStore();
  const { year } = useDateStore();
  const { provinces, acList } = useAreaStore();
  const { enabled: impactModeEnabled } = useImpactModeStore();

  return useMemo(() => {
    if (!impactModeEnabled || !tabularLayerData.length) return null;

    let filtered = tabularLayerData.filter((i) => i.date.startsWith(year));
    if (acList.length > 0) {
      const acSet = new Set(acList.map((a) => a.toLowerCase()));
      filtered = filtered.filter(
        (i) => i.area_council && acSet.has(i.area_council.toLowerCase()),
      );
    } else if (provinces.length > 0) {
      const provSet = new Set(provinces.map((p) => p.toLowerCase()));
      filtered = filtered.filter(
        (i) => i.province && provSet.has(i.province.toLowerCase()),
      );
    }

    const attributes = getAttributes(filtered);
    const popAttr = attributes.find(isPopulationAttr);
    const hazardAttr = attributes.find(isHazardAttr);

    if (!popAttr || !hazardAttr) return null;

    const useAreaCouncil = provinces.length > 0;
    const places = useAreaCouncil
      ? (acList.length > 0
          ? acList
          : [
              ...new Set(
                filtered.map((i) => i.area_council).filter(Boolean),
              ),
            ] as string[])
      : (provinces.length > 0
          ? provinces
          : [...new Set(filtered.map((i) => i.province).filter(Boolean))] as string[]);

    let affected = 0;
    const getValue = useAreaCouncil
      ? (place: string, attr: string) =>
          getAreaCouncilAttributeValueSum(filtered, place, attr)
      : (place: string, attr: string) =>
          getProvinceAttributeValueSum(filtered, place, attr);

    for (const place of places) {
      const hazardVal = getValue(place, hazardAttr);
      if (typeof hazardVal === "number" && hazardVal > 0) {
        const popVal = getValue(place, popAttr);
        affected += typeof popVal === "number" ? popVal : 0;
      }
    }

    return { affected, populationAttr: popAttr, hazardAttr };
  }, [impactModeEnabled, tabularLayerData, year, provinces, acList]);
}
