/**
 * Toggle and year selectors for side-by-side comparison mode.
 * In Climate mode, defaults to 2020/2023 for land cover comparison.
 */
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useComparisonStore } from "@/store/comparison-store";
import { useScenario } from "@/hooks/useScenario";
import { LuGitCompare, LuSlidersHorizontal, LuFlame } from "react-icons/lu";

const LAND_COVER_YEARS = ["2020", "2023"];

export function ComparisonMode() {
  const scenario = useScenario();
  const {
    comparisonMode,
    comparisonView,
    setComparisonMode,
    setComparisonView,
    yearLeft,
    yearRight,
    setYearLeft,
    setYearRight,
    minYear,
    maxYear,
  } = useComparisonStore();

  const handleComparisonToggle = (enabled: boolean) => {
    setComparisonMode(enabled);
    if (enabled && scenario.uiConfig.showComparison) {
      setYearLeft("2020");
      setYearRight("2023");
    }
  };

  const years = scenario.uiConfig.showComparison
      ? LAND_COVER_YEARS
      : Array.from(
          { length: maxYear - minYear + 1 },
          (_, i) => String(minYear + i),
        ).reverse();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label
          htmlFor="comparison-mode"
          className="flex cursor-pointer items-center gap-2 text-sm font-medium"
        >
          <LuGitCompare className="size-4 text-primary" />
          Compare years
        </Label>
        <Switch
          id="comparison-mode"
          checked={comparisonMode}
          onCheckedChange={handleComparisonToggle}
        />
      </div>
      {comparisonMode && (
        <div className="space-y-3">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setComparisonView("swipe")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                comparisonView === "swipe"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <LuSlidersHorizontal className="size-3.5" />
              Swipe
            </button>
            <button
              type="button"
              onClick={() => setComparisonView("delta")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                comparisonView === "delta"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <LuFlame className="size-3.5" />
              Delta
            </button>
          </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Left (baseline)</Label>
            <Select value={yearLeft} onValueChange={setYearLeft}>
              <SelectTrigger className="glass-select-trigger h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Right (compare)</Label>
            <Select value={yearRight} onValueChange={setYearRight}>
              <SelectTrigger className="glass-select-trigger h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
