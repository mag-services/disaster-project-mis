/**
 * Capture a screenshot of the user's screen/window/tab using getDisplayMedia.
 * User selects what to share (screen, window, or tab), then we capture a single frame.
 */
export async function captureScreen(): Promise<Blob> {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false,
  });

  try {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play();

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2d context not available");
    ctx.drawImage(video, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Failed to create blob"))),
        "image/png",
        0.95,
      );
    });

    return blob;
  } finally {
    stream.getTracks().forEach((t) => t.stop());
  }
}

export function isScreenCaptureSupported(): boolean {
  return !!(
    typeof navigator !== "undefined" &&
    navigator.mediaDevices?.getDisplayMedia
  );
}
