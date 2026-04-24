/**
 * Overlay for selecting a region from a captured page image.
 * Click and drag to draw a selection, resize via handles, click outside to clear.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { LuCheck, LuX } from "react-icons/lu";

type Rect = { x: number; y: number; width: number; height: number };

type ScreenCaptureOverlayProps = {
  imageDataUrl: string;
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
};

const HANDLE_SIZE = 10;
const MIN_SIZE = 10;

function cropImageToBlob(
  img: HTMLImageElement,
  rect: Rect,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = rect.width;
  canvas.height = rect.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2d not available");
  ctx.drawImage(
    img,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    rect.width,
    rect.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to create blob"))),
      "image/png",
      0.95,
    );
  });
}

function isPointInRect(px: number, py: number, r: Rect): boolean {
  return px >= r.x && px <= r.x + r.width && py >= r.y && py <= r.y + r.height;
}

function getHandleAt(
  x: number,
  y: number,
  r: Rect,
): "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | null {
  const h = HANDLE_SIZE;
  if (x >= r.x - h && x <= r.x + h && y >= r.y - h && y <= r.y + h) return "nw";
  if (x >= r.x + r.width - h && x <= r.x + r.width + h && y >= r.y - h && y <= r.y + h) return "ne";
  if (x >= r.x + r.width - h && x <= r.x + r.width + h && y >= r.y + r.height - h && y <= r.y + r.height + h) return "se";
  if (x >= r.x - h && x <= r.x + h && y >= r.y + r.height - h && y <= r.y + r.height + h) return "sw";
  if (x >= r.x + r.width / 2 - h && x <= r.x + r.width / 2 + h && y >= r.y - h && y <= r.y + h) return "n";
  if (x >= r.x + r.width / 2 - h && x <= r.x + r.width / 2 + h && y >= r.y + r.height - h && y <= r.y + r.height + h) return "s";
  if (x >= r.x + r.width - h && x <= r.x + r.width + h && y >= r.y + r.height / 2 - h && y <= r.y + r.height / 2 + h) return "e";
  if (x >= r.x - h && x <= r.x + h && y >= r.y + r.height / 2 - h && y <= r.y + r.height / 2 + h) return "w";
  return null;
}

export function ScreenCaptureOverlay({
  imageDataUrl,
  onCapture,
  onCancel,
}: ScreenCaptureOverlayProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<Rect | null>(null);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [resizing, setResizing] = useState<"nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | null>(null);

  const toContainerCoords = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const { x, y } = toContainerCoords(e);
    if (!selection || selection.width < MIN_SIZE || selection.height < MIN_SIZE) {
      setStart({ x, y });
      setSelection({ x, y, width: 0, height: 0 });
      setSelecting(true);
      return;
    }
    const handle = getHandleAt(x, y, selection);
    if (handle) {
      setResizing(handle);
    } else if (!isPointInRect(x, y, selection)) {
      setSelection(null);
      setStart({ x, y });
      setSelection({ x, y, width: 0, height: 0 });
      setSelecting(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = toContainerCoords(e);
    if (selecting && start) {
      const minX = Math.min(start.x, x);
      const minY = Math.min(start.y, y);
      const width = Math.abs(x - start.x);
      const height = Math.abs(y - start.y);
      setSelection({ x: minX, y: minY, width, height });
    } else if (resizing && selection) {
      const s = { ...selection };
      switch (resizing) {
        case "se":
          s.width = Math.max(MIN_SIZE, x - s.x);
          s.height = Math.max(MIN_SIZE, y - s.y);
          break;
        case "sw":
          s.width = Math.max(MIN_SIZE, s.x + s.width - x);
          s.x = x;
          s.height = Math.max(MIN_SIZE, y - s.y);
          break;
        case "ne":
          s.width = Math.max(MIN_SIZE, x - s.x);
          s.height = Math.max(MIN_SIZE, s.y + s.height - y);
          s.y = y;
          break;
        case "nw":
          s.width = Math.max(MIN_SIZE, s.x + s.width - x);
          s.x = x;
          s.height = Math.max(MIN_SIZE, s.y + s.height - y);
          s.y = y;
          break;
        case "e":
          s.width = Math.max(MIN_SIZE, x - s.x);
          break;
        case "w":
          s.width = Math.max(MIN_SIZE, s.x + s.width - x);
          s.x = x;
          break;
        case "s":
          s.height = Math.max(MIN_SIZE, y - s.y);
          break;
        case "n":
          s.height = Math.max(MIN_SIZE, s.y + s.height - y);
          s.y = y;
          break;
      }
      setSelection(s);
    }
  };

  const handleMouseUp = () => {
    setSelecting(false);
    setResizing(null);
    if (selection && selection.width < MIN_SIZE && selection.height < MIN_SIZE) {
      setSelection(null);
    }
  };

  const handleCapture = async () => {
    const img = imgRef.current;
    if (!img || !selection || selection.width < MIN_SIZE || selection.height < MIN_SIZE) return;
    const container = containerRef.current;
    if (!container) return;

    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;
    const imgLeftInContainer = imgRect.left - containerRect.left;
    const imgTopInContainer = imgRect.top - containerRect.top;

    const cropRect: Rect = {
      x: (selection.x - imgLeftInContainer) * scaleX,
      y: (selection.y - imgTopInContainer) * scaleY,
      width: selection.width * scaleX,
      height: selection.height * scaleY,
    };

    cropRect.x = Math.max(0, Math.min(img.naturalWidth - 1, cropRect.x));
    cropRect.y = Math.max(0, Math.min(img.naturalHeight - 1, cropRect.y));
    cropRect.width = Math.max(1, Math.min(img.naturalWidth - cropRect.x, cropRect.width));
    cropRect.height = Math.max(1, Math.min(img.naturalHeight - cropRect.y, cropRect.height));

    try {
      const blob = await cropImageToBlob(img, cropRect);
      onCapture(blob);
    } catch (err) {
      console.error("Crop failed:", err);
    }
  };

  useEffect(() => {
    const onUp = () => {
      setSelecting(false);
      setResizing(null);
    };
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, []);

  const overlay = (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-black/90"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-auto p-4">
        <p className="text-sm text-white/90">
          Drag to select, resize with handles, click outside to clear, then Capture
        </p>
        <div
          ref={containerRef}
          className="relative flex max-h-[70vh] max-w-full cursor-crosshair select-none items-center justify-center overflow-auto rounded-lg border-2 border-white/30"
          onMouseDown={handleMouseDown}
        >
          <img
            ref={imgRef}
            src={imageDataUrl}
            alt="Page capture"
            draggable={false}
            className="max-h-[70vh] max-w-full select-none object-contain"
            style={{ display: "block" }}
          />
          {selection && selection.width >= MIN_SIZE && selection.height >= MIN_SIZE && (
            <div
              className="absolute border-2 border-primary bg-primary/20"
              style={{
                left: selection.x,
                top: selection.y,
                width: selection.width,
                height: selection.height,
                pointerEvents: "none",
              }}
            >
              {(["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const).map((pos) => (
                <div
                  key={pos}
                  className="absolute rounded-full border-2 border-white bg-primary"
                  style={{
                    width: HANDLE_SIZE,
                    height: HANDLE_SIZE,
                    pointerEvents: "auto",
                    cursor: `${pos}-resize`,
                    left: pos.includes("w") ? -HANDLE_SIZE / 2 : pos.includes("e") ? selection.width - HANDLE_SIZE / 2 : selection.width / 2 - HANDLE_SIZE / 2,
                    top: pos.includes("n") ? -HANDLE_SIZE / 2 : pos.includes("s") ? selection.height - HANDLE_SIZE / 2 : selection.height / 2 - HANDLE_SIZE / 2,
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setResizing(pos);
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-white/50 bg-black/50 text-white hover:bg-white/10"
          >
            <LuX className="size-4 mr-1.5" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCapture}
            disabled={!selection || selection.width < MIN_SIZE || selection.height < MIN_SIZE}
          >
            <LuCheck className="size-4 mr-1.5" />
            Capture
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
