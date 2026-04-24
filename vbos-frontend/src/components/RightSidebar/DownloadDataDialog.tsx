import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { LuDownload, LuExternalLink } from "react-icons/lu";
import { useLayerStore } from "@/store/layer-store";
import { useAuthStore } from "@/store/auth-store";
import { useAreaStore } from "@/store/area-store";
import { getXLSXData } from "@/api/getXLSXData";
import { Dataset } from "@/types/api";
import {
  downloadFile,
  getRasterFileUrl,
  getRasterGeoTiffUrl,
  sanitizeFilename,
} from "@/utils/downloadHelpers";
import { useVectorDatasetFromCache } from "@/hooks/useVectorDatasetFromCache";
import { useLandCoverRaster } from "@/hooks/useLandCoverRaster";
import { LAND_COVER_COLORMAP } from "@/components/colors";
import { toast } from "@/utils/toast";
import { useDateStore } from "@/store/date-store";

type DownloadDataDialogProps = {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
};

export const DownloadDataDialog = ({
  isOpen,
  setIsOpen,
}: DownloadDataDialogProps) => {
  const { layers, getLayerMetadata, tabularAttributeFilter } = useLayerStore();
  const { provinces, acList } = useAreaStore();
  const { year } = useDateStore();
  const getVectorDatasetFromCache = useVectorDatasetFromCache();
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const activeLayers = layers ? layers.split(",") : [];

  const activeDatasets = activeLayers
    .map((layerId) => {
      const metadata = getLayerMetadata(layerId);
      return metadata ? { layerId, metadata } : null;
    })
    .filter(
      (item): item is { layerId: string; metadata: Dataset } => item !== null,
    );

  const groupedDatasets = {
    tabular: activeDatasets.filter((d) => d.layerId.startsWith("t")),
    raster: activeDatasets.filter((d) => d.layerId.startsWith("r")),
    vector: activeDatasets.filter((d) => d.layerId.startsWith("v")),
    pmtiles: activeDatasets.filter((d) => d.layerId.startsWith("p")),
  };

  const handleDownload = async (layerId: string, dataset: Dataset) => {
    setDownloadingIds((prev) => new Set(prev).add(layerId));

    try {
      const areaFilters = new URLSearchParams();
      provinces.forEach((p) => areaFilters.append("province", p));
      acList.forEach((a) => areaFilters.append("area_council", a));

      let result;

      if (dataset.dataType === "tabular") {
        if (year) {
          areaFilters.set("date_after", `${year}-01-01`);
          areaFilters.set("date_before", `${year}-12-31`);
        }
        if (tabularAttributeFilter) {
          areaFilters.set("attribute", tabularAttributeFilter);
        }
        result = await getXLSXData(dataset.id, areaFilters);
      } else if (dataset.dataType === "vector") {
        result = getVectorDatasetFromCache(dataset.id, areaFilters);
      } else {
        return;
      }

      const sanitizedName = sanitizeFilename(dataset.name);
      const filenameParts = [sanitizedName];
      if (provinces.length) filenameParts.push(sanitizeFilename(provinces.join("_")));
      if (acList.length) filenameParts.push(sanitizeFilename(acList.join("_")));
      const filename = `${filenameParts.join("_")}.${result.extension}`;

      downloadFile(result.blob, filename);
      toast.success("Download started", filename);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to download dataset. Please try again.";
      toast.error("Download failed", message);
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(layerId);
        return next;
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Download Active Datasets</DialogTitle>
          <DialogDescription>
            Download tabular or vector data for the currently active layers.
            {(provinces.length > 0 || acList.length > 0 || year) && (
              <span className="block mt-1.5 text-xs font-medium">
                Filters: {[
                  provinces.length > 0 && `Province: ${provinces.join(", ")}`,
                  acList.length > 0 && `Area: ${acList.join(", ")}`,
                  year && `Year: ${year}`,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        {activeDatasets.length === 0 ? (
          <p className="text-muted-foreground">
            No active datasets. Please enable some datasets from the left
            sidebar to download them.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {groupedDatasets.tabular.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">
                  Tabular Datasets
                </p>
                <div className="flex flex-col gap-2">
                  {groupedDatasets.tabular.map(({ layerId, metadata }) => (
                    <DatasetRow
                      key={layerId}
                      layerId={layerId}
                      dataset={metadata}
                      onDownload={handleDownload}
                      isDownloading={downloadingIds.has(layerId)}
                      provinces={provinces}
                      acList={acList}
                      year={year}
                    />
                  ))}
                </div>
              </div>
            )}

            {groupedDatasets.raster.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">
                  Raster Datasets
                </p>
                <div className="flex flex-col gap-2">
                  {groupedDatasets.raster.map(({ layerId, metadata }) => (
                    <DatasetRow
                      key={layerId}
                      layerId={layerId}
                      dataset={metadata}
                      onDownload={handleDownload}
                      isDownloading={downloadingIds.has(layerId)}
                    />
                  ))}
                </div>
              </div>
            )}

            {groupedDatasets.vector.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">
                  Vector Datasets
                </p>
                <div className="flex flex-col gap-2">
                  {groupedDatasets.vector.map(({ layerId, metadata }) => (
                    <DatasetRow
                      key={layerId}
                      layerId={layerId}
                      dataset={metadata}
                      onDownload={handleDownload}
                      isDownloading={downloadingIds.has(layerId)}
                      provinces={provinces}
                      acList={acList}
                      year={year}
                    />
                  ))}
                </div>
              </div>
            )}

            {groupedDatasets.pmtiles.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">
                  PMTiles (Map Layers)
                </p>
                <div className="flex flex-col gap-2">
                  {groupedDatasets.pmtiles.map(({ layerId, metadata }) => (
                    <PMTilesDatasetRow
                      key={layerId}
                      dataset={metadata}
                      provinces={provinces}
                      acList={acList}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

type DatasetRowProps = {
  layerId: string;
  dataset: Dataset;
  onDownload: (layerId: string, dataset: Dataset) => void;
  isDownloading: boolean;
  provinces?: string[];
  acList?: string[];
  year?: string;
};

function getPmtilesServeUrl(url: string | null | undefined): string | null {
  if (!url?.endsWith(".pmtiles")) return null;
  const filename = url.includes("/media/") ? url.split("/media/").pop() : url.split("/").pop();
  if (!filename || filename.includes("/")) return null;
  const base = import.meta.env.VITE_API_HOST ?? "";
  return `${base || ""}/api/v1/pmtiles-serve/${filename}`.replace(/\/+/g, "/");
}

const PMTilesDatasetRow = ({
  dataset,
  provinces,
  acList,
}: {
  dataset: Dataset;
  provinces: string[];
  acList: string[];
}) => {
  const serveUrl = getPmtilesServeUrl(dataset.url);
  const filterSuffix =
    (provinces.length > 0 || acList.length > 0)
      ? " — " + [provinces.join(", "), acList.join(", ")].filter(Boolean).join(" • ")
      : "";
  const displayName = `${dataset.name}${filterSuffix}`;

  const [downloading, setDownloading] = useState(false);
  const token = useAuthStore((s) => s.token);
  const handleDownload = async () => {
    if (!serveUrl) return;
    setDownloading(true);
    try {
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Token ${token}`;
      const res = await fetch(serveUrl, { credentials: "include", headers });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      downloadFile(blob, `${sanitizeFilename(dataset.name)}.pmtiles`);
      toast.success("Download started", `${dataset.name}.pmtiles`);
    } catch {
      toast.error("Download failed", "Could not fetch PMTiles file.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 p-3 hover:bg-muted/70 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" title={displayName}>
          {displayName}
        </p>
        <p className="text-xs text-muted-foreground">
          {(dataset.type ?? "").replace(/_/g, " ")} • PMTiles
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleDownload}
        disabled={!serveUrl || downloading}
      >
        {downloading ? "Downloading…" : (
          <>
            <LuDownload className="size-4" />
            Download
          </>
        )}
      </Button>
    </div>
  );
};

const DatasetRow = ({
  layerId,
  dataset,
  onDownload,
  isDownloading,
  provinces = [],
  acList = [],
  year: yearProp,
}: DatasetRowProps) => {
  const { year: yearFromStore } = useDateStore();
  const year = yearProp ?? yearFromStore;
  const landCover = useLandCoverRaster();
  const [geotiffDownloading, setGeotiffDownloading] = useState(false);

  const getFileFormat = () => {
    if (dataset.dataType === "tabular") return "XLSX";
    if (dataset.dataType === "vector") return "GeoJSON";
    if (dataset.dataType === "raster") return "VRT / GeoTIFF";
  };

  const typeLabel = dataset.type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char, index) =>
      index === 0 ? char.toUpperCase() : char.toLowerCase(),
    );

  const filterSuffix =
    (dataset.dataType === "tabular" || dataset.dataType === "vector") &&
    (provinces.length > 0 || acList.length > 0 || year)
      ? " — " +
        [provinces.join(", "), acList.join(", "), year].filter(Boolean).join(" • ")
      : "";

  const displayName = `${dataset.name}${filterSuffix}`;

  const handleGeoTiffDownload = async () => {
    if (dataset.dataType !== "raster") return;
    setGeotiffDownloading(true);
    try {
      const filenameId = dataset.filename_id as string;
      const colormap = landCover?.layerId === layerId ? LAND_COVER_COLORMAP : undefined;
      const url = getRasterGeoTiffUrl(filenameId, year, colormap);
      const res = await fetch(url);
      if (!res.ok) throw new Error("GeoTIFF export not available");
      const blob = await res.blob();
      const name = sanitizeFilename(dataset.name);
      downloadFile(blob, `${name}_${year}.tif`);
      toast.success("Download started", `${name}_${year}.tif`);
    } catch {
      toast.error("Download failed", "GeoTIFF export may not be supported by this server.");
    } finally {
      setGeotiffDownloading(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 p-3 hover:bg-muted/70 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" title={displayName}>
          {displayName}
        </p>
        <p className="text-xs text-muted-foreground">
          {typeLabel} • {getFileFormat()}
        </p>
      </div>
      {dataset.dataType === "raster" ? (
        <div className="flex gap-1">
          <a
            href={getRasterFileUrl(dataset.filename_id as string, year)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            <Button size="sm" variant="outline">
              <LuExternalLink className="size-4" />
              VRT
            </Button>
          </a>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGeoTiffDownload}
            disabled={geotiffDownloading}
          >
            {geotiffDownloading ? "…" : (
              <>
                <LuDownload className="size-4" />
                GeoTIFF
              </>
            )}
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDownload(layerId, dataset)}
          disabled={isDownloading}
        >
          {isDownloading ? (
            "Downloading…"
          ) : (
            <>
              <LuDownload className="size-4" />
              Download
            </>
          )}
        </Button>
      )}
    </div>
  );
};
