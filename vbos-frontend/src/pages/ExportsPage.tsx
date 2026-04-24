/**
 * Exports — full-page export centre.
 * Users pick a cluster, choose datasets, apply area/year filters, and
 * trigger downloads (XLSX, GeoJSON, GeoTIFF, PMTiles).  Each triggered job
 * is shown in a local "job queue" panel so multiple downloads can run in
 * parallel with individual progress feedback.
 */
import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import API from "@/api";
import { useClusters } from "@/hooks/useClusters";
import { useAreaStore } from "@/store/area-store";
import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/tokens";
import { cn } from "@/lib/utils";
import { getXLSXData } from "@/api/getXLSXData";
import {
  downloadFile,
  getRasterFileUrl,
  getRasterGeoTiffUrl,
  sanitizeFilename,
} from "@/utils/downloadHelpers";
import { useVectorDatasetFromCache } from "@/hooks/useVectorDatasetFromCache";
import { LAND_COVER_COLORMAP } from "@/components/colors";
import { toast } from "@/utils/toast";
import type { Dataset, DatasetType } from "@/types/api";
import {
  LuDownload,
  LuChevronDown,
  LuSearch,
  LuX,
  LuSquareCheck,
  LuSquare,
  LuTable2,
  LuGrid3X3,
  LuMap,
  LuLayers,
  LuCircleCheck,
  LuCircleAlert,
  LuLoader,
  LuExternalLink,
  LuTrash2,
  LuFilter,
} from "react-icons/lu";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type JobStatus = "pending" | "running" | "done" | "error";

interface ExportJob {
  id: string;
  datasetId: number;
  datasetName: string;
  dataType: string;
  format: string;
  status: JobStatus;
  error?: string;
  filename?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants / helpers
// ─────────────────────────────────────────────────────────────────────────────

const DATA_TYPE_LABELS: Record<string, string> = {
  tabular: "Tabular",
  raster: "Raster",
  vector: "Vector",
  pmtiles: "PMTiles",
};

const DATA_TYPE_ICONS: Record<string, React.ReactNode> = {
  tabular: <LuTable2 className="size-3.5" />,
  raster: <LuGrid3X3 className="size-3.5" />,
  vector: <LuMap className="size-3.5" />,
  pmtiles: <LuLayers className="size-3.5" />,
};

const DATA_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  tabular: { bg: "#4D90FF18", text: "#4D90FF", border: "#4D90FF40" },
  raster: { bg: "#30E87A18", text: "#22c55e", border: "#30E87A40" },
  vector: { bg: "#F5A62318", text: "#d97706", border: "#F5A62340" },
  pmtiles: { bg: "#a855f718", text: "#9333ea", border: "#a855f740" },
};

const DATASET_TYPE_LABELS: Record<DatasetType, string> = {
  baseline: "Baseline",
  estimated_damage: "Estimated Damage",
  aid_resources_needed: "Aid Resources",
  estimate_financial_damage: "Financial Damage",
};

/** RAP / risk-register style groupings (filters `dataset.type`, not raster/vector). */
const REGISTER_CATEGORY_ORDER: DatasetType[] = [
  "estimated_damage",
  "estimate_financial_damage",
  "aid_resources_needed",
  "baseline",
];

/** Formats available per data type */
const FORMATS_FOR: Record<string, string[]> = {
  tabular: ["XLSX"],
  vector: ["GeoJSON"],
  raster: ["GeoTIFF", "VRT"],
  pmtiles: ["PMTiles"],
};

function jobKey(d: Dataset, format: string) {
  return `${d.dataType}-${d.id}-${format}`;
}

function getPmtilesServeUrl(url: string | null | undefined): string | null {
  if (!url?.endsWith(".pmtiles")) return null;
  const filename = url.includes("/media/") ? url.split("/media/").pop() : url.split("/").pop();
  if (!filename || filename.includes("/")) return null;
  const base = import.meta.env.VITE_API_HOST ?? "";
  return `${base || ""}/api/v1/pmtiles-serve/${filename}`.replace(/\/+/g, "/");
}

