/**
 * Modal for cropping an attached image before submitting feedback.
 * Uses react-easy-crop for drag/zoom crop interactions.
 */
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ImageCropModalProps = {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (blob: Blob) => void;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function createCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2d context not available");
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to create blob"))),
      "image/png",
      0.95,
    );
  });
}

export function ImageCropModal({
  open,
  imageSrc,
  onClose,
  onCropComplete,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    setIsCropping(true);
    try {
      const blob = await createCroppedImage(imageSrc, croppedAreaPixels);
      onCropComplete(blob);
      onClose();
    } catch (err) {
      console.error("Failed to crop image:", err);
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="sm:max-w-2xl animate-none data-[state=open]:animate-none"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle>Crop image</DialogTitle>
        </DialogHeader>
        <div className="relative h-[300px] w-full">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={undefined}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteCallback}
            onZoomChange={setZoom}
            cropShape="rect"
            showGrid={true}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <DialogFooter showCloseButton={false}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={!croppedAreaPixels || isCropping}
          >
            {isCropping ? "Applying…" : "Apply crop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
