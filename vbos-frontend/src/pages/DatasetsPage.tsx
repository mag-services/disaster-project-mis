import { useState, useMemo } from "react";
import type { CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import API from "@/api";
import { useClusters } from "@/hooks/useClusters";
import { colors } from "@/tokens";
import { cn } from "@/lib/utils";
import type { Dataset, DatasetType } from "@/types/api";
import {
  LuDatabase,
  LuSearch,
  LuX,
  LuGrid3X3,
  LuTable2,
  LuMap,
  LuLayers,
  LuChevronDown,
  LuRefreshCw,
  LuCalendar,
  LuTag,
  LuInfo,
} from "react-icons/lu";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
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

const DATASET_TYPE_LABELS: Record<DatasetType, string> = {
  baseline: "Baseline",
  estimated_damage: "Estimated Damage",
  aid_resources_needed: "Aid Resources",
  estimate_financial_damage: "Financial Damage",
};

const DATA_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  tabular: { bg: "#4D90FF18", text: "#4D90FF", border: "#4D90FF40" },
  raster: { bg: "#30E87A18", text: "#22c55e", border: "#30E87A40" },
  vector: { bg: "#F5A62318", text: "#d97706", border: "#F5A62340" },
  pmtiles: { bg: "#a855f718", text: "#9333ea", border: "#a855f740" },
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
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

function SemanticTypeBadge({ type }: { type: DatasetType }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{
        backgroundColor: "var(--drmis-bg-elevated)",
        color: "var(--drmis-text-muted)",
        border: "1px solid var(--drmis-border-default)",
      }}
    >
      <LuTag className="size-2.5" />
      {DATASET_TYPE_LABELS[type] ?? type}
    </span>
  );
}

interface DatasetCardProps {
  dataset: Dataset;
}

