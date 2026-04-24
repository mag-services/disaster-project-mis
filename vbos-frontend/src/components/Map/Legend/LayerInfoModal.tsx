import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { LegendLayer } from "./types";

interface LayerInfoModalProps {
  layer: LegendLayer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LayerInfoModal(props: LayerInfoModalProps) {
  const { layer, open, onOpenChange } = props;

  if (!layer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Layer Information</DialogTitle>
          <DialogDescription>
            Details about the selected map layer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Name</p>
            <h3 className="text-base font-semibold">{layer.name}</h3>
          </div>

          {layer.description && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Description
              </p>
              <p>{layer.description}</p>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Type</p>
            <Badge variant="secondary">{layer.dataType}</Badge>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Dataset ID
            </p>
            <p>{layer.id}</p>
          </div>

          {layer.unit && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Unit of Measurement
              </p>
              <p>{layer.unit}</p>
            </div>
          )}

          {layer.dataType === "tabular" && layer.dataRange && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Data Range
                </p>
                <p>
                  {layer.dataRange.min.toLocaleString()} -{" "}
                  {layer.dataRange.max.toLocaleString()}
                  {layer.unit ? ` ${layer.unit}` : ""}
                </p>
              </div>
            </>
          )}

          {layer.dataType === "vector" && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Geometry Type
                </p>
                <p>{layer.geometryType}</p>
              </div>
            </>
          )}

          {layer.source && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Data Source
                </p>
                <p className="text-sm">{layer.source}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
