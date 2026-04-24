import { ReactNode, useState, useEffect, useRef } from "react";
import * as ReactDOM from "react-dom";
import { LuColumns2, LuLayers, LuMaximize2, LuMinimize2, LuPanelLeft, LuPanelRight, LuX } from "react-icons/lu";
import { Tooltip as AppTooltip } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

const MOBILE_BREAKPOINT = 768;

type Props = {
  title: string;
  direction: "right" | "left";
  children?: ReactNode;
  badgeCount?: number;
  /** Optional pill/badge text (e.g. "Baseline datasets only" in Climate mode) */
  subtitle?: string;
  /** When provided, shown in collapsed icon-only mode. Receives onExpand to open sidebar. */
  collapsedIcons?: (onExpand: () => void) => ReactNode;
  /** When true, uses translucent background so map shows through (for left Data Layers sidebar) */
  transparent?: boolean;
  /** When true, panel is compact/floating (height fits content) instead of full height */
  floating?: boolean;
  /** When true, auto-collapse the sidebar (e.g. when no data to show) */
  collapseWhen?: boolean;
};

export const Sidebar = ({ title, direction, children, badgeCount = 0, subtitle, collapsedIcons, transparent, floating, collapseWhen }: Props) => {
  const isLeftSidebar = direction === "left";
  const {
    isMobile,
    setIsMobile,
    mobileOpenPanel,
    setMobileOpenPanel,
    mobilePanelFullScreen,
    setMobilePanelFullScreen,
    leftSidebarIconMode,
    rightSidebarIconMode,
    rightSidebarExpanded,
    setRightSidebarExpanded,
  } = useUiStore();

  const iconMode = isLeftSidebar ? leftSidebarIconMode : rightSidebarIconMode;
  const setIconMode = isLeftSidebar
    ? useUiStore.getState().setLeftSidebarIconMode
    : useUiStore.getState().setRightSidebarIconMode;

  const [desktopVisible, setDesktopVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    const isDesktop = window.innerWidth >= MOBILE_BREAKPOINT;
    if (isLeftSidebar) return isDesktop;
    if (collapseWhen) return false;
    const iconMode = useUiStore.getState().rightSidebarIconMode;
    return isDesktop && !iconMode;
  });

  const panelId = isLeftSidebar ? "left" : "right";
  const sideBarVisible = isMobile
    ? mobileOpenPanel === panelId
    : desktopVisible;

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpenPanel(mobileOpenPanel === panelId ? null : panelId);
      setMobilePanelFullScreen(false);
    } else {
      const wasCollapsed = !desktopVisible || iconMode;
      setDesktopVisible((prev) => !prev);
      if (wasCollapsed) setIconMode(false);
    }
  };

  const prevCollapseWhen = useRef(collapseWhen);
  useEffect(() => {
    if (isMobile) return;
    if (collapseWhen && !prevCollapseWhen.current && sideBarVisible) {
      setIconMode(true);
      setDesktopVisible(false);
    } else if (!collapseWhen && prevCollapseWhen.current) {
      setIconMode(false);
      setDesktopVisible(true);
    }
    prevCollapseWhen.current = collapseWhen;
  }, [collapseWhen, isMobile, sideBarVisible, setIconMode]);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      if (mobile) setMobileOpenPanel(null);
    };
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [setIsMobile, setMobileOpenPanel]);

  const isOverlay = sideBarVisible && !isLeftSidebar && rightSidebarExpanded;
  const overlayLeft = leftSidebarIconMode ? "3rem" : "20rem";

  /** On mobile, render panel as fixed bottom sheet via portal so it's visible (grid cells have minimal height) */
  const isMobileBottomSheet = isMobile && sideBarVisible;

  const panelContent = (
    <>
      <div
        className={cn(
          "flex flex-col overflow-hidden sidebar-spring will-change-[width,opacity]",
          floating ? "h-fit max-h-[calc(100vh-5rem)]" : "h-full max-h-[calc(100vh-3.5rem)]",
          transparent ? "glass-surface-translucent max-md:glass-surface-translucent" : "glass-surface max-md:glass-surface-mobile-overlay",
          "max-md:rounded-t-2xl max-md:border-t max-md:pt-1",
          "md:relative md:top-0 md:bottom-0",
          (sideBarVisible || (iconMode && !isMobile && !sideBarVisible)) ? "opacity-100" : "opacity-0",
          "max-md:absolute max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:z-[1000] max-md:max-h-[85vh] max-md:w-full max-md:max-w-none",
          sideBarVisible ? "max-md:shadow-xl" : "max-md:shadow-none",
          sideBarVisible ? (floating ? "w-80" : "w-[min(18rem,88vw)]") : "w-0",
          "md:min-w-0",
          !sideBarVisible && iconMode && "md:w-12",
          !sideBarVisible && !iconMode && "md:w-0",
          sideBarVisible && isLeftSidebar && "md:w-80",
          sideBarVisible && !isLeftSidebar && "md:min-w-0 md:w-full",
        )}
      >
        {(sideBarVisible || (iconMode && !isMobile && !sideBarVisible)) && (
          <>
            {/* Drag handle for mobile bottom sheets */}
            {isMobile && (
              <div className="flex shrink-0 justify-center pt-2 pb-1 md:hidden" aria-hidden>
                <div className="h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
              </div>
            )}
            <div
              className={cn(
                "flex min-h-10 shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3 max-md:min-h-12 max-md:gap-3 max-md:px-4 max-md:py-3",
                transparent ? "bg-white/5 dark:bg-white/[0.03]" : "bg-muted",
                iconMode && !sideBarVisible && !collapsedIcons && "flex-col min-h-0",
                iconMode && !sideBarVisible && collapsedIcons && "flex-col min-h-0 px-2",
              )}
            >
              {iconMode && !sideBarVisible && !collapsedIcons ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative min-h-11 min-w-11 touch-manipulation"
                  aria-label={`Open ${title}`}
                  onClick={toggleSidebar}
                >
                  <LuLayers className="size-4 icon-interactive" />
                  {badgeCount > 0 && (
                    <Badge
                      variant="default"
                      className="absolute -right-1 -top-1 size-5 items-center justify-center p-0"
                    >
                      {badgeCount}
                    </Badge>
                  )}
                </Button>
              ) : !(iconMode && !sideBarVisible) ? (
                <>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {title}
                    </h2>
                    {subtitle && (
                      <span className="truncate rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {subtitle}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!isMobile && !isLeftSidebar && (
                      <AppTooltip
                        content={rightSidebarExpanded ? "Restore panel width" : "Expand to full width"}
                        positioning={{ placement: "bottom" }}
                      >
                        <Button
                          variant={rightSidebarExpanded ? "secondary" : "ghost"}
                          size={rightSidebarExpanded ? "sm" : "icon-xs"}
                          className={rightSidebarExpanded ? "gap-1.5" : undefined}
                          aria-label={rightSidebarExpanded ? "Restore panel width" : "Expand to full width"}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setRightSidebarExpanded(!rightSidebarExpanded);
                          }}
                        >
                          {rightSidebarExpanded ? (
                            <>
                              <LuMinimize2 className="size-4 shrink-0" />
                              <span className="text-xs font-medium">Restore</span>
                            </>
                          ) : (
                            <LuMaximize2 className="size-4 icon-interactive" />
                          )}
                        </Button>
                      </AppTooltip>
                    )}
                    {!isMobile && !(!isLeftSidebar && rightSidebarExpanded) && (
                      <AppTooltip
                        content={iconMode ? "Expand to full panel" : "Collapse to icon bar"}
                        positioning={{ placement: "bottom" }}
                      >
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={iconMode ? "Expand panel" : "Collapse to icon bar"}
                          onClick={() => {
                            if (sideBarVisible) {
                              setIconMode(true);
                              setDesktopVisible(false);
                            } else {
                              setIconMode(false);
                              setDesktopVisible(true);
                            }
                          }}
                        >
                          <LuColumns2 className="size-4 icon-interactive" />
                        </Button>
                      </AppTooltip>
                    )}
                    {isMobile && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="min-h-11 min-w-11 touch-manipulation"
                          aria-label={mobilePanelFullScreen ? "Restore panel size" : "Expand to full screen"}
                          onClick={() => setMobilePanelFullScreen(!mobilePanelFullScreen)}
                        >
                          {mobilePanelFullScreen ? (
                            <LuMinimize2 className="size-5" />
                          ) : (
                            <LuMaximize2 className="size-5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="min-h-11 min-w-11 touch-manipulation -mr-1"
                          aria-label="Close panel"
                          onClick={toggleSidebar}
                        >
                          <LuX className="size-5" />
                        </Button>
                      </>
                    )}
                  </div>
                </>
              ) : iconMode && !sideBarVisible && collapsedIcons ? (
                <AppTooltip
                  content="Expand sidebar"
                  positioning={{ placement: "right" }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative min-h-11 min-w-11 touch-manipulation"
                    aria-label="Expand sidebar"
                    onClick={toggleSidebar}
                  >
                    {isLeftSidebar ? (
                      <LuPanelLeft className="size-4 icon-interactive" />
                    ) : (
                      <LuPanelRight className="size-4 icon-interactive" />
                    )}
                  </Button>
                </AppTooltip>
              ) : null}
            </div>
            {iconMode && !sideBarVisible && collapsedIcons ? (
              <div className="flex flex-1 flex-col overflow-hidden py-2">
                {collapsedIcons(toggleSidebar)}
              </div>
            ) : null}
            {sideBarVisible && children}
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      {isOverlay &&
        typeof document !== "undefined" &&
        ReactDOM.createPortal(
          <div
            className={cn(
              "fixed right-0 top-[3.5rem] bottom-0 z-[1050] flex flex-col overflow-hidden border-l border-border bg-card shadow-xl right-panel-overlay",
              transparent ? "glass-surface-translucent" : "glass-surface",
            )}
            style={{ left: overlayLeft }}
          >
            {panelContent}
          </div>,
          document.body,
        )}
      {isMobileBottomSheet &&
        typeof document !== "undefined" &&
        ReactDOM.createPortal(
          <>
            <div
              className="fixed inset-0 z-[1095] bg-black/20 backdrop-blur-[1px]"
              aria-hidden
              onClick={toggleSidebar}
            />
            <div
              className={cn(
                "fixed inset-x-0 bottom-0 top-auto z-[1100] flex flex-col overflow-hidden border-t border-border bg-card shadow-xl transition-[min-height,max-height] duration-200",
                mobilePanelFullScreen
                  ? "inset-0 min-h-full max-h-full rounded-none"
                  : "min-h-[min(50vh,400px)] max-h-[85vh] rounded-t-2xl",
                transparent ? "glass-surface-translucent" : "glass-surface glass-surface-mobile-overlay",
              )}
            >
              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                {panelContent}
              </div>
            </div>
          </>,
          document.body,
        )}
      <div
        className={cn(
          "relative min-w-0 overflow-hidden border-border shadow-sm",
          floating ? "h-fit max-h-[calc(100vh-3.5rem)]" : "h-full",
          transparent ? "glass-surface-translucent" : "glass-surface",
          isLeftSidebar ? "border-l-0 border-r" : "border-r-0 border-l",
          floating && (isLeftSidebar ? "rounded-r-xl" : "rounded-l-xl"),
          iconMode && !sideBarVisible && "z-[1001]",
          isOverlay && "md:invisible md:w-[28rem]",
        )}
      >
        {!isMobileBottomSheet && panelContent}
        {/* Mobile triggers hidden when using MobilePanelFAB (shown only when both panels closed) */}
        {!isMobile && !sideBarVisible && !(iconMode && !sideBarVisible) && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-10 z-20 min-h-11 min-w-11 touch-manipulation rounded-md bg-card",
            isLeftSidebar ? "-right-8 rounded-l-none" : "-left-8 rounded-r-none",
          )}
          aria-label={`Open ${title}`}
          onClick={toggleSidebar}
        >
          {isLeftSidebar ? <LuPanelLeft className="size-4 icon-interactive" /> : <LuPanelRight className="size-4 icon-interactive" />}
        </Button>
      )}
      </div>
    </>
  );
};
