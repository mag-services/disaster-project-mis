import { useState } from "react";

import { cn } from "@/lib/utils";
import { colors } from "@/tokens";
import { DRMIS_VERSION_DISPLAY } from "@/config/version";
import { Tooltip } from "@/components/ui";
import { ColorModeButton } from "@/components/ui/color-mode";
import { Button } from "@/components/ui/button";
import { SystemStatusPill } from "./StatusPill";
import { AlertCountPill } from "./AlertCountPill";
import { UserAvatar } from "./UserAvatar";
import { ResilienceMapModeIndicator } from "./ResilienceMapModeIndicator";
import { useViewStore } from "@/store/view-store";
import { HEADER_MODE_META } from "@/config/modes";
import { useUiStore } from "@/store/ui-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface TopbarProps {
  className?: string;
  /** Alert count for the bell pill (demo default: 0). */
  alertCount?: number;
  alertPulse?: boolean;
  /** When false, hide `<UserAvatar />`. Default **true** (spec). */
  showUserAvatar?: boolean;
}

/**
 * 52px full-width top bar: DRMIS brand, system line, status / alerts / user.
 */
export function Topbar({
  className,
  alertCount = 0,
  alertPulse = false,
  showUserAvatar = true,
}: TopbarProps) {
  const scenarioId = useViewStore((s) => s.scenarioId);
  const primaryWorkspace = useUiStore((s) => s.primaryWorkspace);
  const showResilienceIndicator = primaryWorkspace === "operations";

  const [modeHelpOpen, setModeHelpOpen] = useState(false);

  return (
      <header
      className={cn(
        "col-span-2 row-start-1 flex h-[52px] min-h-[52px] w-full items-center gap-4 border-b px-4",
        className,
      )}
      style={{
        borderColor: colors.border.default,
        backgroundColor: colors.bg.surface,
      }}
    >
      {/* Logo lockup — hover shows release string for support */}
      <Tooltip
        content={DRMIS_VERSION_DISPLAY}
        positioning={{ placement: "bottom" }}
        contentProps={{ className: "max-w-[18rem] font-mono text-[11px] text-balance" }}
      >
        <div
          className="flex min-w-0 shrink-0 cursor-default items-center gap-2.5"
          aria-label={`DRMIS — ${DRMIS_VERSION_DISPLAY}`}
        >
          <div
            className="flex size-6 shrink-0 items-center justify-center rounded-sm text-[10px] font-semibold leading-none text-white"
            style={{
              backgroundColor: colors.accent.red,
              fontFamily: "'Segoe UI Variable', 'Segoe UI', ui-sans-serif, system-ui, sans-serif",
            }}
            aria-hidden
          >
            DR
          </div>
          <span
            className="truncate text-lg font-extrabold tracking-tight"
            style={{ fontFamily: "'Segoe UI Variable', 'Segoe UI', ui-sans-serif, system-ui, sans-serif", fontWeight: 800, color: colors.text.primary }}
          >
            DRMIS
          </span>
        </div>
      </Tooltip>

      <div
        className="hidden h-4 w-px shrink-0 sm:block"
        style={{ backgroundColor: colors.border.strong }}
        aria-hidden
      />

      {showResilienceIndicator ? (
        <p
          className="hidden w-auto shrink-0 truncate px-1 text-[10px] font-medium tracking-wide sm:block sm:text-[11px]"
          style={{
            fontFamily:
              "'Segoe UI Variable', 'Segoe UI', ui-sans-serif, system-ui, sans-serif",
            color: colors.text.muted,
          }}
        >
          Disaster Risk Management Information System — Vanuatu
        </p>
      ) : (
        <p
          className="min-w-0 flex-1 truncate px-1 text-[10px] font-medium tracking-wide sm:text-[11px]"
          style={{
            fontFamily:
              "'Segoe UI Variable', 'Segoe UI', ui-sans-serif, system-ui, sans-serif",
            color: colors.text.muted,
          }}
        >
          Disaster Risk Management Information System — Vanuatu
        </p>
      )}

      {showResilienceIndicator ? (
        <div className="flex flex-1 items-center justify-center px-2">
          <ResilienceMapModeIndicator
            scenarioId={scenarioId}
            layout="topbar"
            onHelpClick={() => setModeHelpOpen(true)}
          />
        </div>
      ) : null}

      <Dialog open={modeHelpOpen} onOpenChange={setModeHelpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resilience map &amp; tools</DialogTitle>
            <DialogDescription className="sr-only">
              How hazard, climate, and compare contexts work with Map data, 3D, simulation, and
              exports.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[min(70vh,28rem)] space-y-3 overflow-y-auto text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Resilience map</strong> — One workspace for
              disaster risk and climate information. Use the{" "}
              <strong className="text-foreground">layer browser</strong> (top-left of the map) to
              choose a <strong className="text-foreground">cluster</strong>, a{" "}
              <strong className="text-foreground">risk source</strong>, or a{" "}
              <strong className="text-foreground">contextual layer</strong>. The top bar shows your
              current context (Disaster, Climate, or Compare).
            </p>
            <p>
              <strong className="text-foreground">Disaster</strong> —{" "}
              {HEADER_MODE_META.disaster.subtitle}. Vector and tabular layers for risk and response.
              RAP outputs (Damage, Resources, Financial) appear in the right panel after selecting a
              cyclone event from Risk sources.
            </p>
            <p>
              <strong className="text-foreground">Climate</strong> —{" "}
              {HEADER_MODE_META.climate.subtitle}. Navigate to a climate module via Risk sources or
              Contextual to load baseline rasters and driver layers.
            </p>
            <p>
              <strong className="text-foreground">Compare</strong> — Side-by-side years on the
              map: drag the swipe handle, or use tabular delta / raster comparison. Pick years in
              the context panel on the right.
            </p>
            <p>
              <strong className="text-foreground">Exports</strong> — Dashboard → Export data:
              cluster datasets, filter by type (including RAP categories), download as XLSX /
              GeoJSON / GeoTIFF for risk registers and reporting.
            </p>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => setModeHelpOpen(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="ml-auto flex shrink-0 items-center gap-2.5">
        <SystemStatusPill />
        <AlertCountPill count={alertCount} pulse={alertPulse} />
        <ColorModeButton
          aria-label="Toggle light or dark theme"
          className="size-8 shrink-0 text-[var(--drmis-text-muted)] hover:bg-[var(--drmis-bg-overlay)] hover:text-[var(--drmis-text-primary)]"
        />
        {showUserAvatar ? <UserAvatar /> : null}
      </div>
      </header>
  );
}
