import { colors } from "@/tokens";
import { cn } from "@/lib/utils";
import { useLiveAlerts } from "@/hooks/useLiveAlerts";
import type { LiveAlert, AlertSeverity, AlertType } from "@/api/getLiveAlerts";

// ── Severity → dot colour ──────────────────────────────────────────
const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  critical: colors.accent.red,
  high: colors.accent.amber,
  medium: colors.accent.blue,
  low: colors.accent.green,
  info: colors.accent.blue,
};

// ── Type → short badge label ───────────────────────────────────────
const TYPE_LABEL: Record<AlertType, string> = {
  earthquake: "EQ",
  cyclone: "TC",
  flood: "FL",
  volcano: "VO",
  weather: "WX",
  hazard: "!",
  wildfire: "WF",
  drought: "DR",
  operational: "OP",
};

// ── Relative time helper ───────────────────────────────────────────
function formatTimeAgo(isoString: string): string {
  if (!isoString) return "—";
  try {
    const secs = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (secs < 60) return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  } catch {
    return isoString;
  }
}

// ── Single alert row ───────────────────────────────────────────────
function AlertRow({ alert }: { alert: LiveAlert }) {
  const dotColor = SEVERITY_COLOR[alert.severity] ?? colors.text.muted;
  const typeLabel = TYPE_LABEL[alert.type] ?? "!";

  return (
    <li className="flex gap-3 px-4 py-3" style={{ borderBottom: `0.5px solid ${colors.border.default}` }}>
      <span
        className="mt-1.5 size-2 shrink-0 rounded-full"
        style={{ backgroundColor: dotColor }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        {/* Source + type badge */}
        <div className="mb-1 flex items-center gap-1">
          <span
            className="rounded px-1 py-0.5 text-[8px] font-semibold uppercase tracking-[0.04em]"
            style={{
              fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
              background: colors.bg.surface,
              color: colors.text.muted,
              border: `1px solid ${colors.border.default}`,
            }}
          >
            {typeLabel} {alert.source}
          </span>
        </div>

        {/* Title — link if URL available */}
        {alert.url ? (
          <a
            href={alert.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[12px] leading-snug hover:underline"
            style={{ color: colors.text.secondary, textDecoration: "none" }}
          >
            {alert.title}
          </a>
        ) : (
          <p className="text-[12px] leading-snug" style={{ color: colors.text.secondary }}>
            {alert.title}
          </p>
        )}

        {/* Time ago */}
        <p
          className="mt-1 text-[10px] tabular-nums leading-none"
          style={{
            color: colors.text.muted,
            fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
          }}
        >
          {formatTimeAgo(alert.issued_at)}
        </p>
      </div>
    </li>
  );
}

// ── Source attribution footer ──────────────────────────────────────
function SourceFooter({
  sources,
  updatedAt,
}: {
  sources: Record<string, string>;
  updatedAt: string;
}) {
  return (
    <div
      className="flex flex-wrap gap-2 px-4 py-2 text-[9px]"
      style={{
        fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
        borderTop: `0.5px solid ${colors.border.default}`,
        color: colors.text.muted,
      }}
    >
      {Object.entries(sources).map(([src, status]) => (
        <span
          key={src}
          style={{ color: status === "ok" ? colors.accent.green : colors.text.muted }}
        >
          {src} {status === "ok" ? "✓" : "–"}
        </span>
      ))}
      <span className="ml-auto" style={{ color: colors.text.ghost }}>
        {formatTimeAgo(updatedAt)}
      </span>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────
function EmptyState({ updatedAt }: { updatedAt: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
      <p className="text-[12px]" style={{ color: colors.text.secondary }}>
        No active alerts for Vanuatu
      </p>
      <p
        className="mt-1 text-[10px]"
        style={{
          fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
          color: colors.text.muted,
        }}
      >
        Sources: VMGD · USGS · GDACS — checked {formatTimeAgo(updatedAt)}
      </p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export interface LiveAlertsPanelProps {
  /** Called when the user taps Silence (e.g. mute notifications). */
  onSilence?: () => void;
  className?: string;
}

/** Live operational alerts: fetches USGS, VMGD, GDACS and internal DRMIS alerts. */
export function LiveAlertsPanel({ onSilence, className }: LiveAlertsPanelProps) {
  const { data, isLoading, isError } = useLiveAlerts();

  return (
    <section
      className={cn("flex min-h-0 flex-col overflow-hidden rounded-lg border", className)}
      style={{
        borderColor: colors.border.default,
        backgroundColor: colors.bg.surface,
      }}
      aria-labelledby="live-alerts-heading"
    >
      <header
        className="flex items-center justify-between gap-3 border-b px-4 py-3"
        style={{ borderColor: colors.border.default }}
      >
        <h2
          id="live-alerts-heading"
          className="text-sm font-semibold leading-tight"
          style={{ color: colors.text.primary }}
        >
          Live Alerts
        </h2>
        <button
          type="button"
          className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-muted/30 focus-visible:outline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--drmis-bg-surface)]"
          style={{
            fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
            color: colors.text.muted,
          }}
          onClick={() => onSilence?.()}
        >
          Silence
        </button>
      </header>

      {/* Loading state */}
      {isLoading && (
        <div
          className="px-4 py-3 text-[11px]"
          style={{
            color: colors.text.muted,
            fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
          }}
        >
          Loading alerts…
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div
          className="px-4 py-3 text-[11px]"
          style={{ color: colors.accent.red }}
        >
          Unable to load alerts. Check connection.
        </div>
      )}

      {/* Alert list */}
      {data && data.alerts.length > 0 && (
        <ul
          className="scrollbar-thin overflow-y-auto"
          style={{ maxHeight: "20rem" }}
          aria-live="polite"
        >
          {data.alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </ul>
      )}

      {/* Empty state */}
      {data && data.alerts.length === 0 && (
        <EmptyState updatedAt={data.updated_at} />
      )}

      {/* Source attribution */}
      {data && (
        <SourceFooter sources={data.sources} updatedAt={data.updated_at} />
      )}
    </section>
  );
}
