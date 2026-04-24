import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { colors } from "@/tokens";

export interface NavItemProps {
  label: string;
  active?: boolean;
  badge?: number | string;
  badgeVariant?: "red" | "blue";
  /** Optional leading icon (dot is always shown for alignment). */
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Sidebar row: leading dot + optional icon + label + optional badge.
 * Active: Resilience-style light pill on navy + primary blue accent (left border + dot).
 */
export function NavItem({
  label,
  active = false,
  badge,
  badgeVariant = "red",
  icon,
  onClick,
  className,
}: NavItemProps) {
  const badgeBg =
    badgeVariant === "blue" ? `${colors.accent.blue}26` : `${colors.accent.red}26`;
  const badgeFg = badgeVariant === "blue" ? colors.accent.blue : colors.accent.red;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md border-l-2 py-2 pl-3 pr-2 text-left text-[13px] font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--drmis-sidebar-bg)]",
        active
          ? "text-[var(--drmis-sidebar-text-active)]"
          : "border-transparent text-[var(--drmis-sidebar-text-muted)] hover:bg-[var(--drmis-sidebar-hover-bg)] hover:text-[var(--drmis-sidebar-text-hover)]",
        className,
      )}
      style={{
        borderLeftColor: active ? colors.accent.blue : "transparent",
        backgroundColor: active ? colors.sidebar.activeBg : "transparent",
      }}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{
          backgroundColor: active ? colors.accent.blue : colors.sidebar.dotInactive,
        }}
        aria-hidden
      />
      {icon ? (
        <span className="flex size-4 shrink-0 items-center justify-center text-current [&>svg]:size-3.5">
          {icon}
        </span>
      ) : (
        <span className="w-4 shrink-0" aria-hidden />
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge !== undefined && badge !== null && String(badge) !== "" ? (
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
          style={{
            backgroundColor: badgeBg,
            color: badgeFg,
            fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
          }}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}
