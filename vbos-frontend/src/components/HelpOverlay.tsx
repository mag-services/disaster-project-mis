/**
 * Interactive guided tour overlay. Darkens the screen and spotlights each UI element.
 * User clicks Next to advance through steps.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { LuChevronRight, LuChevronLeft, LuX } from "react-icons/lu";
import { useViewStore } from "@/store/view-store";

export type TourStep = {
  id: string;
  target: string; // data-tour selector
  title: string;
  content: string;
  /** Only show when scenarioId matches (e.g. "disaster" | "climate") */
  when?: "disaster" | "climate";
};

const TOUR_STEPS: TourStep[] = [
  {
    id: "view-mode",
    target: "[data-tour='view-mode']",
    title: "Resilience map",
    content:
      "One Resilience workspace. Use Map data below to pick a thematic cluster, a climate module, or Compare years.",
  },
  {
    id: "cluster-select",
    target: "[data-tour='cluster-select']",
    title: "Select cluster",
    content: "Choose a data cluster (Disaster mode) or module (Climate mode). Datasets in that cluster appear below.",
    when: "disaster",
  },
  {
    id: "climate-module",
    target: "[data-tour='climate-module']",
    title: "Climate module",
    content: "Choose Land Use or Coastal module. Each shows different baseline datasets and indicators.",
    when: "climate",
  },
  {
    id: "datasets-list",
    target: "[data-tour='datasets-list']",
    title: "Data layers",
    content: "Enable datasets by clicking them. Active layers appear on the map and in the right panel.",
  },
  {
    id: "area-filter",
    target: "[data-tour='area-filter']",
    title: "Province & Area Council",
    content: "Filter data by province and area council. Multi-select is supported.",
  },
  {
    id: "year-filter",
    target: "[data-tour='year-filter']",
    title: "Year filter",
    content: "Select the year for tabular data. Applies to charts and downloads.",
    when: "disaster",
  },
  {
    id: "download",
    target: "[data-tour='download']",
    title: "Download data",
    content: "Download active datasets as XLSX (tabular) or GeoJSON (vector). Respects your filters.",
  },
];

type HelpOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function tourScenarioFilter(id: string): "disaster" | "climate" {
  return id === "climate" ? "climate" : "disaster";
}

function getFilteredSteps(scenarioId: "disaster" | "climate"): TourStep[] {
  return TOUR_STEPS.filter((s) => {
    if (!s.when) return true;
    return s.when === scenarioId;
  });
}

export function HelpOverlay({ open, onOpenChange }: HelpOverlayProps) {
  const scenarioId = useViewStore((s) => s.scenarioId);
  const steps = getFilteredSteps(tourScenarioFilter(scenarioId));
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[stepIndex] ?? null;

  const updateTargetRect = useCallback(() => {
    if (!currentStep || !open) {
      setTargetRect(null);
      setTooltipPos(null);
      return;
    }
    const el = document.querySelector(currentStep.target);
    if (!el) {
      setTargetRect(null);
      setTooltipPos(null);
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      const pad = 16;
      const tooltipWidth = 320;
      const tooltipHeight = 180;
      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      left = Math.max(pad, Math.min(window.innerWidth - tooltipWidth - pad, left));
      // Prefer below; if not enough space, show above
      const spaceBelow = window.innerHeight - rect.bottom - pad;
      const top =
        spaceBelow >= tooltipHeight
          ? rect.bottom + pad
          : rect.top - tooltipHeight - pad;
      setTooltipPos({ top, left });
    });
  }, [currentStep, open]);

  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
  }, [open]);

  useEffect(() => {
    updateTargetRect();
    const resize = new ResizeObserver(updateTargetRect);
    const el = currentStep ? document.querySelector(currentStep.target) : null;
    if (el) resize.observe(el);
    window.addEventListener("scroll", updateTargetRect, true);
    return () => {
      resize.disconnect();
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [currentStep, stepIndex, open, updateTargetRect]);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      onOpenChange(false);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    }
  };

  if (!open) return null;

  const overlay = (
    <div
      className="fixed inset-0 z-[9998]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      aria-describedby="tour-content"
    >
      {/* Dark overlay with spotlight cutout */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        {targetRect && (
          <div
            className="absolute rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent"
            style={{
              left: targetRect.left,
              top: targetRect.top,
              width: targetRect.width,
              height: targetRect.height,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.75)",
            }}
          />
        )}
      </div>

      {/* Tooltip card - positioned below spotlight */}
      {currentStep && tooltipPos && (
        <div
          ref={tooltipRef}
          className="pointer-events-auto absolute z-[9999] w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-card p-4 shadow-xl"
          style={{
            left: tooltipPos.left,
            top: tooltipPos.top,
          }}
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <h3 id="tour-title" className="font-semibold text-foreground">
                {currentStep.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Step {stepIndex + 1} of {steps.length}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 -mr-1 -mt-1"
              aria-label="Close tour"
              onClick={() => onOpenChange(false)}
            >
              <LuX className="size-4" />
            </Button>
          </div>
          <p id="tour-content" className="text-sm text-muted-foreground mb-4">
            {currentStep.content}
          </p>
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={stepIndex === 0}
              className="gap-1"
            >
              <LuChevronLeft className="size-4" />
              Back
            </Button>
            <Button size="sm" onClick={handleNext} className="gap-1">
              {stepIndex < steps.length - 1 ? (
                <>
                  Next
                  <LuChevronRight className="size-4" />
                </>
              ) : (
                "Finish"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Fallback when target not found */}
      {currentStep && !targetRect && (
        <div className="pointer-events-auto fixed bottom-4 left-1/2 z-[9999] w-80 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg border border-border bg-card p-4 shadow-xl">
          <h3 className="font-semibold text-foreground">{currentStep.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">{currentStep.content}</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleBack} disabled={stepIndex === 0}>
              Back
            </Button>
            <Button size="sm" onClick={handleNext}>
              {stepIndex < steps.length - 1 ? "Next" : "Finish"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(overlay, document.body);
}
