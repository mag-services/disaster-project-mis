import type { ReactNode } from "react";
import {
  LuActivity,
  LuChevronRight,
  LuCloudRain,
  LuColumns2,
  LuGlobe,
  LuHourglass,
  LuLeaf,
  LuLoader,
  LuMapPinned,
  LuMountain,
  LuSun,
  LuThermometer,
  LuThermometerSun,
  LuUsers,
  LuWaves,
  LuWind,
  LuX,
} from "react-icons/lu";
import type { IconType } from "react-icons";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  LAYER_BROWSER_TABS,
  RISK_SOURCE_GROUPS,
  CONTEXTUAL_ENTRIES,
  applyRiskNavigation,
  applyCycloneEventNavigation,
  type ApplyRiskNavDeps,
  type LayerBrowserTabId,
  type NavGlyph,
} from "@/config/riskSourcesNavigation";
import { useCycloneEvents } from "@/hooks/useCycloneEvents";
import { useUiStore } from "@/store/ui-store";

const GLYPH_MAP: Record<NavGlyph, IconType> = {
  hourglass: LuHourglass,
  activity: LuActivity,
  globe: LuGlobe,
  waves: LuWaves,
  wind: LuWind,
  cloudRain: LuCloudRain,
  mountain: LuMountain,
  sun: LuSun,
  thermometerSun: LuThermometerSun,
  thermometer: LuThermometer,
  mapPinned: LuMapPinned,
  users: LuUsers,
  leaf: LuLeaf,
  columns2: LuColumns2,
};

function NavGlyphIcon({
  glyph,
  className,
}: {
  glyph: NavGlyph;
  className?: string;
}) {
  const Ic = GLYPH_MAP[glyph];
  return <Ic className={cn("size-4 shrink-0 text-muted-foreground", className)} aria-hidden />;
}

function normalizeSearch(q: string): string {
  return q.trim().toLowerCase();
}

type LayerBrowserBrowseProps = {
  tab: LayerBrowserTabId;
  onTabChange: (t: LayerBrowserTabId) => void;
  search: string;
  onSearchChange: (q: string) => void;
  navDeps: ApplyRiskNavDeps;
  /** Cluster / module selector + dataset accordion (Elements tab). */
  elementsPanel: ReactNode;
  /** After jumping from Risk sources / Contextual, switch to Elements to pick layers. */
  onNavigateComplete?: () => void;
};

