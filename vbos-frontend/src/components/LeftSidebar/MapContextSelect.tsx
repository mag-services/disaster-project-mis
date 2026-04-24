/**
 * Map data: thematic clusters, climate modules, or Compare — switches resilience context
 * (disaster / climate / compare) without a separate header mode row.
 */
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLIMATE_MODULES, type ClimateModuleId } from "@/config/climate";
import type { ICluster } from "@/types/api";
import { useUiStore } from "@/store/ui-store";
import { useViewStore } from "@/store/view-store";
import { useModeTransition } from "@/hooks/useModeTransition";

const PREFIX_CLUSTER = "c:";
const PREFIX_MODULE = "m:";
const VALUE_COMPARE = "__compare__";

function parseClusterValue(v: string): string | null {
  if (!v.startsWith(PREFIX_CLUSTER)) return null;
  return v.slice(PREFIX_CLUSTER.length) || null;
}

function parseModuleValue(v: string): ClimateModuleId | null {
  if (!v.startsWith(PREFIX_MODULE)) return null;
  const id = v.slice(PREFIX_MODULE.length) as ClimateModuleId;
  return CLIMATE_MODULES.some((m) => m.id === id) ? id : null;
}

function currentSelectValue(
  scenarioId: string,
  selectedCluster: string,
  selectedClimateModule: string,
): string {
  if (scenarioId === "compare") return VALUE_COMPARE;
  if (scenarioId === "climate") {
    const m = selectedClimateModule || CLIMATE_MODULES[0]?.id;
    return m ? `${PREFIX_MODULE}${m}` : "";
  }
  return selectedCluster ? `${PREFIX_CLUSTER}${selectedCluster}` : "";
}

export function MapContextSelect({ clusters }: { clusters: ICluster[] }) {
  const scenarioId = useViewStore((s) => s.scenarioId);
  const selectedCluster = useUiStore((s) => s.selectedCluster);
  const setSelectedCluster = useUiStore((s) => s.setSelectedCluster);
  const selectedClimateModule = useUiStore((s) => s.selectedClimateModule);
  const setSelectedClimateModule = useUiStore((s) => s.setSelectedClimateModule);
  const { switchToMode } = useModeTransition();

  const value = currentSelectValue(
    scenarioId,
    selectedCluster,
    selectedClimateModule,
  );

  const onValueChange = (v: string) => {
    if (v === VALUE_COMPARE) {
      switchToMode("compare");
      return;
    }
    const mod = parseModuleValue(v);
    if (mod) {
      switchToMode("climate");
      setSelectedClimateModule(mod);
      return;
    }
    const clusterName = parseClusterValue(v);
    if (clusterName) {
      switchToMode("disaster");
      setSelectedCluster(clusterName);
    }
  };

  return (
    <div data-tour="map-context" className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">Map data</label>
      <Select value={value || undefined} onValueChange={onValueChange}>
        <SelectTrigger className="w-full rounded-md border-border bg-muted/50">
          <SelectValue placeholder="Select cluster or module…" />
        </SelectTrigger>
        <SelectContent className="max-h-[min(24rem,70vh)]">
          <SelectGroup>
            <SelectLabel>Compare</SelectLabel>
            <SelectItem value={VALUE_COMPARE}>Compare years (swipe &amp; deltas)</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Thematic &amp; hazard</SelectLabel>
            {clusters.map((cluster) => (
              <SelectItem key={cluster.id} value={`${PREFIX_CLUSTER}${cluster.name}`}>
                {cluster.name}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Climate</SelectLabel>
            {CLIMATE_MODULES.map((m) => (
              <SelectItem key={m.id} value={`${PREFIX_MODULE}${m.id}`}>
                {m.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