function DatasetCard({ dataset }: DatasetCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
      style={{
        borderColor: colors.border.default,
        backgroundColor: colors.bg.surface,
      }}
    >
      {/* Top data-type accent stripe */}
      <div
        className="h-[2px] w-full shrink-0"
        style={{
          backgroundColor:
            DATA_TYPE_COLORS[dataset.dataType]?.text ?? "#888",
        }}
        aria-hidden
      />

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Header row */}
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3
              className="truncate text-sm font-semibold leading-snug"
              style={{ color: colors.text.primary }}
              title={dataset.name}
            >
              {dataset.name}
            </h3>
            {dataset.cluster && (
              <p
                className="mt-0.5 text-[11px]"
                style={{ color: colors.text.muted }}
              >
                {dataset.cluster}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <DataTypeBadge dataType={dataset.dataType} />
          </div>
        </div>

        {/* Semantic type */}
        <div className="flex flex-wrap gap-1.5">
          <SemanticTypeBadge type={dataset.type} />
          {dataset.unit && (
            <span
              className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono"
              style={{
                backgroundColor: "var(--drmis-bg-elevated)",
                color: "var(--drmis-text-secondary)",
                border: "1px solid var(--drmis-border-default)",
              }}
            >
              {dataset.unit}
            </span>
          )}
          {dataset.dataType === "raster" && dataset.is_land_cover && (
            <span
              className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: "#30E87A18",
                color: "#22c55e",
                border: "1px solid #30E87A40",
              }}
            >
              Land cover
            </span>
          )}
          {dataset.cyclone_name && (
            <span
              className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: "#FF4B2B18",
                color: "#FF4B2B",
                border: "1px solid #FF4B2B40",
              }}
            >
              {dataset.cyclone_name}
            </span>
          )}
        </div>

        {/* Description */}
        {dataset.description && (
          <p
            className={cn(
              "text-xs leading-relaxed",
              !expanded && "line-clamp-2",
            )}
            style={{ color: colors.text.secondary }}
          >
            {dataset.description}
          </p>
        )}

        {/* Expand toggle for long descriptions */}
        {dataset.description && dataset.description.length > 120 && (
          <button
            type="button"
            className="self-start text-[11px] font-medium underline underline-offset-2"
            style={{ color: colors.accent.blue }}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}

        {/* Footer metadata */}
        <div
          className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-[11px]"
          style={{
            borderColor: colors.border.default,
            color: colors.text.muted,
          }}
        >
          {dataset.source && (
            <span className="flex items-center gap-1">
              <LuInfo className="size-3" />
              {dataset.source}
            </span>
          )}
          <span className="flex items-center gap-1">
            <LuCalendar className="size-3" />
            Updated {formatDate(dataset.updated)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accentColor,
}: {
  label: string;
  value: number;
  accentColor: string;
}) {
  return (
    <div
      className="flex min-h-[80px] flex-col overflow-hidden rounded-lg border"
      style={{
        borderColor: colors.border.default,
        backgroundColor: colors.bg.surface,
      }}
    >
      <div className="h-[2px] w-full shrink-0" style={{ backgroundColor: accentColor }} aria-hidden />
      <div className="flex flex-1 flex-col justify-center px-4 py-3">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.08em]"
          style={{ fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace", color: colors.text.muted }}
        >
          {label}
        </p>
        <p
          className="mt-1 text-[22px] font-bold leading-none tabular-nums"
          style={{ fontFamily: "'Segoe UI Variable', 'Segoe UI', ui-sans-serif, system-ui, sans-serif", color: colors.text.primary }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cluster selector
// ─────────────────────────────────────────────────────────────────────────────

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
        className="h-9 appearance-none rounded-lg border pl-3 pr-8 text-sm font-medium outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[color:var(--ring)]"
        style={
          {
            borderColor: colors.border.default,
            backgroundColor: colors.bg.surface,
            color: colors.text.primary,
            // CSS variable for Tailwind arbitrary focus:ring color (not a valid React CSSProperties key)
            ["--ring" as string]: colors.accent.blue,
          } as CSSProperties
        }
        aria-label="Select cluster"
      >
        <option value="">All clusters</option>
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
// Filter pills
// ─────────────────────────────────────────────────────────────────────────────

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
      style={
        active
          ? undefined
          : { borderColor: colors.border.default, color: colors.text.secondary }
      }
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
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <LuDatabase
        className="size-10 opacity-20"
        style={{ color: colors.text.muted }}
      />
      <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
        {query ? `No datasets matching "${query}"` : "No datasets found"}
      </p>
      <p className="max-w-[28rem] text-xs" style={{ color: colors.text.muted }}>
        {query
          ? "Try a different search term, or clear the active filters."
          : "No datasets are registered for this cluster. Add datasets via the admin panel."}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

const ALL_DATA_TYPES = ["tabular", "raster", "vector", "pmtiles"] as const;
const ALL_SEMANTIC_TYPES: DatasetType[] = [
  "baseline",
  "estimated_damage",
  "aid_resources_needed",
  "estimate_financial_damage",
];

export function DatasetsPage() {
  const [selectedCluster, setSelectedCluster] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeDataType, setActiveDataType] = useState<string | null>(null);
  const [activeSemanticType, setActiveSemanticType] = useState<DatasetType | null>(null);

  const { data: clusters, isPending: clustersPending } = useClusters();

  const {
    data: clusterDatasets,
    isPending: datasetsPending,
    error: datasetsError,
    refetch,
  } = useQuery({
    queryKey: ["datasets-catalog", selectedCluster],
    queryFn: () =>
      selectedCluster
        ? API.getDatasets(selectedCluster)
        : Promise.resolve([]),
    enabled: true,
    staleTime: 2 * 60 * 1000,
  });

  // Flat list of all datasets for the selected cluster (or empty)
  const allDatasets: Dataset[] = useMemo(
    () => (clusterDatasets ?? []).flatMap((g) => g.datasets),
    [clusterDatasets],
  );

  // Counts per data type (for filter pills)
  const countsByDataType = useMemo(
    () =>
      ALL_DATA_TYPES.reduce<Record<string, number>>((acc, dt) => {
        acc[dt] = allDatasets.filter((d) => d.dataType === dt).length;
        return acc;
      }, {}),
    [allDatasets],
  );

  // Counts per semantic type
  const countsBySemanticType = useMemo(
    () =>
      ALL_SEMANTIC_TYPES.reduce<Record<string, number>>((acc, st) => {
        acc[st] = allDatasets.filter((d) => d.type === st).length;
        return acc;
      }, {}),
    [allDatasets],
  );

  // Filtered list
  const filtered = useMemo(() => {
    let list = allDatasets;
    if (activeDataType) list = list.filter((d) => d.dataType === activeDataType);
    if (activeSemanticType) list = list.filter((d) => d.type === activeSemanticType);
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
  }, [allDatasets, activeDataType, activeSemanticType, searchQuery]);

  const isLoading = clustersPending || (selectedCluster !== "" && datasetsPending);
  const hasCluster = selectedCluster !== "";

  return (
    <div
      className="grid min-h-0 min-w-0 gap-6"
      style={{ gridTemplateRows: "auto auto auto minmax(0, 1fr)" }}
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
            Datasets
          </h1>
          <p
            className="mt-1 text-xs"
            style={{
              color: colors.text.muted,
              fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
            }}
          >
            Browse and inspect registered datasets · select a cluster to begin
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {hasCluster && (
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors hover:bg-muted/40"
              style={{ borderColor: colors.border.default, color: colors.text.secondary }}
              onClick={() => void refetch()}
            >
              <LuRefreshCw className="size-3.5" />
              Refresh
            </button>
          )}
          {clusters && (
            <ClusterSelector
              clusters={clusters}
              value={selectedCluster}
              onChange={(v) => {
                setSelectedCluster(v);
                setActiveDataType(null);
                setActiveSemanticType(null);
                setSearchQuery("");
              }}
            />
          )}
        </div>
      </header>

      {/* ── Stats row (only when a cluster is selected and data loaded) ── */}
      {hasCluster && !isLoading && allDatasets.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-5">
          <StatCard label="Total datasets" value={allDatasets.length} accentColor={colors.accent.blue} />
          <StatCard label="Tabular" value={countsByDataType.tabular} accentColor={colors.accent.blue} />
          <StatCard label="Raster" value={countsByDataType.raster} accentColor={colors.accent.green} />
          <StatCard label="Vector" value={countsByDataType.vector} accentColor={colors.accent.amber} />
          <StatCard label="PMTiles" value={countsByDataType.pmtiles} accentColor="#a855f7" />
        </div>
      )}

      {/* ── Filters bar ── */}
      {hasCluster && !isLoading && allDatasets.length > 0 && (
        <div className="flex min-w-0 flex-col gap-3">
          {/* Search */}
          <div className="relative max-w-md">
            <LuSearch
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2"
              style={{ color: colors.text.muted }}
            />
            <input
              type="search"
              placeholder="Search by name, description, or source…"
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

          {/* Data type filter */}
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace", color: colors.text.muted }}
            >
              Format
            </span>
            <FilterPill
              label="All"
              active={activeDataType === null}
              onClick={() => setActiveDataType(null)}
            />
            {ALL_DATA_TYPES.filter((dt) => countsByDataType[dt] > 0).map((dt) => (
              <FilterPill
                key={dt}
                label={DATA_TYPE_LABELS[dt]}
                active={activeDataType === dt}
                onClick={() => setActiveDataType(activeDataType === dt ? null : dt)}
                count={countsByDataType[dt]}
              />
            ))}

            <span
              className="ml-3 text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace", color: colors.text.muted }}
            >
              Type
            </span>
            <FilterPill
              label="All"
              active={activeSemanticType === null}
              onClick={() => setActiveSemanticType(null)}
            />
            {ALL_SEMANTIC_TYPES.filter((st) => countsBySemanticType[st] > 0).map((st) => (
              <FilterPill
                key={st}
                label={DATASET_TYPE_LABELS[st]}
                active={activeSemanticType === st}
                onClick={() => setActiveSemanticType(activeSemanticType === st ? null : st)}
                count={countsBySemanticType[st]}
              />
            ))}

            {/* Active filter summary + clear all */}
            {(activeDataType || activeSemanticType || searchQuery) && (
              <button
                type="button"
                className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium underline underline-offset-2"
                style={{ color: colors.accent.blue }}
                onClick={() => {
                  setActiveDataType(null);
                  setActiveSemanticType(null);
                  setSearchQuery("");
                }}
              >
                <LuX className="size-3" />
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Content area ── */}
      <div className="min-h-0 min-w-0">
        {/* No cluster selected — prompt */}
        {!hasCluster && !clustersPending && (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div
              className="flex size-16 items-center justify-center rounded-2xl border"
              style={{ borderColor: colors.border.default, backgroundColor: colors.bg.surface }}
            >
              <LuDatabase className="size-7 opacity-40" style={{ color: colors.text.primary }} />
            </div>
            <div>
              <p className="text-base font-semibold" style={{ color: colors.text.primary }}>
                Select a cluster to browse datasets
              </p>
              <p className="mt-1 max-w-[30rem] text-sm" style={{ color: colors.text.muted }}>
                Choose a cluster from the dropdown above. All registered datasets — tabular, raster,
                vector, and PMTiles — will appear here with their metadata.
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={`skeleton-${i}`}
                className="h-[160px] animate-pulse rounded-lg border"
                style={{
                  borderColor: colors.border.default,
                  backgroundColor: colors.bg.surface,
                }}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {datasetsError && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <p className="text-sm font-medium text-destructive">Failed to load datasets</p>
            <p className="max-w-sm text-xs" style={{ color: colors.text.muted }}>
              {datasetsError instanceof Error ? datasetsError.message : "Unknown error"}
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/40"
              style={{ borderColor: colors.border.default, color: colors.text.secondary }}
              onClick={() => void refetch()}
            >
              <LuRefreshCw className="size-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* Dataset grid */}
        {hasCluster && !isLoading && !datasetsError && (
          <>
            {filtered.length === 0 ? (
              <EmptyState query={searchQuery} />
            ) : (
              <>
                <p
                  className="mb-4 text-xs"
                  style={{ color: colors.text.muted, fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace" }}
                >
                  {filtered.length === allDatasets.length
                    ? `${allDatasets.length} dataset${allDatasets.length !== 1 ? "s" : ""}`
                    : `${filtered.length} of ${allDatasets.length} datasets`}
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((dataset) => (
                    <DatasetCard key={`${dataset.dataType}-${dataset.id}`} dataset={dataset} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
