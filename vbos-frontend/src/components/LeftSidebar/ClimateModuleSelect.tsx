/**
 * Climate module dropdown. One module at a time — when selected, only that module's
 * content is shown (no mixing).
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LuLeaf } from "react-icons/lu";
import { CLIMATE_MODULES } from "@/config/climate";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

type ClimateModuleSelectProps = {
  /** Compact style for header (no label, narrower trigger) */
  compact?: boolean;
};

export function ClimateModuleSelect({ compact }: ClimateModuleSelectProps) {
  const selectedClimateModule = useUiStore((s) => s.selectedClimateModule);
  const setSelectedClimateModule = useUiStore((s) => s.setSelectedClimateModule);

  return (
    <div className={cn("space-y-1.5", compact && "space-y-0")}>
      {!compact && (
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <LuLeaf className="size-3.5" />
          Climate module
        </label>
      )}
      <Select
        value={selectedClimateModule || undefined}
        onValueChange={(v) => setSelectedClimateModule(v || "")}
      >
        <SelectTrigger
          className={cn(
            "rounded-md border-border bg-muted/50",
            compact ? "h-8 w-[200px] md:w-[220px]" : "w-full",
          )}
        >
          <SelectValue placeholder="Select module..." />
        </SelectTrigger>
        <SelectContent>
          {CLIMATE_MODULES.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
