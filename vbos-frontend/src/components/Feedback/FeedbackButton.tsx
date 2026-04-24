/**
 * Usersnap-style feedback: vertical "Feedback" button, menu-driven flow.
 */
import { useState, useCallback } from "react";
import html2canvas from "html2canvas-pro";
import { LuMessageCircleQuestion, LuBug, LuLightbulb, LuMessageSquare } from "react-icons/lu";
import { toast } from "@/utils/toast";
import { ScreenCaptureOverlay } from "./ScreenCaptureOverlay";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/auth-store";
import { FeedbackForm } from "./FeedbackForm";
import type { FeedbackCategory } from "@/api/feedback";

const MENU_OPTIONS: { value: FeedbackCategory; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "bug",
    label: "Report an issue",
    description: "Having trouble? Please let us know. We'll reply as soon as possible.",
    icon: <LuBug className="size-5 shrink-0 text-primary" />,
  },
  {
    value: "feature",
    label: "Request feature",
    description: "Missing something? Send your idea for product improvement.",
    icon: <LuLightbulb className="size-5 shrink-0 text-primary" />,
  },
  {
    value: "general",
    label: "General feedback",
    description: "Share your thoughts or suggestions with us.",
    icon: <LuMessageSquare className="size-5 shrink-0 text-primary" />,
  },
];

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | null>(null);
  const user = useAuthStore((s) => s.user);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedCategory(null);
      setScreenshot(null);
      setScreenshotPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
    setOpen(next);
  };

  const handleSelectOption = (category: FeedbackCategory) => {
    setSelectedCategory(category);
  };

  const [screenshot, setScreenshot] = useState<Blob | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const handleScreenshotChange = useCallback((blob: Blob) => {
    setScreenshot(blob);
    setScreenshotPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
  }, []);

  const handleSuccess = () => {
    setOpen(false);
    setSelectedCategory(null);
    setScreenshot(null);
    setScreenshotPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    toast.success("Thank you for your feedback", "We'll review it shortly.");
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setScreenshot(null);
    setScreenshotPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const [isCapturing, setIsCapturing] = useState(false);
  const [showCaptureOverlay, setShowCaptureOverlay] = useState(false);
  const [capturedImageDataUrl, setCapturedImageDataUrl] = useState<string | null>(null);
  const [hideForCapture, setHideForCapture] = useState(false);

  const handleTakeScreenshot = useCallback(async () => {
    setIsCapturing(true);
    setOpen(false);
    setHideForCapture(true);
    await new Promise((r) => setTimeout(r, 450));
    try {
      const canvas = await html2canvas(document.body);
      setCapturedImageDataUrl(canvas.toDataURL("image/png"));
      setShowCaptureOverlay(true);
    } catch (err) {
      toast.error("Capture failed", err instanceof Error ? err.message : "Please try again.");
      setOpen(true);
    } finally {
      setIsCapturing(false);
      setHideForCapture(false);
    }
  }, []);

  const handleCaptureComplete = useCallback(
    (blob: Blob) => {
      setScreenshot(blob);
      setScreenshotPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
      setOpen(true);
      setShowCaptureOverlay(false);
      setCapturedImageDataUrl(null);
      toast.success("Screenshot captured", "You can crop or submit.");
    },
    [],
  );

  const handleCaptureCancel = useCallback(() => {
    setShowCaptureOverlay(false);
    setCapturedImageDataUrl(null);
    setOpen(true);
  }, []);

  const showFeedbackButton = !showCaptureOverlay && !hideForCapture;

  return (
    <>
      {showFeedbackButton && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed right-0 top-1/2 z-[1050] -translate-y-1/2 flex flex-col items-center justify-center gap-2 py-4 pl-2 pr-1 rounded-l-lg shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
          aria-label="Feedback"
          title="Feedback"
        >
        <span
          className="text-xs font-medium whitespace-nowrap"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)" }}
        >
          Feedback
        </span>
        <LuMessageCircleQuestion className="size-5 shrink-0" />
        </button>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          {selectedCategory ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {MENU_OPTIONS.find((o) => o.value === selectedCategory)?.label ?? "Feedback"}
                </DialogTitle>
              </DialogHeader>
              <FeedbackForm
                category={selectedCategory}
                userEmail={user?.email}
                screenshot={screenshot}
                screenshotPreview={screenshotPreview}
                onRemoveScreenshot={() => {
                  setScreenshot(null);
                  setScreenshotPreview((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return null;
                  });
                }}
                onScreenshotChange={handleScreenshotChange}
                onSuccess={handleSuccess}
                onCancel={handleBack}
                onTakeScreenshot={handleTakeScreenshot}
                isCapturing={isCapturing}
              />
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">How can we help you?</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-1 py-2">
                {MENU_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectOption(opt.value)}
                    className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-muted/50"
                  >
                    {opt.icon}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{opt.label}</p>
                      <p className="text-sm text-muted-foreground">{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {showCaptureOverlay && capturedImageDataUrl && (
        <ScreenCaptureOverlay
          imageDataUrl={capturedImageDataUrl}
          onCapture={handleCaptureComplete}
          onCancel={handleCaptureCancel}
        />
      )}
    </>
  );
}
