import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { IncidentsTable } from "@/components/dashboard/IncidentsTable";
import { LiveAlertsPanel } from "@/components/dashboard/LiveAlertsPanel";
import { RiskExposurePanel } from "@/components/dashboard/RiskExposurePanel";
import { NewIncidentDialog } from "@/components/dashboard/NewIncidentDialog";
import { useCommandCentreSyncClock } from "@/hooks/useCommandCentreSyncClock";
import { useRecentSubmissions } from "@/hooks/useRecentSubmissions";
import { useLiveAlerts } from "@/hooks/useLiveAlerts";
import { useFieldTeamsDeployed } from "@/hooks/useFieldTeamsDeployed";
import { useDatasetsUpdatedToday } from "@/hooks/useDatasetsUpdatedToday";
import { useUiStore } from "@/store/ui-store";
import { colors } from "@/tokens";
import { LuDownload } from "react-icons/lu";
import { useState } from "react";

/**
 * Command Centre — main landing view after login (dashboard).
 * Layout: title row → metric cards → submissions + alerts / risk column.
 */
export function CommandCentre() {
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const setShellNavId = useUiStore((s) => s.setShellNavId);
  const { relativeLabel } = useCommandCentreSyncClock(30_000);
  const submissionsQuery = useRecentSubmissions();
  const alertsQuery = useLiveAlerts();
  const fieldTeamsQuery = useFieldTeamsDeployed();
  const datasetsUpdatedTodayQuery = useDatasetsUpdatedToday();

  const pendingCount =
    submissionsQuery.data?.results.filter((s) => s.status === "submitted").length ?? 0;
  const activeAlertCount = alertsQuery.data?.count ?? 0;

  return (
    <div
      className="grid min-h-0 min-w-0 gap-6"
      style={{
        gridTemplateRows: "auto auto minmax(0, 1fr)",
      }}
    >
      {/* Top row: title + subtitle + actions */}
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1
            className="text-[22px] font-bold leading-tight tracking-tight"
            style={{
              fontFamily: "'Segoe UI Variable', 'Segoe UI', ui-sans-serif, system-ui, sans-serif",
              fontWeight: 700,
              color: colors.text.primary,
            }}
          >
            Command Centre
          </h1>
          <p
            className="mt-1 text-xs"
            style={{
              color: colors.text.muted,
              fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
            }}
          >
            {relativeLabel}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="border"
            style={{ borderColor: colors.border.default }}
            onClick={() => setShellNavId("exports")}
          >
            <LuDownload className="size-3.5" />
            Export data
          </Button>
          <Button
            type="button"
            size="sm"
            className="font-semibold text-white"
            style={{ backgroundColor: colors.accent.red }}
            onClick={() => setIncidentDialogOpen(true)}
          >
            + New Incident
          </Button>
        </div>
      </header>

      {/* Metric cards — 4 columns on xl */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Pending submissions"
          value={submissionsQuery.isLoading ? "…" : pendingCount}
          subtext="awaiting review"
          accentColor="red"
        />
        <MetricCard
          label="Live alerts"
          value={alertsQuery.isLoading ? "…" : activeAlertCount}
          subtext="USGS · VMGD · GDACS · DRMIS"
          accentColor="amber"
        />
        <MetricCard
          label="Field teams deployed"
          value={fieldTeamsQuery.isLoading ? "…" : (fieldTeamsQuery.data?.count ?? 0)}
          subtext="active in last 24h"
          accentColor="green"
        />
        <MetricCard
          label="Datasets updated today"
          value={datasetsUpdatedTodayQuery.isLoading ? "…" : (datasetsUpdatedTodayQuery.data ?? 0)}
          subtext="from dataset audit log"
          accentColor="blue"
        />
      </div>

      {/* Content: left submissions + right 300px stack */}
      <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-h-0 min-w-0">
          <IncidentsTable
            submissions={submissionsQuery.data?.results}
            isLoading={submissionsQuery.isLoading}
            isError={submissionsQuery.isError}
          />
        </div>
        <div className="flex min-h-0 w-full min-w-0 flex-col gap-4 lg:w-[300px] lg:max-w-[300px]">
          <LiveAlertsPanel />
          <RiskExposurePanel />
          <section
            className="rounded-lg border p-3 text-[11px] leading-relaxed"
            style={{
              borderColor: colors.border.default,
              backgroundColor: colors.bg.surface,
              color: colors.text.muted,
            }}
            aria-labelledby="network-analysis-heading"
          >
            <h2
              id="network-analysis-heading"
              className="text-xs font-semibold leading-tight"
              style={{ color: colors.text.primary }}
            >
              Network analysis (road isolation · cascading outages)
            </h2>
            <p className="mt-2">
              Not automated in DRMIS yet. Needs road graph data (e.g. OpenStreetMap), a routing
              engine (OSRM / pgRouting), and optional infrastructure network models for power, water,
              and telecom. Planned when data and NDMO/MoCCA priorities align.
            </p>
          </section>
        </div>
      </div>
      <NewIncidentDialog open={incidentDialogOpen} onOpenChange={setIncidentDialogOpen} />
    </div>
  );
}
