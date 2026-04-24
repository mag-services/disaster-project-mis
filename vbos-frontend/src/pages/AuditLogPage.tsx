/**
 * Audit Log — full-page view of Django admin LogEntry records.
 * Filterable by search text, action type, user, model, and date range.
 * Paginated table with keyboard-friendly navigation.
 */
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuditLog, getAuditLogCsv } from "@/api/getAuditLog";
import type { AuditLogEntry } from "@/api/getAuditLog";
import { colors } from "@/tokens";
import { cn } from "@/lib/utils";
import { toast } from "@/utils/toast";
import {
  LuSearch,
  LuX,
  LuChevronLeft,
  LuChevronRight,
  LuRefreshCw,
  LuDownload,
  LuShieldAlert,
  LuCircleCheck,
  LuCircleMinus,
  LuCirclePlus,
  LuUser,
  LuCalendar,
  LuFilter,
  LuClipboardCheck,
} from "react-icons/lu";

// ─────────────────────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────────────────────

const ACTION_META: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  Added: {
    label: "Added",
    color: "#166534",
    bg: "#f0fdf4",
    border: "#86efac",
    icon: <LuCirclePlus className="size-3" />,
  },
  Changed: {
    label: "Changed",
    color: "#1e40af",
    bg: "#eff6ff",
    border: "#93c5fd",
    icon: <LuCircleCheck className="size-3" />,
  },
  Deleted: {
    label: "Deleted",
    color: "#9f1239",
    bg: "#fff1f2",
    border: "#fda4af",
    icon: <LuCircleMinus className="size-3" />,
  },
};

const ACTION_META_DARK: Record<string, { color: string; bg: string; border: string }> = {
  Added: { color: "#86efac", bg: "#14532d30", border: "#16653440" },
  Changed: { color: "#93c5fd", bg: "#1e3a8a30", border: "#1e40af40" },
  Deleted: { color: "#fda4af", bg: "#9f123930", border: "#9f123940" },
};

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

function formatDateTime(iso: string): { date: string; time: string } {
  try {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }),
      time: d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" }),
    };
  } catch {
    return { date: iso, time: "" };
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const meta = ACTION_META[action];
  if (!meta) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.07em]"
        style={{ borderColor: colors.border.default, color: colors.text.muted }}
      >
        {action}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.07em] dark:hidden"
      style={{ backgroundColor: meta.bg, color: meta.color, borderColor: meta.border }}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}

function ActionBadgeDark({ action }: { action: string }) {
  const meta = ACTION_META_DARK[action] ?? { color: colors.text.muted, bg: "transparent", border: colors.border.default };
  const base = ACTION_META[action];
  return (
    <span
      className="hidden dark:inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.07em]"
      style={{ backgroundColor: meta.bg, color: meta.color, borderColor: meta.border }}
    >
      {base?.icon}
      {action}
    </span>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition-colors",
        active
          ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
          : "hover:bg-muted/50",
      )}
      style={active ? undefined : { borderColor: colors.border.default, color: colors.text.secondary }}
    >
      {label}
    </button>
  );
}

interface AuditTableRowProps {
  entry: AuditLogEntry;
}

