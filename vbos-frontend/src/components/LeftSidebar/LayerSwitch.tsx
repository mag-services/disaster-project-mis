import { startTransition } from "react";
import { Layers, MapPin, Table } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useLayerStore } from "@/store/layer-store";
import { cn } from "@/lib/utils";

type LayerSwitchProps = {
  title: React.ReactNode;
  id: number;
  dataType: "raster" | "vector" | "tabular" | "pmtiles";
  /** When true, switch is disabled and greyed out (e.g. hazard not yet uploaded by admin) */
  disabled?: boolean;
};

const LayerSwitch = ({ title, id, dataType, disabled = false }: LayerSwitchProps) => {
  const { layers, switchLayer } = useLayerStore();
  const urlLayerId = `${dataType.slice(0, 1)}${id}`;
  const checked = layers.split(",").includes(urlLayerId);

  const Icon =
    dataType === "raster" || dataType === "pmtiles"
      ? Layers
      : dataType === "vector"
        ? MapPin
        : Table;

  return (
    <label
      className={cn(
        "flex items-center gap-2",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      )}
    >
      <Switch
        id={`layer-${urlLayerId}`}
        size="sm"
        checked={checked}
        disabled={disabled}
        onCheckedChange={disabled ? undefined : () => startTransition(() => switchLayer(urlLayerId))}
      />
      <div className="flex min-w-0 items-center gap-1.5">
        <Icon className="size-3.5 shrink-0 text-muted-foreground/70" />
        <span className="overflow-hidden text-ellipsis whitespace-pre font-normal">
          {title}
        </span>
      </div>
    </label>
  );
};

export { LayerSwitch };
