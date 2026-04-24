import { useState, useRef, useEffect } from "react";
import { LuArrowLeft, LuCrop, LuMonitor, LuUpload, LuX } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { submitFeedback, type FeedbackCategory } from "@/api/feedback";
import { toast } from "@/utils/toast";
import { ImageCropModal } from "./ImageCropModal";

type FeedbackFormProps = {
  category: FeedbackCategory;
  userEmail?: string;
  screenshot: Blob | null;
  screenshotPreview: string | null;
  onRemoveScreenshot: () => void;
  onScreenshotChange: (blob: Blob) => void;
  onSuccess: () => void;
  onCancel: () => void;
  /** When provided, Take screenshot will close the dialog first, capture, then reopen. Avoids capturing the feedback UI. */
  onTakeScreenshot?: () => Promise<void>;
  isCapturing?: boolean;
};

export function FeedbackForm({
  category,
  userEmail,
  screenshot,
  screenshotPreview,
  onRemoveScreenshot,
  onScreenshotChange,
  onSuccess,
  onCancel,
  onTakeScreenshot,
  isCapturing = false,
}: FeedbackFormProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!screenshotPreview) setCropModalOpen(false);
  }, [screenshotPreview]);

  const handleTakeScreenshot = async () => {
    if (onTakeScreenshot) {
      await onTakeScreenshot();
      // Form may unmount when dialog closes; parent handles reopen + toast
    }
  };

  const handleUploadImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onScreenshotChange(file);
    }
    e.target.value = "";
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          onScreenshotChange(file);
          toast.success("Image pasted", "You can remove it with the × button.");
        }
        return;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("message", message.trim());
      formData.append("page_url", window.location.href);
      formData.append("user_agent", navigator.userAgent);
      if (userEmail) formData.append("user_email", userEmail);
      if (screenshot) {
        formData.append("screenshot", screenshot, "screenshot.png");
      }

      await submitFeedback(formData);
      onSuccess();
    } catch (err) {
      toast.error("Failed to submit", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} onPaste={handlePaste} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="message">Description</Label>
        <textarea
          id="message"
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={
            category === "bug"
              ? "Tell us more about the issue, please."
              : category === "feature"
                ? "Describe the feature you'd like to see."
                : "Share your thoughts or suggestions."
          }
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label>Image (optional)</Label>
        <p className="text-xs text-muted-foreground">
          Select area to screenshot, upload, or paste with Ctrl+V / ⌘V
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTakeScreenshot}
              disabled={isSubmitting || isCapturing}
            >
              <LuMonitor className="size-4 mr-1.5" />
              {isCapturing ? "Capturing…" : "Select area to screenshot"}
            </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUploadImage}
            disabled={isSubmitting}
          >
            <LuUpload className="size-4 mr-1.5" />
            Upload image
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        {screenshotPreview && (
          <div className="relative mt-2 inline-block">
            <img
              src={screenshotPreview}
              alt="Image preview"
              className="max-h-40 rounded border border-border object-contain"
            />
            <div className="absolute top-1 right-1 flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-full bg-background/90 text-foreground hover:bg-muted"
                onClick={() => setCropModalOpen(true)}
                aria-label="Crop image"
                disabled={isSubmitting}
              >
                <LuCrop className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-full bg-destructive/90 text-destructive-foreground hover:bg-destructive"
                onClick={onRemoveScreenshot}
                aria-label="Remove image"
              >
                <LuX className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
        {screenshotPreview && (
          <ImageCropModal
            open={cropModalOpen}
            imageSrc={screenshotPreview}
            onClose={() => setCropModalOpen(false)}
            onCropComplete={(blob) => {
              onScreenshotChange(blob);
              setCropModalOpen(false);
              toast.success("Image cropped", "The cropped image has been applied.");
            }}
          />
        )}
      </div>

      <div className="flex justify-between gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          <LuArrowLeft className="size-4 mr-1" />
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting || !message.trim()}>
          {isSubmitting ? "Sending…" : "Submit"}
        </Button>
      </div>
    </form>
  );
}
