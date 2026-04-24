import { useMemo } from "react";
import { useAreaStore } from "@/store/area-store";
import { useLayerStore } from "@/store/layer-store";
import { AreaCouncilGeoJSON, ProvincesGeoJSON } from "@/types/data";
import { getAreaCouncilValue, getProvinceValue } from "@/utils/getValue";
import { featureCollection } from "@turf/helpers";

/**
 * Compute choropleth stats for a specific year.
 * Used by comparison mode to show year A vs year B side by side.
 */
const useAdminAreaStatsForYear = (
  geojson: ProvincesGeoJSON | AreaCouncilGeoJSON = featureCollection([]),
  year: string,
) => {
  const { ac, province } = useAreaStore();
  const { tabularLayerData } = useLayerStore();

  return useMemo(() => {
    const filteredData = tabularLayerData.filter((i) =>
      i.date.startsWith(year),
    );

    if (!geojson?.features?.length) {
      return {
        geojson: featureCollection([]),
        maxValue: 0,
        minValue: 0,
      };
    }

    const updatedGeojson = {
      ...geojson,
      features: geojson.features.map((feature) => ({
        ...feature,
        properties: { ...feature.properties },
      })),
    };

    if (!province) {
      updatedGeojson.features.forEach(
        (p) =>
          (p.properties.value = getProvinceValue(
            filteredData,
            p.properties.name,
          )),
      );
    }
    if (province) {
      updatedGeojson.features.forEach(
        (c) =>
          (c.properties.value = getAreaCouncilValue(
            filteredData,
            c.properties.name,
          )),
      );
    }

    const values = updatedGeojson.features
      .map((i) => i.properties?.value)
      .filter((v): v is number => typeof v === "number" && isFinite(v));

    if (values.length === 0) {
      return { geojson: updatedGeojson, maxValue: 0, minValue: 0 };
    }

    values.sort((a, b) => a - b);
    return {
      geojson: updatedGeojson,
      minValue: values[0],
      maxValue: values[values.length - 1],
    };
  }, [ac, province, tabularLayerData, year, geojson]);
};

export { useAdminAreaStatsForYear };
