/**
 * Impact Mode: Estimated affected population card.
 */
import { useScenario } from "@/hooks/useScenario";
import { useImpactModeStore } from "@/store/impact-mode-store";
import { useEstimatedAffectedPopulation } from "@/hooks/useEstimatedAffectedPopulation";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LuUsers, LuZap } from "react-icons/lu";
import { formatCompactNumber } from "@/utils/formatCharts";

export function ImpactModeCard() {
  const scenario = useScenario();
  const { enabled, setEnabled } = useImpactModeStore();
  const result = useEstimatedAffectedPopulation();

  if (scenario.id !== "climate") return null;

  const canCompute = result !== null;
  const showCard = enabled && canCompute;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <LuZap className="size-4 text-amber-500" />
          <span className="text-sm font-medium">Impact Mode</span>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
          disabled={!canCompute}
        />
      </div>
      {enabled && !canCompute && (
        <p className="text-xs text-muted-foreground">
          Enable a dataset with both population and hazard/exposure attributes.
        </p>
      )}
      {showCard && (
        <Card className="overflow-hidden border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold leading-none">
              <LuUsers className="size-4" />
              Estimated affected population
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 pt-0">
            <p className="font-mono-num text-2xl font-bold tabular-nums">
              {formatCompactNumber(result.affected)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Population in areas with {result.hazardAttr.replace(/_/g, " ")} &gt; 0
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
