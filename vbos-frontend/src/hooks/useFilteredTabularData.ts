/**
 * Returns tabular data filtered by year, province, area council, and attribute.
 * Use this for Stats, KPIs, and charts to respect area and attribute filters.
 */
import { useMemo } from "react";
import type { TabularData } from "@/types/api";
import { useAreaStore } from "@/store/area-store";
import { useDateStore } from "@/store/date-store";
import { useLayerStore } from "@/store/layer-store";

function applyTabularFilters(
  data: TabularData[],
  year: string,
  provinces: string[],
  acList: string[],
  attributeFilter: string | null,
): TabularData[] {
  let result = data.filter((i) => i.date.startsWith(year));

  if (acList.length > 0) {
    const acSet = new Set(acList.map((a) => a.toLowerCase()));
    result = result.filter(
      (i) => i.area_council && acSet.has(i.area_council.toLowerCase()),
    );
  } else if (provinces.length > 0) {
    const provSet = new Set(provinces.map((p) => p.toLowerCase()));
    result = result.filter(
      (i) => i.province && provSet.has(i.province.toLowerCase()),
    );
  }

  if (attributeFilter) {
    const key = attributeFilter.toLowerCase();
    result = result.filter((i) => {
      const attr = (i.attribute ?? "").toLowerCase();
      return attr === key || attr.includes(key);
    });
  }

  return result;
}

export function useFilteredTabularData(): TabularData[] {
  const { tabularLayerData, tabularAttributeFilter } = useLayerStore();
  const { provinces, acList } = useAreaStore();
  const { year } = useDateStore();

  return useMemo(
    () =>
      applyTabularFilters(
        tabularLayerData,
        year,
        provinces,
        acList,
        tabularAttributeFilter,
      ),
    [tabularLayerData, year, provinces, acList, tabularAttributeFilter],
  );
}

export { applyTabularFilters };
