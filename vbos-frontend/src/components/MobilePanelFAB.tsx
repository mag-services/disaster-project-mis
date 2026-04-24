/**
 * Floating action buttons for opening Data Layers and Context panels on mobile.
 * Only visible when no panel is open. 44px touch targets for accessibility.
 */
import { LuLayers, LuPanelRight } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

export function MobilePanelFAB() {
  const { isMobile, mobileOpenPanel, setMobileOpenPanel } = useUiStore();

  if (!isMobile || mobileOpenPanel !== null) return null;

  return (
    <div
      className={cn(
        "absolute bottom-4 left-1/2 z-[900] flex -translate-x-1/2 gap-3 pb-[env(safe-area-inset-bottom)] md:hidden",
      )}
      role="group"
      aria-label="Panel access"
    >
      <Button
        variant="secondary"
        size="sm"
        className={cn(
          "min-h-11 min-w-11 touch-manipulation gap-2 px-4 shadow-lg",
          "bg-card/95 backdrop-blur-sm hover:bg-card",
        )}
        onClick={() => setMobileOpenPanel("left")}
        aria-label="Open Data Layers"
      >
        <LuLayers className="size-5 shrink-0" />
        <span className="text-sm font-medium">Data Layers</span>
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className={cn(
          "min-h-11 min-w-11 touch-manipulation gap-2 px-4 shadow-lg",
          "bg-card/95 backdrop-blur-sm hover:bg-card",
        )}
        onClick={() => setMobileOpenPanel("right")}
        aria-label="Open Context"
      >
        <LuPanelRight className="size-5 shrink-0" />
        <span className="text-sm font-medium">Context</span>
      </Button>
    </div>
  );
}
