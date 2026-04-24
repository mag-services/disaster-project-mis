import { colors } from "@/tokens";
import { cn } from "@/lib/utils";
import type { AreaSubmission, SubmissionStatus } from "@/api/getSubmissions";

// ── Severity badge ─────────────────────────────────────────────────
export type SeverityLevel = "Critical" | "High" | "Medium" | "Low" | "Watch";

const severityBadge: Record<
  SeverityLevel,
  { border: string; background: string; color: string }
> = {
  Critical: {
    border: colors.accent.red,
    background: "rgba(255, 75, 43, 0.12)",
    color: "#9B3418",
  },
  High: {
    border: colors.accent.amber,
    background: "rgba(245, 166, 35, 0.12)",
    color: "#854F0B",
  },
  Medium: {
    border: colors.accent.blue,
    background: "rgba(77, 144, 255, 0.12)",
    color: "#005bb7",
  },
  Low: {
    border: colors.accent.green,
    background: "rgba(48, 232, 122, 0.12)",
    color: "#27500A",
  },
  Watch: {
    border: "#5DCAA5",
    background: "rgba(93, 202, 165, 0.12)",
    color: "#085041",
  },
};

export interface SeverityBadgeProps {
  level: SeverityLevel;
  className?: string;
}

export function SeverityBadge({ level, className }: SeverityBadgeProps) {
  const s = severityBadge[level];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none",
        className,
      )}
      style={{
        borderColor: s.border,
        backgroundColor: s.background,
        color: s.color,
        fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
      }}
    >
      {level}
    </span>
  );
}

// ── Status → severity mapping ──────────────────────────────────────
function statusToSeverity(status: SubmissionStatus): SeverityLevel {
  switch (status) {
    case "submitted":
      return "High";
    case "draft":
      return "Medium";
    case "rejected":
      return "Watch";
    case "approved":
      return "Low";
    default:
      return "Medium";
  }
}

function formatStatusLabel(status: SubmissionStatus): string {
  switch (status) {
    case "submitted":
      return "Pending review";
    case "draft":
      return "Draft";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

function formatDate(isoString: string | null): string {
  if (!isoString) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(isoString));
}

// ── Skeleton row ───────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr style={{ borderBottom: `1px solid ${colors.border.default}` }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 animate-pulse rounded"
            style={{ background: colors.border.default, width: i === 1 ? "80%" : "60%" }}
          />
        </td>
      ))}
    </tr>
  );
}

// ── Header ─────────────────────────────────────────────────────────
const headerMono = {
  fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
  color: colors.text.ghost,
} as const;

// ── Props ──────────────────────────────────────────────────────────
export interface IncidentsTableProps {
  submissions?: AreaSubmission[];
  isLoading?: boolean;
  isError?: boolean;
  /** Called when "View all" is activated (e.g. navigate or open drawer). */
  onViewAll?: () => void;
  className?: string;
}

/**
 * Recent submissions panel: maps area data submissions to an incidents-style table.
 * Severity is inferred from submission status; Edit links point to real admin records.
 */
export function IncidentsTable({
  submissions,
  isLoading = false,
  isError = false,
  onViewAll,
  className,
}: IncidentsTableProps) {
  return (
    <section
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border",
        className,
      )}
      style={{
        borderColor: colors.border.default,
        backgroundColor: colors.bg.surface,
      }}
      aria-labelledby="recent-incidents-heading"
    >
      <header
        className="flex items-center justify-between gap-3 border-b px-4 py-3"
        style={{ borderColor: colors.border.default }}
      >
        <h2
          id="recent-incidents-heading"
          className="text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{
            fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
            color: colors.text.muted,
          }}
        >
          Recent Submissions
        </h2>
        <button
          type="button"
          className="text-[11px] font-semibold uppercase tracking-wide underline-offset-2 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#4D90FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--drmis-bg-surface)]"
          style={{
            fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
            color: colors.accent.blue,
          }}
          onClick={() => onViewAll?.()}
        >
          View all →
        </button>
      </header>

      <div className="scrollbar-thin min-h-[200px] overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.border.default}` }}>
              {(["Status", "Dataset", "Date", "Province", "Edit"] as const).map((label) => (
                <th
                  key={label}
                  className="px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.1em]"
                  style={headerMono}
                  scope="col"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Loading skeletons */}
            {isLoading &&
              [0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}

            {/* Error state */}
            {isError && !isLoading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm"
                  style={{ color: colors.text.muted }}
                >
                  Could not load submissions. Check your connection.
                </td>
              </tr>
            )}

            {/* Empty state */}
            {!isLoading && !isError && submissions?.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm"
                  style={{ color: colors.text.muted }}
                >
                  No submissions yet.
                </td>
              </tr>
            )}

            {/* Real rows */}
            {!isLoading &&
              !isError &&
              submissions?.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-muted/30"
                  style={{ borderBottom: `1px solid ${colors.border.default}` }}
                >
                  <td className="px-4 py-3 align-middle">
                    <SeverityBadge level={statusToSeverity(row.status)} />
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="min-w-0">
                      <div
                        className="text-sm font-medium leading-snug"
                        style={{ color: colors.text.primary }}
                      >
                        {row.dataset_name}
                      </div>
                      <div
                        className="mt-0.5 text-xs leading-snug"
                        style={{ color: colors.text.muted }}
                      >
                        {formatStatusLabel(row.status)} · {row.submitted_by_username}
                      </div>
                    </div>
                  </td>
                  <td
                    className="px-4 py-3 align-middle text-sm tabular-nums"
                    style={{
                      fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
                      color: colors.text.secondary,
                    }}
                  >
                    {formatDate(row.submitted_at ?? row.updated)}
                  </td>
                  <td
                    className="px-4 py-3 align-middle text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    {row.province_name}
                    {row.area_council_name ? (
                      <span style={{ color: colors.text.muted }}>
                        {" "}
                        · {row.area_council_name}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-middle text-right">
                    <a
                      href={`/admin/area_submissions/areadatasubmission/${row.id}/change/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
                        fontSize: "10px",
                        color: colors.text.muted,
                        textDecoration: "none",
                      }}
                    >
                      Edit ↗
                    </a>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
