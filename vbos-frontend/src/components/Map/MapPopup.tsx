import { useEffect, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { LuTriangleAlert } from "react-icons/lu";
import "@/Theme/popup.css";
import { toSentenceCase } from "@/utils/format";
import { getAssetExposure } from "@/api/getDatasets";
import { useLayerStore } from "@/store/layer-store";
import type { PopupInfo } from "./index";
import { orderedVectorPopupEntries } from "@/utils/vectorPopupProperties";

const transparentIcon = L.divIcon({
  className: "leaflet-transparent-marker",
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

export function MapPopup(popupInfo: PopupInfo) {
  const {
    latitude,
    longitude,
    datasetName,
    properties,
    featureId,
    datasetId,
    popupProperties,
  } = popupInfo;
  const { layers } = useLayerStore();
  const [exposure, setExposure] = useState<{ layer_id: number; layer_name: string }[] | null>(null);

  const vectorLayerIds = layers
    .split(",")
    .filter((l) => l.startsWith("v"))
    .map((l) => Number(l.slice(1)))
    .filter((id) => !Number.isNaN(id));

  useEffect(() => {
    if (datasetId?.startsWith("v") && vectorLayerIds.length > 0) {
      getAssetExposure(latitude, longitude, vectorLayerIds)
        .then(setExposure)
        .catch(() => setExposure([]));
    } else {
      setExposure(null);
    }
  }, [latitude, longitude, datasetId, layers]);

  const coords = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  const hasExposure = exposure && exposure.length > 0;

  return (
    <Marker
      position={[latitude, longitude]}
      icon={transparentIcon}
      key={`${latitude}-${longitude}`}
    >
      <Popup closeButton={false} autoPan={true}>
        <div className="min-w-[12rem] font-sans">
          {datasetName && (
            <h4 className="mb-2 text-sm font-semibold">{datasetName}</h4>
          )}
          {hasExposure && (
            <div className="mb-2 flex flex-wrap items-center gap-1 rounded-md bg-destructive/15 px-2 py-1.5 text-xs text-destructive">
              <LuTriangleAlert className="size-3.5 shrink-0" aria-hidden />
              <span className="font-medium">In hazard zone:</span>
              <span>{exposure!.map((e) => e.layer_name).join(", ")}</span>
            </div>
          )}
          {(featureId != null || coords) && (
            <p className="mb-2 text-xs text-muted-foreground">
              {featureId != null && (
                <span className="font-medium">ID {featureId}</span>
              )}
              {featureId != null && coords && " · "}
              {coords && (
                <span title="Match this to Admin → Coords column">{coords}</span>
              )}
            </p>
          )}
          <dl className="space-y-1 divide-y text-sm">
            {orderedVectorPopupEntries(properties, popupProperties).map(([key, value]) => {
              const displayValue =
                value === null || value === undefined
                  ? "N/A"
                  : typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value);
              return (
                <div key={key} className="flex items-baseline gap-2 pt-1 first:pt-0">
                  <dt className="min-w-[5rem] shrink-0 text-muted-foreground">
                    {toSentenceCase(key)}
                  </dt>
                  <dd className="max-w-full min-w-0 break-words">
                    {displayValue}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </Popup>
    </Marker>
  );
}
