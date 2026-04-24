/**
 * Compute delta (valueRight - valueLeft) or % change per feature for comparison heatmap.
 */
import { useMemo } from "react";
import { useAreaStore } from "@/store/area-store";
import { useLayerStore } from "@/store/layer-store";
import { AreaCouncilGeoJSON, ProvincesGeoJSON } from "@/types/data";
import { getAreaCouncilValue, getProvinceValue } from "@/utils/getValue";
import { featureCollection } from "@turf/helpers";

export type DeltaMode = "absolute" | "percent";

const useAdminAreaStatsDelta = (
  geojson: ProvincesGeoJSON | AreaCouncilGeoJSON = featureCollection([]),
  yearLeft: string,
  yearRight: string,
  mode: DeltaMode = "percent",
) => {
  const { ac, province } = useAreaStore();
  const { tabularLayerData } = useLayerStore();

  return useMemo(() => {
    const filteredLeft = tabularLayerData.filter((i) => i.date.startsWith(yearLeft));
    const filteredRight = tabularLayerData.filter((i) => i.date.startsWith(yearRight));

    if (!geojson?.features?.length) {
      return {
        geojson: featureCollection([]),
        maxDelta: 0,
        minDelta: 0,
      };
    }

    const updatedGeojson = {
      ...geojson,
      features: geojson.features.map((feature) => ({
        ...feature,
        properties: { ...feature.properties },
      })),
    };

    const deltas: number[] = [];

    type PropsWithDelta = Record<string, unknown> & {
      value?: number;
      delta?: number;
      valueLeft?: number;
      valueRight?: number;
    };

    if (!province) {
      updatedGeojson.features.forEach((p) => {
        const name = (p.properties?.name as string) ?? "";
        const vLeft = getProvinceValue(filteredLeft, name);
        const vRight = getProvinceValue(filteredRight, name);
        let delta: number;
        if (mode === "percent") {
          delta = vLeft && vLeft !== 0
            ? ((vRight - vLeft) / vLeft) * 100
            : vRight ? 100 : 0;
        } else {
          delta = (vRight ?? 0) - (vLeft ?? 0);
        }
        const props = p.properties as PropsWithDelta;
        props.value = vRight ?? vLeft ?? 0;
        props.delta = delta;
        props.valueLeft = vLeft;
        props.valueRight = vRight;
        if (typeof delta === "number" && isFinite(delta)) deltas.push(delta);
      });
    } else {
      updatedGeojson.features.forEach((c) => {
        const name = (c.properties?.name as string) ?? "";
        const vLeft = getAreaCouncilValue(filteredLeft, name);
        const vRight = getAreaCouncilValue(filteredRight, name);
        let delta: number;
        if (mode === "percent") {
          delta = vLeft && vLeft !== 0
            ? ((vRight - vLeft) / vLeft) * 100
            : vRight ? 100 : 0;
        } else {
          delta = (vRight ?? 0) - (vLeft ?? 0);
        }
        const props = c.properties as PropsWithDelta;
        props.value = vRight ?? vLeft ?? 0;
        props.delta = delta;
        props.valueLeft = vLeft;
        props.valueRight = vRight;
        if (typeof delta === "number" && isFinite(delta)) deltas.push(delta);
      });
    }

    if (deltas.length === 0) {
      return { geojson: updatedGeojson, maxDelta: 0, minDelta: 0 };
    }

    deltas.sort((a, b) => a - b);
    return {
      geojson: updatedGeojson,
      minDelta: deltas[0],
      maxDelta: deltas[deltas.length - 1],
    };
  }, [ac, province, tabularLayerData, yearLeft, yearRight, geojson, mode]);
};

export { useAdminAreaStatsDelta };
