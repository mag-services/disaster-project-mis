/**
 * Dataset selector for tabular layers. Uses tabs for view type (Baseline, Damage, Resources, Financial)
 * and a dropdown for the specific dataset within that type.
 * Filters datasets by the cluster selected in the left sidebar.
 */
import { startTransition, useEffect, useMemo, useRef } from "react";
import { Label } from "@/components/ui/label";
import { colors } from "@/tokens";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLayerStore } from "@/store/layer-store";
import { useUiStore } from "@/store/ui-store";
import { useViewStore } from "@/store/view-store";
import { useScenario } from "@/hooks/useScenario";
import { useCycloneEvents } from "@/hooks/useCycloneEvents";
import { cn } from "@/lib/utils";
import {
  LuDatabase,
  LuTriangleAlert,
  LuPackage,
  LuBanknote,
  LuWind,
} from "react-icons/lu";
import type { DatasetType } from "@/types/api";
import { DISASTER_VIEW_TYPES } from "@/store/ui-store";

interface ViewTypeConfig {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  activeTabClass: string;
  activeIconClass: string;
  idleIconClass: string;
}

const VIEW_TYPE_CONFIG: Record<DatasetType, ViewTypeConfig> = {
  baseline: {
    label: "Baseline",
    description: "Pre-disaster reference data",
    icon: LuDatabase,
    activeTabClass:
      "data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-700 data-[state=active]:border-blue-400/40 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-500/40",
    activeIconClass: "text-blue-600 dark:text-blue-400",
    idleIconClass: "text-muted-foreground/50",
  },
  estimated_damage: {
    label: "Damage",
    description: "Estimated damage from hazard event",
    icon: LuTriangleAlert,
    activeTabClass:
      "data-[state=active]:bg-red-500/10 data-[state=active]:text-red-700 data-[state=active]:border-red-400/40 dark:data-[state=active]:text-red-400 dark:data-[state=active]:border-red-500/40",
    activeIconClass: "text-red-600 dark:text-red-400",
    idleIconClass: "text-muted-foreground/50",
  },
  aid_resources_needed: {
    label: "Resources",
    description: "Aid and resources required",
    icon: LuPackage,
    activeTabClass:
      "data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-700 data-[state=active]:border-amber-400/40 dark:data-[state=active]:text-amber-400 dark:data-[state=active]:border-amber-500/40",
    activeIconClass: "text-amber-600 dark:text-amber-400",
    idleIconClass: "text-muted-foreground/50",
  },
  estimate_financial_damage: {
    label: "Financial",
    description: "Financial loss estimate",
    icon: LuBanknote,
    activeTabClass:
      "data-[state=active]:bg-green-500/10 data-[state=active]:text-green-700 data-[state=active]:border-green-400/40 dark:data-[state=active]:text-green-400 dark:data-[state=active]:border-green-500/40",
    activeIconClass: "text-green-600 dark:text-green-400",
    idleIconClass: "text-muted-foreground/50",
  },
};

const VIEW_TYPE_ORDER: DatasetType[] = [
  "baseline",
  "estimated_damage",
  "aid_resources_needed",
  "estimate_financial_damage",
];


function clusterMatches(datasetCluster: string | null | undefined, selected: string): boolean {
  if (!selected) return true;
  return (datasetCluster ?? "").toLowerCase() === selected.toLowerCase();
}

