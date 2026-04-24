import { useEffect, useMemo } from "react";
import { useDataset } from "@/hooks/useDataset";
import { useLayerStore } from "@/store/layer-store";
import { Skeleton } from "@/components/ui/skeleton";
import type { TabularApiParams } from "@/types/mapQuery";

export function TabularLayers() {
  const { layers } = useLayerStore();
  const tabularLayers = layers
    .split(",")
    .filter((i) => i.startsWith("t"))
    .map((i) => Number(i.slice(1)));

  const layer = tabularLayers.length ? tabularLayers[0] : null;

  if (layer) return <TabularDatasetMapLayer id={layer} />;
  return null;
}

type TabularDatasetMapLayerProps = {
  id: number;
};

function tabularParamsToSearchParams(p: TabularApiParams | null) {
  const f = new URLSearchParams();
  if (!p) return f;
  p.provinces?.forEach((pr) => f.append("province", pr));
  p.area_councils?.forEach((ac) => f.append("area_council", ac));
  if (p.attribute) f.set("attribute", p.attribute);
  if (p.value_gte != null && p.value_gte !== "")
    f.set("value_gte", String(p.value_gte));
  if (p.value_lte != null && p.value_lte !== "")
    f.set("value_lte", String(p.value_lte));
  return f;
}

function TabularDatasetMapLayer({ id }: TabularDatasetMapLayerProps) {
  const { setTabularLayerData } = useLayerStore();
  const tabularApiParams = useLayerStore((s) => s.tabularApiParams);
  const filters = useMemo(
    () => tabularParamsToSearchParams(tabularApiParams),
    [tabularApiParams],
  );

  const { data, isPending } = useDataset("tabular", id, filters);

  useEffect(() => {
    if (data && "results" in data && Array.isArray(data.results)) {
      setTabularLayerData(data.results);
    }
    // Don't clear on undefined/error — avoids flickering "no data" during fetch or when switching clusters
  }, [setTabularLayerData, data]);

  if (isPending)
    return (
      <div className="relative m-1 inline-block rounded-md bg-background p-2 shadow-sm opacity-95" role="status" aria-label="Loading dataset">
        <Skeleton className="mb-1 h-4 w-[140px]" />
        <p className="text-xs text-muted-foreground">
          Loading dataset layer {id}
        </p>
      </div>
    );

  return null;
}
