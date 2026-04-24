/**
 * Single “Resilience” map mode in the shell. Hazard / climate / compare are contexts,
 * switched from Map data (sidebar) or shortcuts — not separate top-level modes.
 */
import { LuCircleHelp, LuLayers } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ScenarioId } from "@/config/scenarios";
import {
  HEADER_MODE_META,
  isHeaderModeId,
  type HeaderModeId,
} from "@/config/modes";

type Layout = "topbar" | "header";

export function ResilienceMapModeIndicator({
  scenarioId,
  layout,
  onHelpClick,
}: {
  scenarioId: ScenarioId;
  layout: Layout;
  onHelpClick: () => void;
}) {
  const active: HeaderModeId | null = isHeaderModeId(scenarioId) ? scenarioId : null;
  const contextLabel = active ? HEADER_MODE_META[active].label : null;

  const chip = (
    <div
      data-tour="view-mode"
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-lg border border-border bg-muted/60 px-2.5 py-1 shadow-sm md:px-3",
      )}
      role="status"
      aria-live="polite"
      aria-label={
        contextLabel
          ? `Resilience map — current context: ${contextLabel}`
          : "Resilience map"
      }
    >
      <LuLayers className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0">
        <span className="text-xs font-semibold text-foreground">Resilience</span>
        {contextLabel ? (
          <>
            <span className="text-muted-foreground/70" aria-hidden>
              ·
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {contextLabel}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );

  const help = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8 shrink-0 text-muted-foreground"
      aria-label="Resilience map: tools and context"
      onClick={onHelpClick}
    >
      <LuCircleHelp className="size-4" />
    </Button>
  );

  if (layout === "header") {
    if (active) {
      return (
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1">
            {chip}
            {help}
          </div>
          <p
            className={cn(
              "max-w-[min(100%,22rem)] px-1 text-center text-[10px] leading-snug text-muted-foreground",
              active === "compare" ? "block" : "hidden md:block",
            )}
          >
            <span className="sr-only">Current context: </span>
            {HEADER_MODE_META[active].subtitle}
          </p>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        {chip}
        {help}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {chip}
      {help}
    </div>
  );
}
