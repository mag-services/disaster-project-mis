import { AppShell } from "@/components/shell";
import { ErrorBoundary } from "./components/ErrorBoundary";
import type { MapRef } from "./components/Map";
import { useEffect, useRef, lazy, Suspense } from "react";
import { LuRefreshCw } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useUrlSync } from "./hooks/useUrlSync";
import { useSmartDefaults } from "./hooks/useSmartDefaults";
import { useSessionSave } from "./hooks/useSessionSave";
import { usePrefetchLayerMetadata } from "./hooks/usePrefetchLayerMetadata";
import { useClimateModeEffect } from "./hooks/useClimateModeEffect";
import { useClimateModuleAutoLayers } from "./hooks/useClimateModuleAutoLayers";
import { useAuth } from "./hooks/useAuth";
import { useAutoLock } from "./hooks/useAutoLock";
import { useOfflineAreaSync } from "./hooks/useOfflineAreaSync";
import { useUiStore } from "@/store/ui-store";
import { useMapStore } from "@/store/map-store";
import { useViewStore } from "@/store/view-store";
import { useLockStore } from "@/store/lock-store";
import { useAuthStore } from "@/store/auth-store";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { TabularLayers } from "./components/Map/TabularLayer";
import { MapEmptyState } from "./components/MapEmptyState";
import { MapCursorRing } from "./components/Map/MapCursorRing";
import { MobilePanelFAB } from "./components/MobilePanelFAB";
import { MapModeBadge } from "./components/Map/MapModeBadge";
import { ClimateKeyIndicators } from "./components/Map/ClimateKeyIndicators";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { LayerAnnouncer } from "./components/LayerAnnouncer";
import { LockScreen } from "./components/LockScreen";
import { Login } from "./components/Login";
import { FeedbackButton } from "./components/Feedback/FeedbackButton";
import { MapFloatingChrome } from "./components/Map/MapFloatingChrome";
import { useAlertNotificationCenter } from "./hooks/useAlertNotificationCenter";
import { canAccessDataEntry, canAccessShellNav, getUserRole } from "@/lib/rbac";

// Lazy-load Map (Leaflet, layers) for faster initial paint
const Map = lazy(() => import("./components/Map").then((m) => ({ default: m.default })));
const Map3D = lazy(() =>
  import("./components/Map/Map3D").then((m) => ({ default: m.Map3D })),
);
// Lazy-load overlay components – only fetched when their mode is active
const FloatingTimeSeries = lazy(() =>
  import("./components/FloatingTimeSeries").then((m) => ({ default: m.default })),
);
const RightSidebar = lazy(() =>
  import("./components/RightSidebar").then((m) => ({ default: m.RightSidebar })),
);
const CommandCentre = lazy(() =>
  import("./pages/CommandCentre").then((m) => ({ default: m.CommandCentre })),
);
const DatasetsPage = lazy(() =>
  import("./pages/DatasetsPage").then((m) => ({ default: m.DatasetsPage })),
);
const ExportsPage = lazy(() =>
  import("./pages/ExportsPage").then((m) => ({ default: m.ExportsPage })),
);
const AuditLogPage = lazy(() =>
  import("./pages/AuditLogPage").then((m) => ({ default: m.AuditLogPage })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const AreaDataEntryPage = lazy(() =>
  import("./components/AreaDataEntry/AreaDataEntryPage").then((m) => ({
    default: m.AreaDataEntryPage,
  })),
);
const SimulationPanel = lazy(() =>
  import("./components/SimulationPanel").then((m) => ({ default: m.SimulationPanel })),
);
const MapQueryChat = lazy(() =>
  import("./components/Map/MapQueryChat").then((m) => ({ default: m.MapQueryChat })),
);

function MapLoadingSkeleton() {
  return (
    <div className="flex flex-1 flex-col bg-[var(--drmis-bg-elevated)] p-4 duration-200 animate-in fade-in">
      <div className="flex h-10 max-w-md gap-2 rounded-[var(--drmis-radius-card)] bg-card/80 p-2 shadow-[var(--drmis-shadow-sm)]">
        <div className="h-6 w-20 animate-pulse rounded-md bg-muted-foreground/15" />
        <div className="h-6 flex-1 animate-pulse rounded-md bg-muted-foreground/15" />
        <div className="h-6 w-16 animate-pulse rounded-md bg-muted-foreground/15" />
      </div>
      <div className="mt-4 h-full min-h-[12rem] w-full animate-pulse rounded-[var(--drmis-radius-card)] bg-muted-foreground/10" />
    </div>
  );
}

function SidebarLoadingSkeleton() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col border-l border-border bg-card p-3">
      <div className="h-8 w-3/4 max-w-[12rem] animate-pulse rounded-md bg-muted" />
      <div className="mt-4 min-h-[8rem] flex-1 animate-pulse rounded-md bg-muted/30" />
    </div>
  );
}

function DeferredPageFallback({ label }: { label: string }) {
  return (
    <div className="flex min-h-[40vh] flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
      <span>{label}</span>
    </div>
  );
}

function SidebarErrorFallback({
  error,
  retry,
  title,
  side,
}: {
  error: Error;
  retry: () => void;
  title: string;
  side: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex h-full min-w-[18rem] flex-col items-center justify-center gap-3 border-border bg-card p-4 text-center",
        side === "left" ? "md:border-r" : "md:border-l",
      )}
    >
      <p className="text-sm font-medium text-destructive">{title}</p>
      <p className="text-xs text-muted-foreground">{error.message}</p>
      <button
        type="button"
        onClick={retry}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
      >
        <LuRefreshCw className="size-3.5" />
        Try again
      </button>
    </div>
  );
}

