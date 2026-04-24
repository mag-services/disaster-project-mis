import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { getClusterIcon } from "./clusterIcons";
import { DatasetSection } from "./DatasetSection";
import { useClusterDatasets } from "@/hooks/useClusters";
import { useActiveLayerCount } from "@/hooks/useActiveLayerCount";
import { useScenario } from "@/hooks/useScenario";
import { isLayerAllowed, isClusterTypeAllowed } from "@/config/scenarios";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

type ClusterProps = {
  name: string;
  id: number;
  isExpanded: boolean;
  searchQuery?: string;
};

const Cluster = ({ name, id, isExpanded, searchQuery = "" }: ClusterProps) => {
  const isSearching = !!searchQuery.trim();
  const scenario = useScenario();
  const { data: clusterDatasets, isPending, error } = useClusterDatasets(name, {
    enabled: isExpanded || isSearching,
  });
  const ClusterIcon = getClusterIcon(name);

  const allDatasets = useMemo(() => {
    if (!clusterDatasets) return undefined;
    return clusterDatasets.flatMap((typeGroup) => typeGroup.datasets);
  }, [clusterDatasets]);

  const filteredTypeGroups = useMemo(() => {
    let result = clusterDatasets ?? [];
    if (scenario.allowedLayerTypes.length > 0 || scenario.allowedClusterTypes.length > 0) {
      result = result
        .filter((tg) => isClusterTypeAllowed(scenario, tg.type))
        .map((tg) => ({
          ...tg,
          datasets: tg.datasets
            .filter((d) => isLayerAllowed(scenario, d.dataType))
            .filter((d) => d.dataType !== "tabular"),
        }))
        .filter((tg) => tg.datasets.length > 0);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result
        .map((tg) => ({
          ...tg,
          datasets: tg.datasets.filter(
            (d) =>
              (d.name && String(d.name).toLowerCase().includes(q)) ||
              (tg.type && String(tg.type).toLowerCase().includes(q)) ||
              (d.cluster && String(d.cluster).toLowerCase().includes(q)),
          ),
        }))
        .filter((tg) => tg.datasets.length > 0);
    }
    return result;
  }, [clusterDatasets, searchQuery, scenario]);

  const activeLayerCount = useActiveLayerCount(allDatasets);

  if (isSearching && !isPending && filteredTypeGroups?.length === 0) {
    return null;
  }

  return (
    <AccordionItem
      value={`${id}`}
      className="mx-2 mb-2 rounded-lg border border-border bg-card shadow-sm last:mb-0"
    >
      <AccordionTrigger
        className={cn(
          "cursor-pointer px-4 py-3 [&>svg]:shrink-0 [&>svg]:transition-transform [&>svg]:duration-200",
          "hover:no-underline hover:bg-muted/50",
          "rounded-lg rounded-b-none",
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          <ClusterIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 truncate text-sm font-medium">
            {name}
          </span>
          {activeLayerCount > 0 && (
            <span
              className={cn(
                "shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary",
                "text-primary",
              )}
            >
              {activeLayerCount}
            </span>
          )}
        </span>
      </AccordionTrigger>
      <AccordionContent className="rounded-b-lg px-2 pb-3 pt-0">
        {error ? (
          <div className="rounded-lg p-4 text-sm text-amber-600 dark:text-amber-400">
            Error loading data: {String(error)}
          </div>
        ) : isPending ? (
          <div className="space-y-3 px-4 py-2" role="status" aria-label="Loading datasets">
            <div className="space-y-1">
              <Skeleton className="h-5 w-[100px]" />
              <div className="space-y-1 pl-3">
                <Skeleton className="h-1.5 w-[80%]" />
                <Skeleton className="h-1.5 w-[95%]" />
                <Skeleton className="h-1.5 w-[90%]" />
              </div>
            </div>
            <div className="space-y-1">
              <Skeleton className="h-5 w-[120px]" />
              <div className="space-y-1 pl-3">
                <Skeleton className="h-1.5 w-full" />
                <Skeleton className="h-1.5 w-[92%]" />
              </div>
            </div>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-1">
            {filteredTypeGroups?.map((item) => (
              <DatasetSection
                title={item.type}
                datasets={item.datasets}
                key={item.type}
              />
            ))}
          </Accordion>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

export { Cluster };
