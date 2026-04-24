import { startTransition, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { LuTrash2 } from "react-icons/lu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLayerStore } from "@/store/layer-store";

/**
 * Lists all currently enabled datasets. Independent of the cluster dropdown.
 * Toggling off removes the layer and it disappears from the list.
 */
export function ActiveLayersList() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { layers, switchLayer, setLayers, setTabularLayerData, getLayerMetadata } =
    useLayerStore();
  const allLayerIds = layers ? layers.split(",").map((l) => l.trim()).filter(Boolean) : [];
  const layerIds = allLayerIds.filter((id) => !id.startsWith("t"));

  if (layerIds.length === 0) return null;

  const handleClearAll = () => {
    setConfirmOpen(false);
    startTransition(() => {
      setTabularLayerData([]);
      setLayers("");
    });
  };

  return (
    <div className="border-b border-border px-4 py-3 md:px-5 md:py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Selected datasets
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
          aria-label="Remove all datasets"
        >
          <LuTrash2 className="size-3.5" />
          Clear all
        </Button>
      </div>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={true} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove all datasets?</DialogTitle>
            <DialogDescription>
              This will clear all {allLayerIds.length} selected dataset
              {allLayerIds.length === 1 ? "" : "s"} from the map. You can add them back
              from the Data Layers panel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false}>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAll}
              className="gap-1.5"
            >
              <LuTrash2 className="size-3.5" />
              Remove all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex flex-col gap-1.5">
        {layerIds.map((layerId) => {
          const metadata = getLayerMetadata(layerId);
          const title = metadata?.name ?? `Layer ${layerId}`;

          return (
            <label
              key={layerId}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
            >
              <Switch
                id={`active-${layerId}`}
                size="sm"
                checked={true}
                onCheckedChange={() => startTransition(() => switchLayer(layerId))}
              />
              <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm">
                {title}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