function AuditTableRow({ entry }: AuditTableRowProps) {
  const { date, time } = formatDateTime(entry.action_time);

  return (
    <tr
      className="group border-b transition-colors last:border-b-0 hover:bg-muted/30"
      style={{ borderColor: colors.border.default }}
    >
      {/* Timestamp */}
      <td className="px-4 py-3 align-top">
        <div className="flex flex-col gap-0.5">
          <span
            className="text-[12px] font-medium tabular-nums"
            style={{ color: colors.text.primary }}
          >
            {date}
          </span>
          <span
            className="text-[11px] tabular-nums"
            style={{ fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace", color: colors.text.muted }}
          >
            {time}
          </span>
        </div>
      </td>

      {/* User */}
      <td className="px-4 py-3 align-top">
        <div className="flex items-center gap-1.5">
          <LuUser className="size-3 shrink-0" style={{ color: colors.text.muted }} />
          <span className="text-[12px] font-medium" style={{ color: colors.text.primary }}>
            {entry.user ?? "—"}
          </span>
        </div>
      </td>

      {/* Action */}
      <td className="px-4 py-3 align-top">
        <ActionBadge action={entry.action} />
        <ActionBadgeDark action={entry.action} />
      </td>

      {/* Model */}
      <td className="px-4 py-3 align-top">
        <span
          className="text-[12px] font-medium"
          style={{ color: colors.text.secondary }}
        >
          {entry.model_display ?? (entry.model ? entry.model.replace(/_/g, " ") : "—")}
        </span>
      </td>

      {/* Object */}
      <td className="max-w-[280px] px-4 py-3 align-top">
        <p
          className="truncate text-[12px]"
          style={{ color: colors.text.primary }}
          title={entry.object_repr ?? ""}
        >
          {entry.object_repr ?? "—"}
        </p>
        {entry.object_id && (
          <p className="text-[10px] tabular-nums" style={{ color: colors.text.muted }}>
            id:{entry.object_id}
          </p>
        )}
      </td>

      {/* Change message */}
      <td className="px-4 py-3 align-top">
        <p
          className="text-[11px] leading-relaxed"
          style={{ color: colors.text.secondary, maxWidth: "28rem" }}
        >
          {entry.change_message || "—"}
        </p>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination controls
// ─────────────────────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalCount,
  pageSize,
  onPageSizeChange,
  onPage,
}: {
  page: number;
  totalCount: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <p className="text-[11px]" style={{ color: colors.text.muted }}>
        {totalCount > 0 ? `${from}–${to} of ${totalCount.toLocaleString()} entries` : "No entries"}
      </p>
      <div className="flex items-center gap-3">
        <label className="inline-flex items-center gap-2 text-[11px]" style={{ color: colors.text.muted }}>
          Rows
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-7 rounded-md border px-2 text-[11px] outline-none focus:ring-2 focus:ring-blue-500/40"
            style={{
              borderColor: colors.border.default,
              backgroundColor: colors.bg.elevated,
              color: colors.text.primary,
            }}
            aria-label="Rows per page"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="inline-flex size-7 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-muted/40"
          style={{ borderColor: colors.border.default }}
          aria-label="Previous page"
        >
          <LuChevronLeft className="size-3.5" style={{ color: colors.text.secondary }} />
        </button>

        {/* Page number pills — up to 7 */}
        {(() => {
          const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2);
          const items: { key: string; value: number | "…" }[] = [];
          pageNums.forEach((p, i) => {
            if (i > 0 && pageNums[i - 1] + 1 < p) {
              items.push({ key: `gap-${pageNums[i - 1]}-${p}`, value: "…" });
            }
            items.push({ key: `page-${p}`, value: p });
          });
          return items.map(({ key, value }) =>
            value === "…" ? (
              <span key={key} className="px-1 text-[11px]" style={{ color: colors.text.muted }}>
                …
              </span>
            ) : (
              <button
                key={key}
                type="button"
                onClick={() => onPage(value)}
                className={cn(
                  "inline-flex h-7 min-w-[28px] items-center justify-center rounded-md border px-1.5 text-[11px] font-medium transition-colors",
                  value === page
                    ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "hover:bg-muted/40",
                )}
                style={value === page ? undefined : { borderColor: colors.border.default, color: colors.text.secondary }}
              >
                {value}
              </button>
            ),
          );
        })()}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="inline-flex size-7 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-muted/40"
          style={{ borderColor: colors.border.default }}
          aria-label="Next page"
        >
          <LuChevronRight className="size-3.5" style={{ color: colors.text.secondary }} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<"" | "1" | "2" | "3">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // Committed search (only applied on Enter or search icon click)
  const [committedSearch, setCommittedSearch] = useState("");

  const commitSearch = useCallback(() => {
    setCommittedSearch(search);
    setPage(1);
  }, [search]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setCommittedSearch("");
    setActionFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }, []);

  const hasFilters = committedSearch || actionFilter || dateFrom || dateTo;

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["audit-log", page, pageSize, committedSearch, actionFilter, dateFrom, dateTo],
    queryFn: () =>
      getAuditLog({
        page,
        page_size: pageSize,
        search: committedSearch || undefined,
        action: actionFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const handleExportCsv = useCallback(async () => {
    setIsExportingCsv(true);
    try {
      const blob = await getAuditLogCsv({
        search: committedSearch || undefined,
        action: actionFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dataset-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("CSV exported", "Audit log download started.");
    } catch (e) {
      toast.error("Export failed", String(e instanceof Error ? e.message : e));
    } finally {
      setIsExportingCsv(false);
    }
  }, [committedSearch, actionFilter, dateFrom, dateTo]);

  const entries = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  return (
    <div
      className="grid min-h-0 min-w-0 gap-6"
      style={{ gridTemplateRows: "auto auto minmax(0,1fr)" }}
    >
      {/* ── Header ── */}
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1
            className="text-[22px] font-bold leading-tight tracking-tight"
            style={{ fontFamily: "'Segoe UI Variable', 'Segoe UI', ui-sans-serif, system-ui, sans-serif", fontWeight: 700, color: colors.text.primary }}
          >
            Audit Log
          </h1>
          <p
            className="mt-1 text-xs"
            style={{ color: colors.text.muted, fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace" }}
          >
            Dataset change history — who added, edited, or removed datasets
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors hover:bg-muted/40 disabled:opacity-60"
            style={{ borderColor: colors.border.default, color: colors.text.secondary }}
            onClick={() => void handleExportCsv()}
            disabled={isExportingCsv}
          >
            <LuDownload className="size-3.5" />
            {isExportingCsv ? "Exporting…" : "Export CSV"}
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors hover:bg-muted/40"
            style={{ borderColor: colors.border.default, color: colors.text.secondary }}
            onClick={() => void refetch()}
          >
            <LuRefreshCw className="size-3.5" />
            Refresh
          </button>
        </div>
      </header>

      {/* ── Filter bar ── */}
      <div
        className="flex flex-col gap-3 rounded-xl border p-4"
        style={{ borderColor: colors.border.default, backgroundColor: colors.bg.surface }}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[240px] flex-1">
            <LuSearch
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2"
              style={{ color: colors.text.muted }}
            />
            <input
              type="search"
              placeholder="Search object, user, change message…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitSearch();
              }}
              className="h-9 w-full rounded-lg border py-2 pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
              style={{
                borderColor: colors.border.default,
                backgroundColor: colors.bg.elevated,
                color: colors.text.primary,
              }}
            />
            {search && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                onClick={() => { setSearch(""); setCommittedSearch(""); setPage(1); }}
                aria-label="Clear search"
              >
                <LuX className="size-3.5" style={{ color: colors.text.muted }} />
              </button>
            )}
          </div>

          {/* Apply search button */}
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: colors.accent.blue }}
            onClick={commitSearch}
          >
            <LuSearch className="size-3.5" />
            Search
          </button>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <LuFilter className="size-3 shrink-0" style={{ color: colors.text.muted }} />

          {/* Action type pills */}
          <FilterPill label="All actions" active={actionFilter === ""} onClick={() => { setActionFilter(""); setPage(1); }} />
          <FilterPill label="Added" active={actionFilter === "1"} onClick={() => { setActionFilter(actionFilter === "1" ? "" : "1"); setPage(1); }} />
          <FilterPill label="Changed" active={actionFilter === "2"} onClick={() => { setActionFilter(actionFilter === "2" ? "" : "2"); setPage(1); }} />
          <FilterPill label="Deleted" active={actionFilter === "3"} onClick={() => { setActionFilter(actionFilter === "3" ? "" : "3"); setPage(1); }} />

          {/* Date range */}
          <div className="ml-2 flex items-center gap-2">
            <LuCalendar className="size-3 shrink-0" style={{ color: colors.text.muted }} />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="h-7 rounded-md border px-2 text-[11px] outline-none focus:ring-2 focus:ring-blue-500/40"
              style={{
                borderColor: colors.border.default,
                backgroundColor: colors.bg.elevated,
                color: colors.text.primary,
              }}
              title="From date"
              aria-label="From date"
            />
            <span className="text-[11px]" style={{ color: colors.text.muted }}>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="h-7 rounded-md border px-2 text-[11px] outline-none focus:ring-2 focus:ring-blue-500/40"
              style={{
                borderColor: colors.border.default,
                backgroundColor: colors.bg.elevated,
                color: colors.text.primary,
              }}
              title="To date"
              aria-label="To date"
            />
          </div>

          {hasFilters && (
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium underline underline-offset-2"
              style={{ color: colors.accent.blue }}
              onClick={clearFilters}
            >
              <LuX className="size-3" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border" style={{ borderColor: colors.border.default, backgroundColor: colors.bg.surface }}>

        {/* Error */}
        {isError && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <LuShieldAlert className="size-10 opacity-30" style={{ color: colors.accent.red }} />
            <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
              {error instanceof Error ? error.message : "Failed to load audit log"}
            </p>
            <p className="max-w-[28rem] text-xs" style={{ color: colors.text.muted }}>
              Could not retrieve the change log. Check your connection and try again.
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted/40"
              style={{ borderColor: colors.border.default, color: colors.text.secondary }}
              onClick={() => void refetch()}
            >
              <LuRefreshCw className="size-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {isPending && !isError && (
          <div className="flex flex-col divide-y" style={{ borderColor: colors.border.default }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={`sk-${i}`} className="flex items-center gap-4 px-4 py-3">
                <div className="h-9 w-[90px] animate-pulse rounded" style={{ backgroundColor: colors.bg.elevated }} />
                <div className="h-4 w-[80px] animate-pulse rounded" style={{ backgroundColor: colors.bg.elevated }} />
                <div className="h-5 w-[60px] animate-pulse rounded-full" style={{ backgroundColor: colors.bg.elevated }} />
                <div className="h-4 w-[100px] animate-pulse rounded" style={{ backgroundColor: colors.bg.elevated }} />
                <div className="h-4 flex-1 animate-pulse rounded" style={{ backgroundColor: colors.bg.elevated }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isPending && !isError && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <LuClipboardCheck className="size-10 opacity-20" style={{ color: colors.text.muted }} />
            <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
              {hasFilters ? "No entries match the current filters" : "No audit entries yet"}
            </p>
            <p className="max-w-[28rem] text-xs" style={{ color: colors.text.muted }}>
              {hasFilters
                ? "Try broadening your search or removing date/action filters."
                : "Dataset changes (create, edit, delete) made via the admin panel will appear here."}
            </p>
          </div>
        )}

        {/* Table */}
        {!isPending && !isError && entries.length > 0 && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[800px] border-collapse text-left">
                <thead>
                  <tr
                    className="border-b text-[10px] font-semibold uppercase tracking-[0.09em]"
                    style={{ borderColor: colors.border.default, backgroundColor: colors.bg.elevated }}
                  >
                    {["Timestamp", "User", "Action", "Model", "Object", "Changes"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 font-semibold"
                        style={{ fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace", color: colors.text.muted }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <AuditTableRow key={entry.id} entry={entry} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div
              className="border-t"
              style={{ borderColor: colors.border.default }}
            >
              <Pagination
                page={page}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
                onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