// ─────────────────────────────────────────────────────────────────────────────
// Small UI primitives
// ─────────────────────────────────────────────────────────────────────────────

function DataTypeBadge({ dataType }: { dataType: string }) {
  const c = DATA_TYPE_COLORS[dataType] ?? { bg: "#88888818", text: "#888", border: "#88888840" };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {DATA_TYPE_ICONS[dataType]}
      {DATA_TYPE_LABELS[dataType] ?? dataType}
    </span>
  );
}

function JobStatusIcon({ status }: { status: JobStatus }) {
  if (status === "running") return <LuLoader className="size-4 animate-spin" style={{ color: colors.accent.blue }} />;
  if (status === "done") return <LuCircleCheck className="size-4" style={{ color: colors.accent.green }} />;
  if (status === "error") return <LuCircleAlert className="size-4" style={{ color: colors.accent.red }} />;
  return <LuDownload className="size-4" style={{ color: colors.text.muted }} />;
}

function ClusterSelector({
  clusters,
  value,
  onChange,
}: {
  clusters: { id: number; name: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-lg border pl-3 pr-8 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/40"
        style={{
          borderColor: colors.border.default,
          backgroundColor: colors.bg.surface,
          color: colors.text.primary,
        }}
        aria-label="Select cluster"
      >
        <option value="">Select cluster…</option>
        {clusters.map((c) => (
          <option key={c.id} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
      <LuChevronDown
        className="pointer-events-none absolute right-2.5 size-3.5"
        style={{ color: colors.text.muted }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dataset row in the picker
// ─────────────────────────────────────────────────────────────────────────────

interface DatasetPickerRowProps {
  dataset: Dataset;
  selectedFormats: Set<string>;
  formatStates: Record<string, JobStatus | undefined>;
  onToggleFormat: (format: string) => void;
}

function DatasetPickerRow({
  dataset,
  selectedFormats,
  formatStates,
  onToggleFormat,
}: DatasetPickerRowProps) {
  const formats = FORMATS_FOR[dataset.dataType] ?? [];

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 transition-colors"
      style={{
        borderColor: selectedFormats.size > 0 ? colors.accent.blue + "60" : colors.border.default,
        backgroundColor: selectedFormats.size > 0
          ? colors.accent.blue + "08"
          : colors.bg.surface,
      }}
    >
      {/* Left: dataset info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className="min-w-0 truncate text-sm font-medium"
            style={{ color: colors.text.primary }}
            title={dataset.name}
          >
            {dataset.name}
          </span>
          <DataTypeBadge dataType={dataset.dataType} />
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]" style={{ color: colors.text.muted }}>
          <span>{DATASET_TYPE_LABELS[dataset.type] ?? dataset.type}</span>
          {dataset.source && <span>· {dataset.source}</span>}
          {dataset.unit && <span>· {dataset.unit}</span>}
        </div>
      </div>

      {/* Right: format toggles */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {formats.map((fmt) => {
          const checked = selectedFormats.has(fmt);
          const state = formatStates[fmt] ?? undefined;
          const isRunning = state === "running";
          const isDone = state === "done";
          const isError = state === "error";

          const icon = isRunning
            ? <LuLoader className="size-3.5 animate-spin" />
            : isDone
              ? <LuCircleCheck className="size-3.5" />
              : isError
                ? <LuCircleAlert className="size-3.5" />
                : checked
                  ? <LuSquareCheck className="size-3.5" />
                  : <LuSquare className="size-3.5" />;

          const stateClass = isRunning
            ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
            : isDone
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : isError
                ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400"
                : checked
                  ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "hover:bg-muted/40";

          return (
            <button
              key={fmt}
              type="button"
              onClick={() => onToggleFormat(fmt)}
              disabled={isRunning}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-semibold transition-colors",
                stateClass,
              )}
              style={
                isRunning || isDone || isError || checked
                  ? undefined
                  : { borderColor: colors.border.default, color: colors.text.secondary }
              }
              aria-busy={isRunning}
            >
              {icon}
              {fmt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Job queue panel
// ─────────────────────────────────────────────────────────────────────────────

function JobQueuePanel({
  jobs,
  onClear,
}: {
  jobs: ExportJob[];
  onClear: () => void;
}) {
  if (jobs.length === 0) return null;

  const doneCount = jobs.filter((j) => j.status === "done").length;
  const errorCount = jobs.filter((j) => j.status === "error").length;
  const runningCount = jobs.filter((j) => j.status === "running").length;

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border"
      style={{ borderColor: colors.border.default, backgroundColor: colors.bg.surface }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: colors.border.default }}
      >
        <div className="flex items-center gap-3">
          <h2
            className="text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace", color: colors.text.muted }}
          >
            Export Queue
          </h2>
          <div className="flex items-center gap-1.5">
            {runningCount > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                style={{ backgroundColor: colors.accent.blue + "20", color: colors.accent.blue }}
              >
                {runningCount} running
              </span>
            )}
            {doneCount > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                style={{ backgroundColor: colors.accent.green + "20", color: colors.accent.green }}
              >
                {doneCount} done
              </span>
            )}
            {errorCount > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                style={{ backgroundColor: colors.accent.red + "20", color: colors.accent.red }}
              >
                {errorCount} failed
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium opacity-60 hover:opacity-100"
          style={{ color: colors.text.muted }}
          onClick={onClear}
        >
          <LuTrash2 className="size-3" />
          Clear
        </button>
      </div>

      {/* Job rows */}
      <div className="divide-y" style={{ borderColor: colors.border.default }}>
        {jobs.map((job) => (
          <div key={job.id} className="flex items-center gap-3 px-4 py-3">
            <JobStatusIcon status={job.status} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" style={{ color: colors.text.primary }} title={job.datasetName}>
                {job.datasetName}
              </p>
              <p className="text-[11px]" style={{ color: colors.text.muted }}>
                {job.format}
                {job.status === "done" && job.filename && ` · ${job.filename}`}
                {job.status === "error" && job.error && ` · ${job.error}`}
              </p>
            </div>
            <span
              className="shrink-0 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                color:
                  job.status === "done"
                    ? colors.accent.green
                    : job.status === "error"
                      ? colors.accent.red
                      : job.status === "running"
                        ? colors.accent.blue
                        : colors.text.muted,
              }}
            >
              {job.status === "pending" ? "Queued" : job.status === "running" ? "Downloading…" : job.status === "done" ? "Downloaded" : "Failed"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter bar
// ─────────────────────────────────────────────────────────────────────────────

const ALL_DATA_TYPES = ["tabular", "raster", "vector", "pmtiles"] as const;

function FilterPill({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition-colors",
        active
          ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
          : "hover:border-border/80 hover:bg-muted/50",
      )}
      style={active ? undefined : { borderColor: colors.border.default, color: colors.text.secondary }}
    >
      {label}
      {count !== undefined && (
        <span
          className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
          style={{
            backgroundColor: active ? "#4D90FF30" : "var(--drmis-bg-elevated)",
            color: active ? colors.accent.blue : colors.text.muted,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Area/Year filter sidebar
// ─────────────────────────────────────────────────────────────────────────────

function ExportFiltersPanel({
  provinces,
  acList,
  year,
  onYearChange,
}: {
  provinces: string[];
  acList: string[];
  year: string;
  onYearChange: (y: string) => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => String(currentYear - i));

  return (
    <div
      className="flex flex-col gap-4 rounded-xl border p-4"
      style={{ borderColor: colors.border.default, backgroundColor: colors.bg.surface }}
    >
      <h2
        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace", color: colors.text.muted }}
      >
        Export Filters
      </h2>

      {/* Province chips */}
      {provinces.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-medium" style={{ color: colors.text.secondary }}>
            Province
          </p>
          <div className="flex flex-wrap gap-1.5">
            {provinces.map((p) => (
              <span
                key={p}
                className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
                style={{
                  borderColor: colors.accent.blue + "50",
                  backgroundColor: colors.accent.blue + "10",
                  color: colors.accent.blue,
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Area council chips */}
      {acList.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-medium" style={{ color: colors.text.secondary }}>
            Area council
          </p>
          <div className="flex flex-wrap gap-1.5">
            {acList.map((a) => (
              <span
                key={a}
                className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
                style={{
                  borderColor: colors.accent.amber + "50",
                  backgroundColor: colors.accent.amber + "10",
                  color: "#d97706",
                }}
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {provinces.length === 0 && acList.length === 0 && (
        <p className="text-[11px] italic" style={{ color: colors.text.muted }}>
          No area filters active — exports will include all areas.
        </p>
      )}

      {/* Year selector */}
      <div>
        <p className="mb-1.5 text-[11px] font-medium" style={{ color: colors.text.secondary }}>
          Year (tabular exports)
        </p>
        <div className="relative inline-flex items-center">
          <select
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            className="h-8 appearance-none rounded-md border pl-3 pr-7 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
            style={{
              borderColor: colors.border.default,
              backgroundColor: colors.bg.elevated,
              color: colors.text.primary,
            }}
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <LuChevronDown
            className="pointer-events-none absolute right-2 size-3"
            style={{ color: colors.text.muted }}
          />
        </div>
      </div>

      {/* Hint */}
      <p className="text-[10px] leading-relaxed" style={{ color: colors.text.muted }}>
        Area and year filters apply to tabular (XLSX) and vector (GeoJSON) exports. Raster and PMTiles exports are not filtered by area.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export function ExportsPage() {
  const [selectedCluster, setSelectedCluster] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeDataType, setActiveDataType] = useState<string | null>(null);
  /** Filters by API `dataset.type` (RAP / risk-register categories). */
  const [registerCategoryFilter, setRegisterCategoryFilter] = useState<DatasetType | null>(null);
  const [exportYear, setExportYear] = useState<string>(String(new Date().getFullYear()));
  // Map: `${dataType}-${id}-${format}` → selected
  const [selectedFormats, setSelectedFormats] = useState<Record<string, Set<string>>>({});
  const [jobs, setJobs] = useState<ExportJob[]>([]);

  const { data: clusters, isPending: clustersPending } = useClusters();
  const { provinces, acList } = useAreaStore();
  const token = useAuthStore((s) => s.token);
  const getVectorDatasetFromCache = useVectorDatasetFromCache();

  const { data: clusterDatasets, isPending: datasetsPending } = useQuery({
    queryKey: ["datasets-catalog", selectedCluster],
    queryFn: () =>
      selectedCluster ? API.getDatasets(selectedCluster) : Promise.resolve([]),
    enabled: !!selectedCluster,
    staleTime: 2 * 60 * 1000,
  });

  const allDatasets: Dataset[] = useMemo(
    () => (clusterDatasets ?? []).flatMap((g) => g.datasets),
    [clusterDatasets],
  );

  const countsByDataType = useMemo(
    () =>
      ALL_DATA_TYPES.reduce<Record<string, number>>((acc, dt) => {
        acc[dt] = allDatasets.filter((d) => d.dataType === dt).length;
        return acc;
      }, {}),
    [allDatasets],
  );

  const countsByRegisterCategory = useMemo(() => {
    const acc: Partial<Record<DatasetType, number>> = {};
    for (const d of allDatasets) {
      acc[d.type] = (acc[d.type] ?? 0) + 1;
    }
    return acc;
  }, [allDatasets]);

  const filtered = useMemo(() => {
    let list = allDatasets;
    if (activeDataType) list = list.filter((d) => d.dataType === activeDataType);
    if (registerCategoryFilter) {
      list = list.filter((d) => d.type === registerCategoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.description ?? "").toLowerCase().includes(q) ||
          (d.source ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [allDatasets, activeDataType, registerCategoryFilter, searchQuery]);

  const toggleFormat = useCallback((dataset: Dataset, format: string) => {
    const key = `${dataset.dataType}-${dataset.id}`;
    setSelectedFormats((prev) => {
      const cur = new Set(prev[key] ?? []);
      if (cur.has(format)) cur.delete(format);
      else cur.add(format);
      return { ...prev, [key]: cur };
    });
  }, []);

  const selectedCount = useMemo(
    () => Object.values(selectedFormats).reduce((n, s) => n + s.size, 0),
    [selectedFormats],
  );

  const formatStatusByDatasetKey = useMemo(() => {
    const byDataset: Record<string, Record<string, JobStatus>> = {};
    for (const job of jobs) {
      const datasetKey = `${job.dataType}-${job.datasetId}`;
      byDataset[datasetKey] ??= {};
      // jobs are prepended; keep first seen as latest state for each format
      if (byDataset[datasetKey][job.format] === undefined) {
        byDataset[datasetKey][job.format] = job.status;
      }
    }
    return byDataset;
  }, [jobs]);

  // ── Download runners ──────────────────────────────────────────────────────

  const runJob = useCallback(async (_job: ExportJob, dataset: Dataset, format: string) => {
    const areaFilters = new URLSearchParams();
    provinces.forEach((p) => areaFilters.append("province", p));
    acList.forEach((a) => areaFilters.append("area_council", a));
    if (exportYear) {
      areaFilters.set("date_after", `${exportYear}-01-01`);
      areaFilters.set("date_before", `${exportYear}-12-31`);
    }

    const safeName = sanitizeFilename(dataset.name);
    const areaSuffix = [
      provinces.length ? provinces.join("_") : "",
      acList.length ? acList.join("_") : "",
    ].filter(Boolean).join("_");
    const yearSuffix = exportYear ? `_${exportYear}` : "";

    try {
      if (dataset.dataType === "tabular" && format === "XLSX") {
        const result = await getXLSXData(dataset.id, areaFilters);
        const filename = `${safeName}${areaSuffix ? `_${areaSuffix}` : ""}${yearSuffix}.xlsx`;
        downloadFile(result.blob, filename);
        return filename;
      }

      if (dataset.dataType === "vector" && format === "GeoJSON") {
        const result = getVectorDatasetFromCache(dataset.id, areaFilters);
        const filename = `${safeName}${areaSuffix ? `_${areaSuffix}` : ""}.geojson`;
        downloadFile(result.blob, filename);
        return filename;
      }

      if (dataset.dataType === "raster" && format === "GeoTIFF") {
        const filenameId = dataset.filename_id as string;
        const isLandCover = (dataset as { is_land_cover?: boolean }).is_land_cover;
        const colormap = isLandCover ? LAND_COVER_COLORMAP : undefined;
        const url = getRasterGeoTiffUrl(filenameId, exportYear || new Date().getFullYear(), colormap);
        const res = await fetch(url);
        if (!res.ok) throw new Error("GeoTIFF export not available");
        const blob = await res.blob();
        const filename = `${safeName}${yearSuffix}.tif`;
        downloadFile(blob, filename);
        return filename;
      }

      if (dataset.dataType === "raster" && format === "VRT") {
        const filenameId = dataset.filename_id as string;
        const vrtUrl = getRasterFileUrl(filenameId, exportYear || new Date().getFullYear());
        window.open(vrtUrl, "_blank", "noopener,noreferrer");
        return `${safeName}${yearSuffix}.vrt (opened in new tab)`;
      }

      if (dataset.dataType === "pmtiles" && format === "PMTiles") {
        const serveUrl = getPmtilesServeUrl(dataset.url);
        if (!serveUrl) throw new Error("PMTiles serve URL not available");
        const headers: HeadersInit = {};
        if (token) headers["Authorization"] = `Token ${token}`;
        const res = await fetch(serveUrl, { credentials: "include", headers });
        if (!res.ok) throw new Error("Download failed");
        const blob = await res.blob();
        const filename = `${safeName}.pmtiles`;
        downloadFile(blob, filename);
        return filename;
      }

      throw new Error(`Unsupported format: ${format}`);
    } catch (err) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }, [provinces, acList, exportYear, token, getVectorDatasetFromCache]);

  const handleExportSelected = useCallback(async () => {
    const newJobs: ExportJob[] = [];
    for (const dataset of allDatasets) {
      const key = `${dataset.dataType}-${dataset.id}`;
      const formats = selectedFormats[key];
      if (!formats || formats.size === 0) continue;
      for (const format of formats) {
        newJobs.push({
          id: `${jobKey(dataset, format)}-${Date.now()}`,
          datasetId: dataset.id,
          datasetName: dataset.name,
          dataType: dataset.dataType,
          format,
          status: "pending",
        });
      }
    }
    if (newJobs.length === 0) return;

    setJobs((prev) => [...newJobs, ...prev]);
    toast.info(
      "Export started",
      `${newJobs.length} download${newJobs.length !== 1 ? "s" : ""} queued.`,
    );

    for (const job of newJobs) {
      const dataset = allDatasets.find(
        (d) => d.dataType === job.dataType && d.id === job.datasetId,
      );
      if (!dataset) continue;

      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: "running" } : j)),
      );

      try {
        const filename = await runJob(job, dataset, job.format);
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id ? { ...j, status: "done", filename } : j,
          ),
        );
        toast.success("Downloaded", filename ?? dataset.name);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id ? { ...j, status: "error", error: msg } : j,
          ),
        );
        toast.error("Export failed", `${dataset.name} — ${msg}`);
      }
    }

    // Clear selections after queuing
    setSelectedFormats({});
  }, [allDatasets, selectedFormats, runJob]);

  const hasCluster = selectedCluster !== "";
  const isLoading = clustersPending || (hasCluster && datasetsPending);

  return (
    <div
      className="grid min-h-0 min-w-0 gap-6"
      style={{ gridTemplateRows: "auto 1fr" }}
    >
      {/* ── Header ── */}
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1
            className="text-[22px] font-bold leading-tight tracking-tight"
            style={{
              fontFamily: "'Segoe UI Variable', 'Segoe UI', ui-sans-serif, system-ui, sans-serif",
              fontWeight: 700,
              color: colors.text.primary,
            }}
          >
            Exports
          </h1>
          <p
            className="mt-1 text-xs"
            style={{
              color: colors.text.muted,
              fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
            }}
          >
            Select datasets · choose formats · download — XLSX, GeoJSON, GeoTIFF, PMTiles
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {clusters && (
            <ClusterSelector
              clusters={clusters}
              value={selectedCluster}
              onChange={(v) => {
                setSelectedCluster(v);
                setSelectedFormats({});
                setActiveDataType(null);
                setSearchQuery("");
                setRegisterCategoryFilter(null);
              }}
            />
          )}
          {selectedCount > 0 && (
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: colors.accent.blue }}
              onClick={() => void handleExportSelected()}
            >
              <LuDownload className="size-3.5" />
              Export {selectedCount} file{selectedCount !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="grid min-h-0 gap-6 lg:grid-cols-[1fr_280px]">
        {/* Left: dataset picker */}
        <div className="flex min-h-0 min-w-0 flex-col gap-4">
          {/* No cluster selected */}
          {!hasCluster && !clustersPending && (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <div
                className="flex size-16 items-center justify-center rounded-2xl border"
                style={{ borderColor: colors.border.default, backgroundColor: colors.bg.surface }}
              >
                <LuDownload className="size-7 opacity-40" style={{ color: colors.text.primary }} />
              </div>
              <div>
                <p className="text-base font-semibold" style={{ color: colors.text.primary }}>
                  Select a cluster to begin
                </p>
                <p className="mt-1 max-w-[30rem] text-sm" style={{ color: colors.text.muted }}>
                  Choose a cluster from the dropdown above. All available datasets will appear here
                  for you to select and export.
                </p>
              </div>
              {clusters && clusters.length > 0 && (
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {clusters.slice(0, 6).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted/40"
                      style={{ borderColor: colors.border.default, color: colors.text.secondary }}
                      onClick={() => setSelectedCluster(c.name)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={`sk-${i}`}
                  className="h-[64px] animate-pulse rounded-lg border"
                  style={{ borderColor: colors.border.default, backgroundColor: colors.bg.surface }}
                />
              ))}
            </div>
          )}

          {/* Dataset list */}
          {hasCluster && !isLoading && (
            <>
              {/* Filters */}
              <div className="flex min-w-0 flex-col gap-3">
                <div className="relative max-w-md">
                  <LuSearch
                    className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2"
                    style={{ color: colors.text.muted }}
                  />
                  <input
                    type="search"
                    placeholder="Search datasets…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-full rounded-lg border py-2 pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
                    style={{
                      borderColor: colors.border.default,
                      backgroundColor: colors.bg.surface,
                      color: colors.text.primary,
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                    >
                      <LuX className="size-3.5" style={{ color: colors.text.muted }} />
                    </button>
                  )}
                </div>

                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <LuFilter className="size-3 shrink-0" style={{ color: colors.text.muted }} />
                  <FilterPill label="All" active={activeDataType === null} onClick={() => setActiveDataType(null)} />
                  {ALL_DATA_TYPES.filter((dt) => countsByDataType[dt] > 0).map((dt) => (
                    <FilterPill
                      key={dt}
                      label={DATA_TYPE_LABELS[dt]}
                      active={activeDataType === dt}
                      onClick={() => setActiveDataType(activeDataType === dt ? null : dt)}
                      count={countsByDataType[dt]}
                    />
                  ))}
                  {(activeDataType || searchQuery || registerCategoryFilter) && (
                    <button
                      type="button"
                      className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium underline underline-offset-2"
                      style={{ color: colors.accent.blue }}
                      onClick={() => {
                        setActiveDataType(null);
                        setSearchQuery("");
                        setRegisterCategoryFilter(null);
                      }}
                    >
                      <LuX className="size-3" />
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex min-w-0 flex-wrap items-center gap-2 border-t border-dashed pt-3" style={{ borderColor: colors.border.default }}>
                  <span
                    className="w-full text-[10px] font-semibold uppercase tracking-wide sm:w-auto sm:pr-1"
                    style={{ color: colors.text.muted }}
                  >
                    Risk register (by dataset category)
                  </span>
                  <FilterPill
                    label="All categories"
                    active={registerCategoryFilter === null}
                    onClick={() => setRegisterCategoryFilter(null)}
                  />
                  {REGISTER_CATEGORY_ORDER.map((cat) => {
                    const n = countsByRegisterCategory[cat] ?? 0;
                    if (n === 0 && registerCategoryFilter !== cat) return null;
                    return (
                      <FilterPill
                        key={cat}
                        label={DATASET_TYPE_LABELS[cat]}
                        active={registerCategoryFilter === cat}
                        onClick={() =>
                          setRegisterCategoryFilter(registerCategoryFilter === cat ? null : cat)
                        }
                        count={n}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Select all / deselect strip */}
              {filtered.length > 0 && (
                <div
                  className="flex items-center justify-between rounded-lg border px-4 py-2.5"
                  style={{ borderColor: colors.border.default, backgroundColor: colors.bg.elevated }}
                >
                  <p className="text-[11px]" style={{ color: colors.text.muted }}>
                    {filtered.length} dataset{filtered.length !== 1 ? "s" : ""}
                    {filtered.length !== allDatasets.length && ` (filtered from ${allDatasets.length})`}
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="text-[11px] font-medium underline underline-offset-2"
                      style={{ color: colors.accent.blue }}
                      onClick={() => {
                        const next: Record<string, Set<string>> = {};
                        filtered.forEach((d) => {
                          const formats = FORMATS_FOR[d.dataType] ?? [];
                          if (formats.length > 0) {
                            next[`${d.dataType}-${d.id}`] = new Set([formats[0]]);
                          }
                        });
                        setSelectedFormats(next);
                      }}
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      className="text-[11px] font-medium underline underline-offset-2"
                      style={{ color: colors.text.muted }}
                      onClick={() => setSelectedFormats({})}
                    >
                      Deselect all
                    </button>
                  </div>
                </div>
              )}

              {/* Dataset rows */}
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <LuDownload className="size-8 opacity-20" style={{ color: colors.text.muted }} />
                  <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
                    {searchQuery ? `No datasets matching "${searchQuery}"` : "No datasets found"}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filtered.map((dataset) => {
                    const key = `${dataset.dataType}-${dataset.id}`;
                    return (
                      <DatasetPickerRow
                        key={key}
                        dataset={dataset}
                        selectedFormats={selectedFormats[key] ?? new Set()}
                        formatStates={formatStatusByDatasetKey[key] ?? {}}
                        onToggleFormat={(fmt) => toggleFormat(dataset, fmt)}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Job queue (below the picker) */}
          {jobs.length > 0 && (
            <div className="mt-2">
              <JobQueuePanel
                jobs={jobs}
                onClear={() => setJobs((prev) => prev.filter((j) => j.status === "running"))}
              />
            </div>
          )}
        </div>

        {/* Right: filters + info panel */}
        <div className="flex flex-col gap-4">
          <ExportFiltersPanel
            provinces={provinces}
            acList={acList}
            year={exportYear}
            onYearChange={setExportYear}
          />

          {/* Format reference card */}
          <div
            className="flex flex-col gap-3 rounded-xl border p-4"
            style={{ borderColor: colors.border.default, backgroundColor: colors.bg.surface }}
          >
            <h2
              className="text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace", color: colors.text.muted }}
            >
              Format Guide
            </h2>
            <div className="flex flex-col gap-2.5 text-[11px]" style={{ color: colors.text.secondary }}>
              <div className="flex items-start gap-2">
                <LuTable2 className="mt-0.5 size-3.5 shrink-0" style={{ color: "#4D90FF" }} />
                <span><strong className="font-medium" style={{ color: colors.text.primary }}>XLSX</strong> — Tabular data, filtered by area and year. Opens in Excel / Sheets.</span>
              </div>
              <div className="flex items-start gap-2">
                <LuMap className="mt-0.5 size-3.5 shrink-0" style={{ color: "#d97706" }} />
                <span><strong className="font-medium" style={{ color: colors.text.primary }}>GeoJSON</strong> — Vector features as standard geographic JSON. Import into QGIS, ArcGIS, etc.</span>
              </div>
              <div className="flex items-start gap-2">
                <LuGrid3X3 className="mt-0.5 size-3.5 shrink-0" style={{ color: "#22c55e" }} />
                <span><strong className="font-medium" style={{ color: colors.text.primary }}>GeoTIFF</strong> — Raster as a single-band or RGB cloud-optimised TIFF for a selected year.</span>
              </div>
              <div className="flex items-start gap-2">
                <LuExternalLink className="mt-0.5 size-3.5 shrink-0" style={{ color: "#22c55e" }} />
                <span><strong className="font-medium" style={{ color: colors.text.primary }}>VRT</strong> — Virtual raster table on Digital Ocean Spaces; opens in QGIS/GDAL directly.</span>
              </div>
              <div className="flex items-start gap-2">
                <LuLayers className="mt-0.5 size-3.5 shrink-0" style={{ color: "#9333ea" }} />
                <span><strong className="font-medium" style={{ color: colors.text.primary }}>PMTiles</strong> — Cloud-optimised vector tiles archive for offline or self-hosted map rendering.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
