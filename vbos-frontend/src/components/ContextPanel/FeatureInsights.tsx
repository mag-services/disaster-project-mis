/**
 * Drill-down insights when a map feature is selected.
 */
import { usePanelStore } from "@/store/panel-store";
import { toSentenceCase } from "@/utils/format";
import { orderedVectorPopupEntries } from "@/utils/vectorPopupProperties";
import { LuMapPin } from "react-icons/lu";

export function FeatureInsights() {
  const { selectedFeatureInfo, setSelectedFeatureInfo } = usePanelStore();

  if (!selectedFeatureInfo) return null;

  const { datasetName, properties, latitude, longitude, popupProperties } =
    selectedFeatureInfo;

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <LuMapPin className="size-4 text-primary" />
          Feature details
        </h3>
        <button
          type="button"
          onClick={() => setSelectedFeatureInfo(null)}
          className="text-xs text-muted-foreground underline hover:text-foreground"
        >
          Clear
        </button>
      </div>
      {datasetName && (
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {datasetName}
        </p>
      )}
      <p className="mb-3 text-[10px] text-muted-foreground">
        {latitude.toFixed(4)}, {longitude.toFixed(4)}
      </p>
      <dl className="space-y-1.5 divide-y divide-border/60 text-xs">
        {orderedVectorPopupEntries(properties, popupProperties).map(([key, value]) => {
            const displayValue =
              value === null || value === undefined
                ? "N/A"
                : typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value);
            return (
              <div key={key} className="flex gap-2 pt-1.5 first:pt-0">
                <dt className="min-w-[5rem] shrink-0 text-muted-foreground">
                  {toSentenceCase(key)}
                </dt>
                <dd className="min-w-0 break-words">{displayValue}</dd>
              </div>
            );
          })}
      </dl>
    </div>
  );
}
