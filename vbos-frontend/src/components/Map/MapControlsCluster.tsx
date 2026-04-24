import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LuBox,
  LuMinus,
  LuMoon,
  LuPlus,
  LuSatellite,
  LuSparkles,
  LuSun,
} from "react-icons/lu";
import type { MapRef } from "./index";
import { useMapStore, BASEMAP_STYLES } from "@/store/map-store";
import { Tooltip } from "@/components/ui";

type MapControlsClusterProps = {
  map: MapRef | undefined;
};

export function MapControlsCluster({ map }: MapControlsClusterProps) {
  const { mapStyle, mapMode, setMapStyle, setMapMode } = useMapStore();

  const currentId = BASEMAP_STYLES.find((s) => s.url === mapStyle)?.id ?? "positron";

  const basemapIcons: Record<string, ReactNode> = {
    positron: <LuSun className="size-4" />,
    positron_nolabels: <LuSun className="size-4" />,
    dark: <LuMoon className="size-4" />,
    dark_nolabels: <LuMoon className="size-4" />,
    bright: <LuSparkles className="size-4" />,
    terrain: <LuSparkles className="size-4" />,
    satellite: <LuSatellite className="size-4" />,
    google_satellite: <LuSatellite className="size-4" />,
  };

  return (
    <div className="absolute right-3 top-[4.5rem] z-[1000] flex flex-col gap-0.5 overflow-hidden rounded-[var(--drmis-radius-card)] border border-border p-1 shadow-[var(--drmis-shadow-sm)] glass-surface max-md:right-3 max-md:top-[4.5rem] md:right-6 md:top-[5.25rem]">
      <DropdownMenu>
        <Tooltip content="Basemap (Light, Dark, Satellite…)" positioning={{ placement: "left" }}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-11 min-h-11 min-w-11 w-11 touch-manipulation md:h-9 md:w-full md:min-h-0 md:min-w-0"
              aria-label="Basemap (Light, Dark, Satellite)"
              title="Basemap"
            >
              {basemapIcons[currentId] ?? basemapIcons.positron}
            </Button>
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent align="end" className="min-w-[11rem]">
          {BASEMAP_STYLES.map((s) => (
            <DropdownMenuItem
              key={s.id}
              onClick={() => setMapStyle(s.url)}
              className={currentId === s.id ? "bg-muted" : undefined}
            >
              {basemapIcons[s.id]}
              <span className="ml-2">{s.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="mx-1 h-px bg-border" />
      <Tooltip
        content={mapMode === "3d" ? "Switch to 2D" : "Switch to 3D view"}
        positioning={{ placement: "left" }}
      >
        <Button
          variant={mapMode === "3d" ? "secondary" : "ghost"}
          size="icon"
          className="h-11 min-h-11 min-w-11 w-11 touch-manipulation md:h-9 md:w-full md:min-h-0 md:min-w-0"
          aria-label={mapMode === "3d" ? "Switch to 2D" : "Switch to 3D view"}
          onClick={() => setMapMode(mapMode === "3d" ? "2d" : "3d")}
        >
          <LuBox className="size-4" />
        </Button>
      </Tooltip>
      <div className="mx-1 h-px bg-border" />
      <div className="flex flex-col gap-0">
        <Tooltip content="Zoom in" positioning={{ placement: "left" }}>
          <Button
            size="icon"
            variant="ghost"
            className="h-11 min-h-11 min-w-11 w-11 touch-manipulation md:h-9 md:w-full md:min-h-0 md:min-w-0"
            aria-label="Zoom in"
            onClick={() => map?.zoomIn()}
          >
            <LuPlus className="size-4 icon-interactive" />
          </Button>
        </Tooltip>
        <Tooltip content="Zoom out" positioning={{ placement: "left" }}>
          <Button
            size="icon"
            variant="ghost"
            className="h-11 min-h-11 min-w-11 w-11 touch-manipulation md:h-9 md:w-full md:min-h-0 md:min-w-0"
            aria-label="Zoom out"
            onClick={() => map?.zoomOut()}
          >
            <LuMinus className="size-4 icon-interactive" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