function MapErrorFallback(error: Error, retry: () => void) {
  return (
    <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-3 bg-background/95 p-6 text-center">
      <p className="text-sm font-medium text-destructive">Map failed to load</p>
      <p className="max-w-sm text-xs text-muted-foreground">{error.message}</p>
      <button
        type="button"
        onClick={retry}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
      >
        <LuRefreshCw className="size-4" />
        Try again
      </button>
    </div>
  );
}

function App() {
  const mapRef = useRef<MapRef>(null);
  const mapMode = useMapStore((s) => s.mapMode);
  const { isAuthenticated } = useAuth();
  const scenarioId = useViewStore((s) => s.scenarioId);
  const {
    isMobile,
    mobileOpenPanel,
    setMobileOpenPanel,
    rightSidebarIconMode,
    dataEntryPageOpen,
    primaryWorkspace,
    shellNavId,
    setShellNavId,
    setPrimaryWorkspace,
  } = useUiStore();
  const { isLocked } = useLockStore();
  const isTimeSeriesOpen = useUiStore((s) => s.isTimeSeriesOpen);
  const { alertCount, alertPulse } = useAlertNotificationCenter();
  const user = useAuthStore((s) => s.user);
  const role = getUserRole(user);
  useUrlSync();
  useSmartDefaults();
  useSessionSave();
  usePrefetchLayerMetadata();
  useClimateModeEffect();
  useClimateModuleAutoLayers();
  useKeyboardShortcuts();
  useAutoLock();
  useOfflineAreaSync();

  // Deep-link support for admin “View on Live Map” actions.
  // If the server forwards `/live-map` to the SPA, we still need to switch
  // the primary workspace so the map view is rendered (not Command Centre).
  useEffect(() => {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    if (path.includes("live-map")) {
      setShellNavId("live-map");
      setPrimaryWorkspace("operations");
    }
  }, [setShellNavId, setPrimaryWorkspace]);

  if (!isAuthenticated) {
    return <Login />;
  }
  if (dataEntryPageOpen) {
    if (!canAccessDataEntry(role)) {
      return (
        <AccessDeniedView
          title="No permission for Data Entry"
          message="Your role does not allow access to the Data Entry workflow."
        />
      );
    }
    return (
      <Suspense fallback={<DeferredPageFallback label="Loading data entry…" />}>
        <AreaDataEntryPage />
      </Suspense>
    );
  }

  const navAllowed = canAccessShellNav(role, shellNavId);
  return (
    <>
      {isLocked && <LockScreen />}
      <OfflineIndicator />
      <LayerAnnouncer />
      <AppShell
        mainPadding={primaryWorkspace === "command-centre"}
        alertCount={alertCount}
        alertPulse={alertPulse}
      >
        {primaryWorkspace === "command-centre" ? (
          navAllowed ? (
            <Suspense fallback={<DeferredPageFallback label="Loading…" />}>
              {shellNavId === "datasets" ? (
                <DatasetsPage />
              ) : shellNavId === "exports" ? (
                <ExportsPage />
              ) : shellNavId === "audit" ? (
                <AuditLogPage />
              ) : shellNavId === "settings" ? (
                <SettingsPage />
              ) : (
                <CommandCentre />
              )}
            </Suspense>
          ) : (
            <AccessDeniedView
              title="You don't have permission"
              message="Your current role cannot access this section. Contact an administrator if you need expanded access."
            />
          )
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div
              id="main"
              className={cn(
                "grid min-h-0 min-w-0 flex-1 overflow-hidden md:grid-rows-1 grid-rows-[1fr_auto]",
                rightSidebarIconMode
                  ? "md:grid-cols-[1fr_3rem]"
                  : "md:grid-cols-[1fr_28rem]",
              )}
            >
              <div
                id="drmis-map-stage"
                className={cn(
                  "relative map-area min-w-0 min-h-0 overflow-hidden transition-colors duration-500",
                  scenarioId === "climate" && "bg-emerald-500/[0.04]",
                  (scenarioId === "disaster" || scenarioId === "compare") &&
              "bg-red-500/[0.03]",
                )}
                onClick={() => {
                  if (isMobile && mobileOpenPanel) setMobileOpenPanel(null);
                }}
              >
                <ErrorBoundary fallbackRender={MapErrorFallback}>
                  <div className="relative flex h-full min-h-0 flex-col">
                    <MapCursorRing />
                    <TabularLayers />
                    <Suspense fallback={<MapLoadingSkeleton />}>
                      {mapMode === "3d" ? <Map3D /> : <Map ref={mapRef} />}
                    </Suspense>
                    <ClimateKeyIndicators />
                    <MapEmptyState />
                    <MapFloatingChrome />
                    <Suspense fallback={null}>
                      <MapQueryChat />
                    </Suspense>
                    <Suspense fallback={null}>
                      <SimulationPanel />
                    </Suspense>
                    <MobilePanelFAB />
                    <MapModeBadge />
                    {!isLocked && <FeedbackButton />}
                    {isTimeSeriesOpen && (
                      <Suspense fallback={null}>
                        <FloatingTimeSeries />
                      </Suspense>
                    )}
                  </div>
                </ErrorBoundary>
              </div>
              <div className="min-h-0 min-w-0 overflow-hidden">
                <ErrorBoundary
                  fallbackRender={(error, retry) => (
                    <SidebarErrorFallback
                      error={error}
                      retry={retry}
                      title="Context panel failed"
                      side="right"
                    />
                  )}
                >
                  <Suspense fallback={<SidebarLoadingSkeleton />}>
                    <RightSidebar />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </>
  );
}

export default App;

function AccessDeniedView({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card p-6 text-center">
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="max-w-xl text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