export function TabularDatasetSelect() {
  const scenario = useScenario();
  const { allDatasets, layers, switchLayer } = useLayerStore();
  const scenarioId = useViewStore((s) => s.scenarioId);
  const selectedCluster = useUiStore((s) => s.selectedCluster);
  const setSelectedViewType = useUiStore((s) => s.setSelectedViewType);
  const activeRiskSource = useUiStore((s) => s.activeRiskSource);
  const selectedCycloneEventId = useUiStore((s) => s.selectedCycloneEventId);

  const currentTabularId = layers
    .split(",")
    .find((l) => l.startsWith("t"));
  const activeTabularMeta = currentTabularId
    ? allDatasets.find(
      (d) =>
        d.dataType === "tabular" && `t${d.id}` === currentTabularId,
    )
    : null;
  const tabularDatasets = useMemo(() => {
    const fromCluster = allDatasets.filter((d) => {
      if (d.dataType !== "tabular") return false;
      if (!clusterMatches(d.cluster, selectedCluster)) return false;
      // For RAP output types: when a specific cyclone event is chosen, show only
      // datasets linked to that event. Datasets without cyclone_event (e.g. legacy
      // or un-tagged rows) are still shown so the UI degrades gracefully.
      if (
        selectedCycloneEventId !== null &&
        DISASTER_VIEW_TYPES.includes(d.type as (typeof DISASTER_VIEW_TYPES)[number])
      ) {
        const evId = (d as import("@/types/api").TabularDataset).cyclone_event?.id;
        if (evId != null && evId !== selectedCycloneEventId) return false;
      }
      return true;
    });
    // Only include activeTabularMeta from another source when it's in the selected cluster
    // (e.g. Damage tab from same cluster). Never include when switching clusters — avoids
    // showing stale Education KPIs after switching to Telecommunications.
    if (
      activeTabularMeta &&
      !fromCluster.some((d) => d.id === activeTabularMeta.id) &&
      clusterMatches(activeTabularMeta.cluster, selectedCluster)
    ) {
      return [...fromCluster, activeTabularMeta];
    }
    return fromCluster;
  }, [allDatasets, selectedCluster, activeTabularMeta, selectedCycloneEventId]);

  const datasetsByType = useMemo(() => {
    const map = new Map<DatasetType, typeof tabularDatasets>();
    for (const type of VIEW_TYPE_ORDER) {
      map.set(type, tabularDatasets.filter((d) => d.type === type));
    }
    return map;
  }, [tabularDatasets]);

  const currentDataset = currentTabularId
    ? tabularDatasets.find((d) => `t${d.id}` === currentTabularId)
    : null;

  const prevClusterRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedCluster) return;
    if (tabularDatasets.length === 0) {
      if (currentTabularId) {
        startTransition(() => switchLayer(currentTabularId));
      }
      return;
    }
    const clusterChanged = prevClusterRef.current !== selectedCluster;
    prevClusterRef.current = selectedCluster;
    if (!clusterChanged) return;
    const inCluster =
      currentDataset && clusterMatches(currentDataset.cluster, selectedCluster);
    if (!inCluster) {
      const firstFromCluster = tabularDatasets.find((d) =>
        clusterMatches(d.cluster, selectedCluster),
      );
      if (firstFromCluster)
        startTransition(() => switchLayer(`t${firstFromCluster.id}`));
    }
  }, [selectedCluster, tabularDatasets, currentDataset, currentTabularId, switchLayer]);

  // Only show RAP output types (Damage, Resources, Financial) when a risk source is active.
  // Without a risk source, show Baseline only — these are cyclone-RAP-only outputs.
  const typesWithData = VIEW_TYPE_ORDER.filter((t) => {
    if ((datasetsByType.get(t)?.length ?? 0) === 0) return false;
    if (DISASTER_VIEW_TYPES.includes(t) && !activeRiskSource) return false;
    return true;
  });
  const currentType = currentDataset?.type ?? typesWithData[0] ?? null;

  useEffect(() => {
    setSelectedViewType(currentType);
  }, [currentType, setSelectedViewType]);

  const { data: cycloneEvents } = useCycloneEvents();
  const activeCycloneEvent = selectedCycloneEventId != null
    ? cycloneEvents?.find((e) => e.id === selectedCycloneEventId)
    : null;

  const hasTabularAllowed = scenario.allowedLayerTypes.includes("tabular");
  if (!hasTabularAllowed || scenarioId === "climate") return null;
  if (tabularDatasets.length === 0) return null;

  const datasetsInType = datasetsByType.get(currentType!) ?? [];

  const handleTypeChange = (type: string) => {
    const list = datasetsByType.get(type as DatasetType);
    if (list?.length) {
      const first = list[0];
      const targetId = `t${first.id}`;
      // Only switch if changing to a different layer; re-clicking same tab must not toggle it off
      if (targetId !== currentTabularId) {
        startTransition(() => switchLayer(targetId));
      }
    }
  };

  const handleDatasetChange = (v: string) => {
    if (v) startTransition(() => switchLayer(v));
  };

  const activeDescription = currentType ? VIEW_TYPE_CONFIG[currentType].description : null;

  return (
    <div className="w-full space-y-3">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Data view
      </Label>
      {activeCycloneEvent ? (
        <div className="flex items-center gap-1.5 rounded-md border border-blue-400/30 bg-blue-500/8 px-2 py-1.5 text-xs">
          <LuWind className="size-3.5 shrink-0 text-blue-500" aria-hidden />
          <span className="font-medium text-foreground">{activeCycloneEvent.name}</span>
          <span className="text-muted-foreground">{activeCycloneEvent.season_year}</span>
        </div>
      ) : null}
      <Tabs
        value={currentType}
        onValueChange={handleTypeChange}
        className="w-full"
      >
        <TabsList className="grid !h-auto w-full gap-0.5 rounded-lg border border-border/50 bg-muted/40 p-1 group-data-[orientation=horizontal]/tabs:!h-auto"
          style={{ gridTemplateColumns: `repeat(${typesWithData.length}, minmax(0, 1fr))` }}
        >
          {typesWithData.map((type) => {
            const cfg = VIEW_TYPE_CONFIG[type];
            const Icon = cfg.icon;
            const isActive = currentType === type;
            return (
              <TabsTrigger
                key={type}
                value={type}
                className={cn(
                  "flex !h-auto min-h-12 flex-col items-center gap-1 rounded-md border border-transparent px-1 py-2 text-xs font-medium leading-tight transition-all",
                  cfg.activeTabClass,
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    isActive ? cfg.activeIconClass : cfg.idleIconClass,
                  )}
                />
                {cfg.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {activeDescription && currentType !== "baseline" && (
          <p className="mt-1.5 text-[11px] text-muted-foreground leading-snug px-0.5">
            {activeDescription}
          </p>
        )}
        {datasetsInType.length > 1 && (
          <div className="mt-3 space-y-2">
            <Label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Dataset
            </Label>
            <Select
              value={currentTabularId ?? ""}
              onValueChange={handleDatasetChange}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select dataset" />
              </SelectTrigger>
              <SelectContent>
                {datasetsInType.map((d) => (
                  <SelectItem key={`t${d.id}`} value={`t${d.id}`}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {currentDataset && datasetsInType.length <= 1 && (
          <a
            href={`/admin/datasets/tabulardataset/${currentDataset.id}/change/`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex"
            style={{
              fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
              fontSize: "10px",
              color: colors.text.muted,
              textDecoration: "none",
            }}
          >
            Manage dataset ↗
          </a>
        )}
      </Tabs>
    </div>
  );
}