export function LayerBrowserBrowse({
  tab,
  onTabChange,
  search,
  onSearchChange,
  navDeps,
  elementsPanel,
  onNavigateComplete,
}: LayerBrowserBrowseProps) {
  const runNav = (target: Parameters<typeof applyRiskNavigation>[0]) => {
    applyRiskNavigation(target, navDeps);
    // cyclone_event_picker targets don't navigate away — accordion stays open
    if (target.type !== "cyclone_event_picker") onNavigateComplete?.();
  };

  const { data: cycloneEvents, isPending: cycloneEventsPending } = useCycloneEvents();
  const selectedCycloneEventId = useUiStore((s) => s.selectedCycloneEventId);

  const q = normalizeSearch(search);

  const filteredRiskGroups = RISK_SOURCE_GROUPS.map((g) => ({
    ...g,
    entries: g.entries.filter(
      (e) =>
        !q ||
        e.label.toLowerCase().includes(q) ||
        g.label.toLowerCase().includes(q),
    ),
  })).filter((g) => g.entries.length > 0);

  const filteredContextual = CONTEXTUAL_ENTRIES.filter(
    (e) =>
      !q ||
      e.label.toLowerCase().includes(q) ||
      (e.description && e.description.toLowerCase().includes(q)),
  );

  const showSearch = tab === "risk_sources" || tab === "contextual";

  return (
    <>
      <div className="mb-3 flex gap-0 border-b border-border">
        {LAYER_BROWSER_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={cn(
              "relative flex-1 px-1.5 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors",
              "hover:text-foreground",
              tab === t.id && "text-foreground",
            )}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
            {tab === t.id ? (
              <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-primary" />
            ) : null}
          </button>
        ))}
      </div>

      {showSearch ? (
        <div className="mb-3">
          <Input
            placeholder="Search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 rounded-md border-border bg-muted/40 text-sm"
            aria-label="Search risk sources and contextual entries"
          />
        </div>
      ) : null}

      {tab === "elements" ? elementsPanel : null}

      {tab === "risk_sources" ? (
        filteredRiskGroups.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No risk sources match your search.
          </p>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={filteredRiskGroups.map((g) => g.id)}
            className="space-y-1"
          >
            {filteredRiskGroups.map((group) => (
              <AccordionItem
                key={group.id}
                value={group.id}
                className="rounded-lg border border-border bg-muted/20 px-1"
              >
                <AccordionTrigger className="px-2 py-2 text-sm font-medium hover:no-underline [&[data-state=open]>svg]:rotate-180">
                  <span className="flex items-center gap-2">
                    <NavGlyphIcon glyph={group.glyph} className="size-3.5" />
                    {group.label}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-0.5 px-1 pb-2 pt-0">
                  {group.entries.map((entry) =>
                    entry.target.type === "cyclone_event_picker" ? (
                      // Cyclone: nested accordion of specific events
                      <Accordion
                        key={entry.id}
                        type="single"
                        collapsible
                        className="mt-0.5"
                      >
                        <AccordionItem
                          value="cyclone-events"
                          className="rounded-md border border-border/60 bg-muted/10"
                        >
                          <AccordionTrigger className="px-2 py-2 text-xs font-medium hover:no-underline [&[data-state=open]>svg]:rotate-180">
                            <span className="flex items-center gap-2">
                              <NavGlyphIcon glyph={entry.glyph} className="size-3.5" />
                              {entry.label}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="px-1 pb-2 pt-0">
                            {cycloneEventsPending ? (
                              <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground">
                                <LuLoader className="size-3.5 animate-spin" />
                                Loading events…
                              </div>
                            ) : !cycloneEvents?.length ? (
                              <p className="px-2 py-2 text-xs text-muted-foreground">
                                No cyclone events recorded yet.
                              </p>
                            ) : (
                              <ul className="space-y-0.5">
                                {cycloneEvents.map((ev) => {
                                  const isActive = selectedCycloneEventId === ev.id;
                                  return (
                                    <li key={ev.id}>
                                      <button
                                        type="button"
                                        className={cn(
                                          "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors",
                                          isActive
                                            ? "bg-primary/10 font-semibold text-primary"
                                            : "hover:bg-muted/60",
                                        )}
                                        onClick={() => {
                                          const t = entry.target;
                                          if (t.type !== "cyclone_event_picker") return;
                                          applyCycloneEventNavigation(
                                            ev.id,
                                            t.clusterNames,
                                            navDeps,
                                          );
                                          onNavigateComplete?.();
                                        }}
                                      >
                                        <span className="min-w-0 flex-1">
                                          {ev.name}
                                          <span className="ml-1.5 text-muted-foreground">
                                            {ev.season_year}
                                          </span>
                                        </span>
                                        {isActive ? (
                                          <button
                                            type="button"
                                            aria-label={`Clear ${ev.name} selection`}
                                            className="ml-auto flex shrink-0 items-center gap-1 rounded px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary hover:bg-primary/20"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navDeps.setActiveRiskSource(null);
                                            }}
                                          >
                                            Active
                                            <LuX className="size-3" />
                                          </button>
                                        ) : (
                                          <LuChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                                        )}
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : (
                      <button
                        key={entry.id}
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors hover:bg-muted/60"
                        onClick={() => runNav(entry.target)}
                      >
                        <NavGlyphIcon glyph={entry.glyph} className="size-3.5" />
                        <span className="min-w-0 flex-1 font-medium">{entry.label}</span>
                        <LuChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                      </button>
                    ),
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )
      ) : null}

      {tab === "contextual" ? (
        filteredContextual.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No contextual entries match your search.
          </p>
        ) : (
          <ul className="space-y-1">
            {filteredContextual.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col gap-0.5 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                    onClick={() => runNav(entry.target)}
                  >
                    <span className="flex items-center gap-2">
                      <NavGlyphIcon glyph={entry.glyph} className="size-3.5" />
                      <span className="text-sm font-medium">{entry.label}</span>
                      <LuChevronRight className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
                    </span>
                    {entry.description ? (
                      <span className="pl-6 text-[11px] text-muted-foreground">
                        {entry.description}
                      </span>
                    ) : null}
                  </button>
                </li>
            ))}
          </ul>
        )
      ) : null}
    </>
  );
}
