import { useCallback, useState } from "react";
import { LuInfo, LuX } from "react-icons/lu";
import { useLayerStore } from "@/store/layer-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "drmis-dismiss-asset-hazard-hint";

/**
 * When both a raster (hazard) and vector (assets) layer are active, show a short
 * hint that popups can be read against the hazard context — RE-style “asset-level” parity.
 */
export function AssetHazardContextBanner() {
  const { layers } = useLayerStore();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });

  const ids = layers.split(",").filter(Boolean);
  const hasRaster = ids.some((l) => l.startsWith("r"));
  const hasVector = ids.some((l) => l.startsWith("v"));

  const onDismiss = useCallback(() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  if (dismissed || !hasRaster || !hasVector) return null;

  return (
    <div
      className={cn(
        "pointer-events-auto mt-2 flex max-w-full items-start gap-2 rounded-[var(--drmis-radius-card)] border border-border",
        "bg-card/90 px-3 py-2 text-xs text-muted-foreground shadow-[var(--drmis-shadow-sm)] backdrop-blur-md",
      )}
      role="status"
    >
      <LuInfo className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
      <p className="min-w-0 leading-snug">
        <span className="font-medium text-foreground">Asset + hazard view:</span> open vector
        popups to inspect features while the hazard raster is visible. Full automated
        exposure scoring is on the roadmap.
      </p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        onClick={onDismiss}
        aria-label="Dismiss hint"
      >
        <LuX className="size-3.5" />
      </Button>
    </div>
  );
}
