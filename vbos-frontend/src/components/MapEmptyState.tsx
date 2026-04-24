import { useState, useEffect } from "react";
import { LuMapPin, LuLeaf, LuX } from "react-icons/lu";
import { useLayerStore } from "@/store/layer-store";
import { useScenario } from "@/hooks/useScenario";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "vbos-map-empty-dismissed";

export function MapEmptyState() {
  const { layers } = useLayerStore();
  const scenario = useScenario();
  const hasLayers = layers.split(",").filter(Boolean).length > 0;

  const [dismissed, setDismissed] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) === "1" : false,
  );

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  useEffect(() => {
    if (hasLayers) {
      setDismissed(false);
      if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
    }
  }, [hasLayers]);

  if (hasLayers || dismissed) return null;

  const isClimate = scenario.id === "climate";

  return (
    <div
      className={cn(
        "absolute left-1/2 top-1/2 z-[1000] -translate-x-1/2 -translate-y-1/2 px-4 text-center",
        "pointer-events-none [&>*]:pointer-events-auto",
      )}
    >
      <div className="relative inline-flex flex-col items-center rounded-[var(--drmis-radius-card)] border border-border px-5 py-4 shadow-[var(--drmis-shadow-sm)] glass-surface duration-200 animate-in fade-in zoom-in-95">
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute right-1 top-1 size-6 rounded-md opacity-60 hover:opacity-100"
          aria-label="Dismiss"
          onClick={handleDismiss}
        >
          <LuX className="size-3.5" />
        </Button>
        <div className="mb-2 text-muted-foreground opacity-60">
          {isClimate ? (
            <LuLeaf className="size-7" />
          ) : (
            <LuMapPin className="size-7" />
          )}
        </div>
        <p className="mb-0.5 text-xs font-semibold text-foreground">
          {isClimate ? "Land cover map" : "No datasets selected"}
        </p>
        <p className="max-w-[240px] text-[11px] leading-relaxed text-muted-foreground">
          {isClimate
            ? "Select a year to view land cover. Layers auto-activate when available."
            : "Open the layer picker in the top toolbar to choose clusters and datasets."}
        </p>
        <Button
          type="button"
          variant="default"
          size="sm"
          className="drmis-touch-target mt-3 min-h-10 px-4 text-xs"
          onClick={() => {
            (
              document.querySelector(
                "[data-drmis-layer-trigger]",
              ) as HTMLButtonElement | null
            )?.click();
          }}
        >
          {isClimate ? "Open layers" : "Choose layers"}
        </Button>
      </div>
    </div>
  );
}
