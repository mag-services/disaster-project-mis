/**
 * Minimal header: logo + title | avatar, theme toggle.
 * Sticky with glass blur + shadow on scroll. Inter/SF Pro typography.
 */
import { useState, useEffect, useCallback } from "react";
import { HelpOverlay } from "@/components/HelpOverlay";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui";
import {
  LuCircleHelp,
  LuLockKeyhole,
  LuLock,
  LuLogOut,
  LuShare2,
  LuUser,
  LuCopy,
  LuCheck,
  LuClipboardList,
  LuGauge,
} from "react-icons/lu";
import { useAuthStore } from "@/store/auth-store";
import { useViewStore } from "@/store/view-store";
import { HEADER_MODE_META } from "@/config/modes";
import { ResilienceMapModeIndicator } from "@/components/shell/ResilienceMapModeIndicator";
import { useLockStore } from "@/store/lock-store";
import { useUiStore } from "@/store/ui-store";
import { useSimulationStore } from "@/store/simulation-store";
import { toast } from "@/utils/toast";
import { cn } from "@/lib/utils";

const API_HOST = import.meta.env.VITE_API_HOST ?? "";
function avatarUrl(avatar: string | null | undefined): string | null {
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  return `${API_HOST.replace(/\/$/, "")}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
}

export type HeaderProps = {
  /** Hide left logo block when the shell topbar already shows DRMIS branding. */
  hideBrand?: boolean;
  /** Use a menu icon instead of avatar trigger (when shell `<UserAvatar />` shows account). */
  hideUserMenu?: boolean;
  /** Hide Simulate when the map toolbar already exposes it (operations / live map). */
  hideSimulateButton?: boolean;
};

export function Header({
  hideBrand = false,
  hideUserMenu = false,
  hideSimulateButton = false,
}: HeaderProps) {
  const [shareDialogIsOpen, setShareDialogIsOpen] = useState(false);
  const [helpOverlayOpen, setHelpOverlayOpen] = useState(false);
  const setDataEntryPageOpen = useUiStore((s) => s.setDataEntryPageOpen);
  const [scrolled, setScrolled] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const scenarioId = useViewStore((s) => s.scenarioId);
  const [modeHelpOpen, setModeHelpOpen] = useState(false);
  const { lock, pinHash, resetLockOnLogout } = useLockStore();
  const { isOpen: simOpen, setIsOpen: setSimOpen } = useSimulationStore();

  const handleLogout = () => {
    resetLockOnLogout();
    clearAuth();
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY ?? document.documentElement.scrollTop;
      setScrolled(scrollTop > 4);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-[100] flex h-14 min-h-14 min-w-0 items-center gap-4 overflow-hidden px-4 transition-shadow duration-200",
        "border-b border-border glass-surface-strong",
        "shadow-[0_1px_0_0_var(--border)]",
        scrolled && "shadow-[0_1px_0_0_var(--border),0_4px_12px_-2px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_0_0_var(--border),0_4px_12px_-2px_rgba(0,0,0,0.25)]",
      )}
    >
      {/* Left: Logo + Title (optional — hidden when AppShell Topbar shows brand) */}
      {!hideBrand ? (
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <img
            src="/DRMISLogo.svg"
            alt="DRMIS Logo"
            className="size-8 shrink-0"
          />
          <div className="flex min-w-0 flex-col gap-0">
            <h1
              className="font-sans text-sm font-bold tracking-tight text-foreground"
              title="Disaster Risk Management Information System"
            >
              DRMIS
            </h1>
            <span className="hidden text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:inline">
              Disaster Risk Management Information System
            </span>
          </div>
        </div>
      ) : null}

      {/* Center: Resilience map + current context (hazard / climate / compare via Map data) */}
      <div className="flex min-w-0 flex-1 items-center justify-center px-2">
        <ResilienceMapModeIndicator
          scenarioId={scenarioId}
          layout="header"
          onHelpClick={() => setModeHelpOpen(true)}
        />
      </div>

      <Dialog open={modeHelpOpen} onOpenChange={setModeHelpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resilience map</DialogTitle>
            <DialogDescription className="sr-only">
              One workspace: pick thematic cluster, climate module, or compare via Map data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Resilience map</strong> — Use{" "}
              <strong className="text-foreground">Map data</strong> in the sidebar to switch
              between thematic clusters, climate modules, or Compare years. The header shows your
              current context.
            </p>
            <p>
              <strong className="text-foreground">Disaster (hazard)</strong> —{" "}
              {HEADER_MODE_META.disaster.subtitle}. Vector and tabular layers for risk
              and response.
            </p>
            <p>
              <strong className="text-foreground">Climate (trend)</strong> —{" "}
              {HEADER_MODE_META.climate.subtitle}. Baseline rasters and drivers by
              climate module.
            </p>
            <p>
              <strong className="text-foreground">Compare</strong> —{" "}
              Side-by-side years on the map. Drag the center handle to compare; use the
              context panel to pick years and layers (tabular or raster).
            </p>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => setModeHelpOpen(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Right: Simulation (optional), Theme, Avatar - 44px touch targets on mobile */}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        {!hideSimulateButton && (
        <Tooltip
          content="Run a scenario simulation using current layer settings"
          positioning={{ placement: "bottom" }}
          contentProps={{ className: "max-w-[16rem] text-balance" }}
        >
          <Button
            variant={simOpen ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "min-h-11 min-w-11 md:min-h-0 md:min-w-0 md:h-8 md:w-auto gap-1.5 px-2 md:px-2.5 text-xs",
              simOpen && "ring-1 ring-primary/30",
            )}
            onClick={() => setSimOpen(!simOpen)}
            aria-label="Simulate: run a scenario using current layer settings"
            aria-pressed={simOpen}
          >
            <LuGauge className="size-4 md:size-3.5" />
            <span className="hidden md:inline">Simulate</span>
          </Button>
        </Tooltip>
        )}
        {!hideUserMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="min-h-11 min-w-11 size-11 shrink-0 touch-manipulation overflow-hidden rounded-full hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 inline-flex items-center justify-center md:size-8"
              aria-label="Open menu"
            >
              {avatarUrl(user?.avatar) ? (
                <img
                  src={avatarUrl(user?.avatar)!}
                  alt=""
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <LuUser className="size-4 icon-interactive" />
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[11rem]">
              <DropdownMenuLabel className="font-normal text-muted-foreground">
                {user?.username}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setHelpOverlayOpen(true)}>
                <LuCircleHelp className="size-4" />
                Help
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDataEntryPageOpen(true)}>
                <LuClipboardList className="size-4" />
                Data Entry
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setShareDialogIsOpen(true)}>
                <LuShare2 className="size-4" />
                Share
              </DropdownMenuItem>
              {pinHash && (
                <DropdownMenuItem onSelect={() => lock()}>
                  <LuLock className="size-4" />
                  Lock screen
                </DropdownMenuItem>
              )}
              {user?.is_staff && (
                <DropdownMenuItem asChild>
                  <a
                    href={`${import.meta.env.VITE_API_HOST ?? ""}/admin/`}
                    className="flex items-center gap-2 text-inherit no-underline"
                  >
                    <LuLockKeyhole className="size-4" />
                    Admin
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LuLogOut className="size-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <ShareDialog
        isOpen={shareDialogIsOpen}
        setIsOpen={setShareDialogIsOpen}
      />
      <HelpOverlay open={helpOverlayOpen} onOpenChange={setHelpOverlayOpen} />
    </header>
  );
}

type ShareDialogProps = {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
};

function ShareDialog({ isOpen, setIsOpen }: ShareDialogProps) {
  const url = typeof window !== "undefined" ? window.location.href : "";
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [url]);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => setIsOpen(o)}>
      <DialogContent className="min-w-0 overflow-hidden sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
          <DialogDescription>
            Copy the link below to share the current view with others.
          </DialogDescription>
        </DialogHeader>
        <div className="min-w-0 overflow-x-auto break-all rounded-md border border-border bg-muted p-2 text-sm">
          {url}
        </div>
        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <LuCheck className="size-4" />
                Copied
              </>
            ) : (
              <>
                <LuCopy className="size-4" />
                Copy Link
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
