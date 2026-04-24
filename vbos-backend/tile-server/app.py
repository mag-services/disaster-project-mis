"""
Lightweight raster tile server - reads VRT from /data, no TiTiler dependency.
API matches vbos-titiler: /dataset/{dataset_id}/years/{year}/tiles/WebMercatorQuad/{z}/{x}/{y}.png
"""
from pathlib import Path

import numpy as np
import rasterio
from fastapi import FastAPI, Path, Query
from fastapi.responses import Response
from rasterio.warp import transform_bounds
from starlette.middleware.cors import CORSMiddleware

DATA_ROOT = Path("/data")
app = FastAPI(title="VBOS Raster Tiles")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"])


def get_dataset_path(dataset_id: str, year: int) -> Path:
    return DATA_ROOT / f"{dataset_id}_{year}.vrt"


@app.get("/healthz")
def health():
    return {"status": "ok"}


@app.get(
    "/dataset/{dataset_id}/years/{year}/tiles/WebMercatorQuad/{z}/{x}/{y}.png",
    response_class=Response,
)
def get_tile(
    dataset_id: str,
    year: int,
    z: int,
    x: int,
    y: int,
    colormap: str | None = Query(None),
    colormap_type: str | None = Query(None),
):
    """Serve a single tile as PNG. Optional colormap for categorical rasters."""
    path = get_dataset_path(dataset_id, year)
    if not path.exists():
        return Response(status_code=404, content=f"File not found: {path}")

    try:
        with rasterio.open(str(path)) as src:
            # Web Mercator tile bounds
            n = 2**z
            lon_min = x / n * 360 - 180
            lat_max = np.degrees(np.arctan(np.sinh(np.pi * (1 - 2 * y / n))))
            lon_max = (x + 1) / n * 360 - 180
            lat_min = np.degrees(np.arctan(np.sinh(np.pi * (1 - 2 * (y + 1) / n))))

            # Transform to raster CRS
            dst_crs = src.crs
            if dst_crs and dst_crs.to_epsg() != 4326:
                bounds = transform_bounds("EPSG:4326", dst_crs, lon_min, lat_min, lon_max, lat_max)
            else:
                bounds = (lon_min, lat_min, lon_max, lat_max)

            # Read window (boundless=True for tiles near edge)
            window = rasterio.windows.from_bounds(*bounds, src.transform)
            data = src.read(window=window, out_shape=(1, 256, 256), resampling=rasterio.enums.Resampling.nearest, boundless=True, fill_value=0)

        # Normalize to 0-255 for PNG
        arr = data[0]
        if np.ma.is_masked(arr):
            arr = np.ma.filled(arr, 0)
        arr = np.nan_to_num(arr, nan=0)
        if arr.max() > arr.min():
            arr = ((arr - arr.min()) / (arr.max() - arr.min()) * 255).astype(np.uint8)
        else:
            arr = np.zeros_like(arr, dtype=np.uint8)

        # Apply colormap if provided (for land cover)
        if colormap and colormap_type == "explicit":
            import json
            import urllib.parse
            cmap = json.loads(urllib.parse.unquote(colormap))
            out = np.zeros((*arr.shape, 4), dtype=np.uint8)
            for val_str, color in cmap.items():
                try:
                    v = int(float(val_str))
                    mask = arr == v
                    if isinstance(color, str) and color.startswith("#"):
                        r, g, b = int(color[1:3], 16), int(color[3:5], 16), int(color[5:7], 16)
                    else:
                        r, g, b = 128, 128, 128
                    out[mask, 0] = r
                    out[mask, 1] = g
                    out[mask, 2] = b
                    out[mask, 3] = 255
            from PIL import Image
            img = Image.fromarray(out, "RGBA")
        else:
            from PIL import Image
            img = Image.fromarray(arr, "L").convert("RGBA")

        buf = __import__("io").BytesIO()
        img.save(buf, format="PNG")
        return Response(content=buf.getvalue(), media_type="image/png")

    except Exception as e:
        return Response(status_code=500, content=str(e))


@app.get("/dataset/{dataset_id}/years/{year}/tiles")
def tiles_metadata(dataset_id: str, year: int):
    """Return tile availability (for useCheckRasterLayer)."""
    path = get_dataset_path(dataset_id, year)
    if path.exists():
        return {"available": True}
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=404, content={"detail": "Not found"})
