import "@/lib/highchartsSetup";

/**
 * Context-aware right panel. Content adapts to user selection:
 * - Raster → Legend + opacity
 * - Tabular → Charts + KPIs
 * - Feature → Drill-down insights
 * - Climate → Land accounts
 * When expanded: dashboard layout with compact filters and modern styling.
 */
import { Sidebar } from "../Sidebar";
import { AreaSelect } from "./AreaSelect";
import { CycloneSummaryBanner } from "./CycloneSummaryBanner";
import { AttributeFilterSelect } from "./AttributeFilterSelect";
import { TabularDatasetSelect } from "./TabularDatasetSelect";
import { YearSelect } from "./YearSelect";
import { ContextPanelContent } from "../ContextPanel/ContextPanelContent";
import { usePanelContext } from "@/hooks/usePanelContext";
import { useViewStore } from "@/store/view-store";
import { useUiStore } from "@/store/ui-store";
import { Suspense, lazy } from "react";
import { cn } from "@/lib/utils";

const FloatingKpiCards = lazy(() =>
  import("../FloatingKpiCards").then((m) => ({ default: m.default })),
);

const RightSidebar = () => {
  const { context, hasTabularInSelectedCluster } = usePanelContext();
  const scenarioId = useViewStore((s) => s.scenarioId);
  const selectedCluster = useUiStore((s) => s.selectedCluster);
  const selectedClimateModule = useUiStore((s) => s.selectedClimateModule);
  const rightSidebarExpanded = useUiStore((s) => s.rightSidebarExpanded);
  const hasRelevantContent =
    context !== "empty" ||
    hasTabularInSelectedCluster ||
    (!!selectedCluster && scenarioId !== "climate") ||
    (scenarioId === "climate" && !!selectedClimateModule);

  // Show a dot on the collapsed icon bar when there's relevant context content.
  const contextBadge = hasRelevantContent && context !== "empty" ? 1 : 0;

  return (
    <Sidebar
      direction="right"
      title="Context"
      collapseWhen={!hasRelevantContent}
      badgeCount={contextBadge}
    >
      <div
        data-tour="area-filter"
        className={cn(
          "sticky top-0 z-10 space-y-3 border-b border-border bg-card/95 py-4 backdrop-blur-sm supports-[backdrop-filter]:bg-card/85",
          rightSidebarExpanded ? "px-6" : "px-5 max-md:space-y-4 md:px-6",
        )}
      >
        <AreaSelect />
        <CycloneSummaryBanner />
      </div>
      <div
        className={cn(
          "scrollbar-thin flex-1 overflow-auto bg-card leading-relaxed",
          rightSidebarExpanded
            ? "min-h-0 bg-gradient-to-b from-muted/20 to-background px-6 py-6"
            : "space-y-4 px-5 py-5 max-md:space-y-5 max-md:py-5 max-md:text-sm md:px-6 md:py-6 md:space-y-4",
        )}
      >
        {!hasTabularInSelectedCluster &&
          selectedCluster &&
          scenarioId !== "climate" && (
          <p
            className="mb-4 rounded-[var(--drmis-radius-card)] border border-amber-200/80 bg-[rgba(245,166,35,0.1)] px-4 py-3.5 text-sm leading-relaxed text-[var(--drmis-text-on-amber)] dark:border-amber-800 dark:bg-amber-950/50 dark:text-[var(--drmis-text-on-amber)]"
          >
            This cluster has no tabular dataset. Select province and area council to filter map
            layers.
          </p>
        )}
        {rightSidebarExpanded ? (
          <div className="w-full space-y-6">
            <div className="flex flex-wrap items-end gap-6 rounded-[var(--drmis-radius-card)] border border-border/40 bg-card/95 p-5 shadow-[var(--drmis-shadow-sm)]">
              <TabularDatasetSelect />
              {scenarioId === "climate" ? null : (
                <div data-tour="year-filter">
                  <YearSelect />
                </div>
              )}
            </div>
            <AttributeFilterSelect />
            <Suspense fallback={null}>
              <FloatingKpiCards />
            </Suspense>
            <ContextPanelContent />
          </div>
        ) : (
          <>
            <TabularDatasetSelect />
            <AttributeFilterSelect />
            {scenarioId === "climate" ? null : (
              <div data-tour="year-filter">
                <YearSelect />
              </div>
            )}
            <Suspense fallback={null}>
              <FloatingKpiCards />
            </Suspense>
            <ContextPanelContent />
          </>
        )}
      </div>
    </Sidebar>
  );
};

export { RightSidebar };
