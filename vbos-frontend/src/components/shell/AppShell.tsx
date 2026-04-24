import { useCallback, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useColorMode } from "@/components/ui/color-mode";
import { colors } from "@/tokens";
import { useUiStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "@/utils/toast";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { getShellNavPlaceholder } from "@/config/shellNavPlaceholders";
import { ShellNavPlaceholderDescription } from "./ShellNavPlaceholderDescription";
import { canAccessShellNav, getUserRole } from "@/lib/rbac";

export interface AppShellProps {
  children: ReactNode;
  /** Alert count for `<AlertCountPill />`. */
  alertCount?: number;
  /** Flash attention pulse when a new critical/high alert arrives. */
  alertPulse?: boolean;
  /** When true (default), main uses `overflow-auto` and **20px** padding per spec. */
  mainPadding?: boolean;
  /** Show `<UserAvatar />` in topbar (default **true** per spec). */
  topbarUserAvatar?: boolean;
  /** Optional class on `<main>`. */
  mainClassName?: string;
}

/**
 * CSS grid: **52px** top row (full width) | **220px** sidebar + **1fr** main.
 * Main: `overflow-auto`, **padding 20px** (unless `mainPadding={false}` for full-bleed map).
 */
export function AppShell({
  children,
  alertCount = 0,
  alertPulse = false,
  mainPadding = true,
  topbarUserAvatar = true,
  mainClassName,
}: AppShellProps) {
  const { colorMode } = useColorMode();
  const shellNavId = useUiStore((s) => s.shellNavId);
  const setShellNavId = useUiStore((s) => s.setShellNavId);
  const setPrimaryWorkspace = useUiStore((s) => s.setPrimaryWorkspace);
  const user = useAuthStore((s) => s.user);
  const role = getUserRole(user);

  const handleNavigate = useCallback(
    (id: string) => {
      if (!canAccessShellNav(role, id)) {
        toast.warning("No permission", "You do not have access to this section.");
        return;
      }
      if (id === "dashboard") {
        setShellNavId(id);
        setPrimaryWorkspace("command-centre");
        return;
      }
      if (id === "live-map") {
        setShellNavId(id);
        setPrimaryWorkspace("operations");
        return;
      }
      if (id === "datasets") {
        setShellNavId(id);
        setPrimaryWorkspace("command-centre");
        return;
      }
      if (id === "exports") {
        setShellNavId(id);
        setPrimaryWorkspace("command-centre");
        return;
      }
      if (id === "audit") {
        setShellNavId(id);
        setPrimaryWorkspace("command-centre");
        return;
      }
      if (id === "settings") {
        setShellNavId(id);
        setPrimaryWorkspace("command-centre");
        return;
      }
      const placeholder = getShellNavPlaceholder(id);
      toast.info(
        placeholder?.title ?? "On the roadmap",
        <ShellNavPlaceholderDescription navId={id} />,
      );
    },
    [role, setShellNavId, setPrimaryWorkspace],
  );

  return (
    <div
      className="grid h-[100dvh] w-full overflow-hidden"
      data-color-mode={colorMode}
      style={{
        gridTemplateColumns: "220px 1fr",
        gridTemplateRows: "52px 1fr",
        backgroundColor: colors.bg.primary,
        color: colors.text.primary,
      }}
    >
      <Topbar
        alertCount={alertCount}
        alertPulse={alertPulse}
        showUserAvatar={topbarUserAvatar}
      />
      <Sidebar activeId={shellNavId} onNavigate={handleNavigate} alertCount={alertCount} />
      <main
        className={cn(
          "row-start-2 col-start-2 min-h-0 min-w-0",
          mainPadding
            ? "flex flex-col overflow-auto p-5"
            : "flex flex-col overflow-hidden p-0",
          mainClassName,
        )}
        style={{
          backgroundColor: colors.bg.primary,
          color: colors.text.primary,
        }}
      >
        {children}
      </main>
    </div>
  );
}
