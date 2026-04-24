import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { getClusterIcon } from "./clusterIcons";
import { LayerSwitch } from "./LayerSwitch";
import { Skeleton } from "@/components/ui/skeleton";
import { useClusterDatasets } from "@/hooks/useClusters";
import { DATASET_TYPES } from "@/utils/datasetTypes";
import type { DatasetType } from "@/types/api";
import { LuSearch } from "react-icons/lu";

type ClusterFlyoutProps = {
  clusterName: string;
  onExpand: () => void;
};

export function ClusterFlyout({ clusterName, onExpand }: ClusterFlyoutProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: clusterDatasets, isPending, error } = useClusterDatasets(
    clusterName,
    { enabled: open },
  );
  const ClusterIcon = getClusterIcon(clusterName);
  const searchLower = search.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!clusterDatasets) return [];
    if (!searchLower) return clusterDatasets;
    return clusterDatasets
      .map((group) => ({
        ...group,
        datasets: group.datasets.filter((d) => d.name.toLowerCase().includes(searchLower)),
      }))
      .filter((group) => group.datasets.length > 0);
  }, [clusterDatasets, searchLower]);

  const highlightText = (text: string) => {
    if (!searchLower) return text;
    const lower = text.toLowerCase();
    const idx = lower.indexOf(searchLower);
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + searchLower.length);
    const after = text.slice(idx + searchLower.length);
    return (
      <>
        {before}
        <mark className="rounded bg-yellow-200/70 px-0.5 text-foreground dark:bg-yellow-500/30">
          {match}
        </mark>
        {after}
      </>
    );
  };

  return (
    <HoverCard
      open={open}
      onOpenChange={setOpen}
      openDelay={80}
      closeDelay={150}
    >
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={`Open ${clusterName}`}
          onClick={onExpand}
        >
          <ClusterIcon className="size-4" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-72 max-h-[min(70vh,420px)] overflow-y-auto border border-border bg-popover p-0"
      >
        <div className="sticky top-0 z-10 space-y-2 border-b border-border bg-popover px-3 py-2">
          <h3 className="text-sm font-semibold">{clusterName}</h3>
          <div className="relative">
            <LuSearch className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search datasets..."
              className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/40"
              aria-label="Search datasets in cluster"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1 p-2">
          {error ? (
            <div className="px-2 py-3 text-sm text-amber-600 dark:text-amber-400">
              Error loading data
            </div>
          ) : isPending ? (
            <div className="space-y-2 px-2 py-3" role="status" aria-label="Loading">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            filteredGroups.length === 0 ? (
              <div className="px-2 py-3 text-xs text-muted-foreground">
                No datasets matching "{search}".
              </div>
            ) : (
            <Accordion type="multiple" className="space-y-0.5">
              {filteredGroups.map((typeGroup) => (
                <AccordionItem
                  key={typeGroup.type}
                  value={typeGroup.type}
                  className="rounded-lg border-0 bg-muted/30 dark:bg-muted/20"
                >
                  <AccordionTrigger className="px-3 py-2 text-sm font-normal hover:no-underline hover:bg-muted/40 rounded-lg [&>svg]:shrink-0">
                    {DATASET_TYPES[typeGroup.type as DatasetType]}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-1 px-3 pb-2 pt-0">
                      {typeGroup.datasets.map((dataset) => (
                        <div key={`${dataset.dataType}-${dataset.id}`} className="flex items-center">
                          <LayerSwitch
                            dataType={dataset.dataType}
                            id={dataset.id}
                            title={highlightText(dataset.name)}
                          />
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            )
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
