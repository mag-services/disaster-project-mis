/**
 * Triggers a file download in the browser
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Sanitizes filename by replacing spaces with underscores
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
}

export function getRasterFileUrl(filename_id: string, year: number | string) {
  return `https://syd1.digitaloceanspaces.com/mis-geotiff-storage/production/raster/${filename_id}_${year}.vrt`;
}

/**
 * TiTiler GeoTIFF preview URL for raster export.
 * Uses the dataset/years preview endpoint if available.
 */
export function getRasterGeoTiffUrl(
  filenameId: string,
  year: number | string,
  colormap?: Record<string, string>,
): string {
  const base = `${import.meta.env.VITE_TITILER_API}/dataset/${filenameId}/years/${year}`;
  const params = new URLSearchParams();
  if (colormap && Object.keys(colormap).length > 0) {
    params.set("colormap", JSON.stringify(colormap));
    params.set("colormap_type", "explicit");
  }
  const qs = params.toString();
  return `${base}/preview.tif${qs ? `?${qs}` : ""}`;
}
