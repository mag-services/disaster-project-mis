import { cn } from "@/lib/utils";
import { colors } from "@/tokens";
import { useAuthStore } from "@/store/auth-store";
import { canAccessShellNav, getUserRole } from "@/lib/rbac";
import { NavItem } from "./NavItem";
import {
  LuLayoutDashboard,
  LuMap,
  LuDatabase,
  LuDownload,
  LuClipboardCheck,
  LuSettings2,
} from "react-icons/lu";

export interface SidebarProps {
  activeId: string;
  onNavigate: (id: string) => void;
  className?: string;
  /** Live alert count — shown as badge on Live map nav item when > 0. */
  alertCount?: number;
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h3
      className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.12em] first:mt-0"
      style={{ color: colors.sidebar.textMuted }}
    >
      {children}
    </h3>
  );
}

/**
 * Left navigation: Operations, Data, Governance — 220px column.
 */
export function Sidebar({ activeId, onNavigate, className, alertCount = 0 }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const role = getUserRole(user);

  return (
    <aside
      className={cn(
        "row-start-2 col-start-1 flex min-h-0 w-[220px] shrink-0 flex-col overflow-y-auto border-r px-2 py-3",
        className,
      )}
      style={{
        borderColor: colors.sidebar.border,
        backgroundColor: colors.sidebar.bg,
      }}
      aria-label="Main navigation"
    >
      <nav className="flex flex-col gap-0.5">
        <SectionTitle>Operations</SectionTitle>
        {canAccessShellNav(role, "dashboard") && (
          <NavItem
            label="Dashboard"
            icon={<LuLayoutDashboard />}
            active={activeId === "dashboard"}
            onClick={() => onNavigate("dashboard")}
          />
        )}
        {canAccessShellNav(role, "live-map") && (
          <NavItem
            label="Live map"
            icon={<LuMap />}
            active={activeId === "live-map"}
            badge={alertCount > 0 ? alertCount : undefined}
            badgeVariant="red"
            onClick={() => onNavigate("live-map")}
          />
        )}

        {(canAccessShellNav(role, "datasets") || canAccessShellNav(role, "exports")) && (
          <SectionTitle>Data</SectionTitle>
        )}
        {canAccessShellNav(role, "datasets") && (
          <NavItem
            label="Datasets"
            icon={<LuDatabase />}
            active={activeId === "datasets"}
            onClick={() => onNavigate("datasets")}
          />
        )}
        {canAccessShellNav(role, "exports") && (
          <NavItem
            label="Exports"
            icon={<LuDownload />}
            active={activeId === "exports"}
            onClick={() => onNavigate("exports")}
          />
        )}

        {(canAccessShellNav(role, "audit") || canAccessShellNav(role, "settings")) && (
          <SectionTitle>Governance</SectionTitle>
        )}
        {canAccessShellNav(role, "audit") && (
          <NavItem
            label="Audit log"
            icon={<LuClipboardCheck />}
            active={activeId === "audit"}
            onClick={() => onNavigate("audit")}
          />
        )}
        {canAccessShellNav(role, "settings") && (
          <NavItem
            label="Settings"
            icon={<LuSettings2 />}
            active={activeId === "settings"}
            onClick={() => onNavigate("settings")}
          />
        )}
      </nav>

      {user?.is_staff && (
        <div
          style={{
            borderTop: `0.5px solid ${colors.border.default}`,
            marginTop: "auto",
            paddingTop: "8px",
          }}
        >
          <a
            href="/admin/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 16px",
              fontSize: "12px",
              color: colors.text.muted,
              textDecoration: "none",
            }}
          >
            <span
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "currentColor",
                flexShrink: 0,
              }}
            />
            Admin Panel ↗
          </a>
        </div>
      )}
    </aside>
  );
}
