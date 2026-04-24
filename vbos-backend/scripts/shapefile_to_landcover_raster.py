#!/usr/bin/env python3
"""
Convert province-level land cover Shapefiles to GeoTIFF rasters for Climate land cover.

Merges all Province_YYYY.shp files per year, maps Class attribute to codes 1-9,
rasterizes to GeoTIFF. Output can be fed to generate_raster_tiles.sh.

Usage:
  python scripts/shapefile_to_landcover_raster.py \\
    --input-dir "/path/to/Land_Cover_2020_2023" \\
    --output-dir raster_data

Requires: GDAL (sudo apt install gdal-bin python3-gdal)
"""

from __future__ import annotations

import argparse
import glob
import os
import re
import subprocess
import sys
import tempfile

try:
    from osgeo import gdal, ogr, osr

    gdal.UseExceptions()
except ImportError:
    print("Error: GDAL not found. Install with: sudo apt install gdal-bin python3-gdal")
    sys.exit(1)

# Map Shapefile Class values to pixel codes 1-9 (matches LAND_COVER_COLORMAP)
# Edit this if your Class names differ
CLASS_TO_CODE = {
    "Water Bodies": 1,
    "Water bodies": 1,
    "Coconut": 2,
    "Coconut plantations": 2,
    "Grassland": 3,
    "Mangrove": 4,
    "Agriculture": 5,
    "Bareland": 6,
    "Barelands": 6,
    "Built Up": 7,
    "Builtup Infrastructure": 7,
    "Builtup": 7,
    "Forest": 8,
    "Dense Forest": 8,
    "Open Forest": 9,
}

# Default code for unmapped classes (0 = nodata/transparent)
DEFAULT_CODE = 0

# Target CRS for web tiles (WGS84)
TARGET_EPSG = 4326

# Pixel size in degrees (adjust for resolution; ~30m at equator for 0.00027)
PIXEL_SIZE = 0.00027


def get_class_code(class_val: str) -> int:
    """Map Class string to code 1-9, or 0 if unmapped."""
    if not class_val:
        return DEFAULT_CODE
    val = str(class_val).strip()
    return CLASS_TO_CODE.get(val, CLASS_TO_CODE.get(val.title(), DEFAULT_CODE))


def merge_with_ogr2ogr(
    shapefile_paths: list[str], output_path: str, target_epsg: int = TARGET_EPSG
) -> bool:
    """Use ogr2ogr to merge and reproject. Returns True if successful."""
    if not shapefile_paths:
        return False
    try:
        # Use GPKG (GeoPackage) - GeoJSON does not reliably support -append
        first = shapefile_paths[0]
        layer_name = "merged"
        cmd = [
            "ogr2ogr",
            "-f", "GPKG",
            "-t_srs", f"EPSG:{target_epsg}",
            "-nln", layer_name,
            output_path,
            first,
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        for path in shapefile_paths[1:]:
            cmd = [
                "ogr2ogr",
                "-update", "-append",
                "-nln", layer_name,
                output_path,
                path,
            ]
            subprocess.run(cmd, check=True, capture_output=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def find_shapefiles_by_year(input_dir: str) -> dict[int, list[str]]:
    """Find Province_YYYY.shp files and group by year."""
    pattern = os.path.join(input_dir, "*_*.shp")
    files = glob.glob(pattern)
    by_year: dict[int, list[str]] = {}
    for path in files:
        base = os.path.basename(path)
        m = re.match(r"[A-Za-z]+_(\d{4})\.shp$", base)
        if m:
            year = int(m.group(1))
            by_year.setdefault(year, []).append(path)
    for year in by_year:
        by_year[year].sort()
    return by_year


def add_code_and_rasterize(
    merged_path: str,
    output_tif: str,
    class_field: str = "Class",
    pixel_size: float = PIXEL_SIZE,
) -> None:
    """Add code field to merged GeoJSON and rasterize to GeoTIFF."""
    ds = ogr.Open(merged_path)
    if not ds:
        raise RuntimeError(f"Cannot open merged file: {merged_path}")
    layer = ds.GetLayer(0)
    layer_defn = layer.GetLayerDefn()
    class_idx = layer_defn.GetFieldIndex(class_field)
    if class_idx < 0:
        raise RuntimeError(
            f"Field '{class_field}' not found. "
            f"Available: {[layer_defn.GetFieldDefn(i).GetName() for i in range(layer_defn.GetFieldCount())]}"
        )

    # Create in-memory layer with code field
    mem_driver = ogr.GetDriverByName("Memory")
    mem_ds = mem_driver.CreateDataSource("mem")
    out_srs = layer.GetSpatialRef() or osr.SpatialReference()
    if not out_srs:
        out_srs = osr.SpatialReference()
        out_srs.ImportFromEPSG(TARGET_EPSG)
    out_layer = mem_ds.CreateLayer("with_code", out_srs, ogr.wkbPolygon)
    fd_code = ogr.FieldDefn("code", ogr.OFTInteger)
    out_layer.CreateField(fd_code)

    x_min = y_min = x_max = y_max = None
    for feat in layer:
        geom = feat.GetGeometryRef()
        if not geom:
            continue
        ext = geom.GetEnvelope()
        if x_min is None:
            x_min, x_max = ext[0], ext[1]
            y_min, y_max = ext[2], ext[3]
        else:
            x_min = min(x_min, ext[0])
            x_max = max(x_max, ext[1])
            y_min = min(y_min, ext[2])
            y_max = max(y_max, ext[3])
        code = get_class_code(feat.GetFieldAsString(class_idx))
        new_feat = ogr.Feature(out_layer.GetLayerDefn())
        new_feat.SetGeometry(geom.Clone())
        new_feat.SetField("code", code)
        out_layer.CreateFeature(new_feat)
        new_feat = None
    ds = None

    # Fix axis order: EPSG:4326 may use (lat,lon); GeoTIFF needs (lon,lat) for web
    if -90 <= x_min <= 90 and -90 <= x_max <= 90 and -180 <= y_min <= 180 and -180 <= y_max <= 180:
        x_min, x_max, y_min, y_max = y_min, y_max, x_min, x_max

    pad = pixel_size * 2
    x_min -= pad
    y_min -= pad
    x_max += pad
    y_max += pad
    cols = int((x_max - x_min) / pixel_size)
    rows = int((y_max - y_min) / pixel_size)
    if cols < 1 or rows < 1:
        raise RuntimeError("Extent too small")

    gt = (x_min, pixel_size, 0, y_max, 0, -pixel_size)
    out_driver = gdal.GetDriverByName("GTiff")
    out_ds = out_driver.Create(
        output_tif, cols, rows, 1, gdal.GDT_Byte,
        options=["COMPRESS=LZW", "TILED=YES"]
    )
    out_ds.SetGeoTransform(gt)
    out_ds.SetProjection(out_srs.ExportToWkt())
    band = out_ds.GetRasterBand(1)
    band.SetNoDataValue(DEFAULT_CODE)
    band.FlushCache()

    result = gdal.RasterizeLayer(
        out_ds, [1], out_layer,
        options=["ATTRIBUTE=code", "ALL_TOUCHED=TRUE"]
    )
    if result != 0:
        raise RuntimeError(f"RasterizeLayer failed: {result}")
    out_ds.FlushCache()
    out_ds = None
    mem_ds = None


def merge_and_rasterize(
    shapefile_paths: list[str],
    output_tif: str,
    class_field: str = "Class",
    pixel_size: float = PIXEL_SIZE,
    use_ogr2ogr: bool = False,
) -> None:
    """Merge Shapefiles, add code field, reproject to WGS84, rasterize to GeoTIFF."""
    if use_ogr2ogr:
        with tempfile.NamedTemporaryFile(suffix=".gpkg", delete=False) as f:
            merged_path = f.name
        try:
            if merge_with_ogr2ogr(shapefile_paths, merged_path):
                add_code_and_rasterize(
                    merged_path, output_tif,
                    class_field=class_field, pixel_size=pixel_size
                )
                return
        finally:
            if os.path.exists(merged_path):
                os.unlink(merged_path)
        print("Warning: ogr2ogr merge failed, falling back to Python merge")

    driver = ogr.GetDriverByName("Memory")
    mem_ds = driver.CreateDataSource("mem")
    out_srs = osr.SpatialReference()
    out_srs.ImportFromEPSG(TARGET_EPSG)
    out_srs.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)  # (lon, lat) for envelope

    merged_layer = None
    x_min = y_min = x_max = y_max = None

    for shp_path in shapefile_paths:
        ds = ogr.Open(shp_path)
        if not ds:
            raise RuntimeError(f"Cannot open: {shp_path}")
        layer = ds.GetLayer(0)
        src_srs = layer.GetSpatialRef()
        if not src_srs:
            src_srs = osr.SpatialReference()
            src_srs.ImportFromEPSG(4326)

        transform = None
        if not src_srs.IsSame(out_srs):
            transform = osr.CoordinateTransformation(src_srs, out_srs)

        if merged_layer is None:
            merged_layer = mem_ds.CreateLayer(
                "merged", out_srs, ogr.wkbPolygon
            )
            fd_code = ogr.FieldDefn("code", ogr.OFTInteger)
            merged_layer.CreateField(fd_code)

        layer_defn = layer.GetLayerDefn()
        class_idx = layer_defn.GetFieldIndex(class_field)
        if class_idx < 0:
            raise RuntimeError(
                f"Field '{class_field}' not found in {shp_path}. "
                f"Available: {[layer_defn.GetFieldDefn(i).GetName() for i in range(layer_defn.GetFieldCount())]}"
            )

        for feat in layer:
            geom = feat.GetGeometryRef()
            if not geom:
                continue
            if transform:
                geom.Transform(transform)
            ext = geom.GetEnvelope()
            if x_min is None:
                x_min, x_max = ext[0], ext[1]
                y_min, y_max = ext[2], ext[3]
            else:
                x_min = min(x_min, ext[0])
                x_max = max(x_max, ext[1])
                y_min = min(y_min, ext[2])
                y_max = max(y_max, ext[3])

            code = get_class_code(feat.GetFieldAsString(class_idx))
            new_feat = ogr.Feature(merged_layer.GetLayerDefn())
            new_feat.SetGeometry(geom.Clone())
            new_feat.SetField("code", code)
            merged_layer.CreateFeature(new_feat)
            new_feat = None

        ds = None

    if merged_layer is None or x_min is None:
        raise RuntimeError("No features found in any Shapefile")

    # Fix axis order: EPSG:4326 may use (lat,lon); GeoTIFF needs (lon,lat) for web
    if -90 <= x_min <= 90 and -90 <= x_max <= 90 and -180 <= y_min <= 180 and -180 <= y_max <= 180:
        x_min, x_max, y_min, y_max = y_min, y_max, x_min, x_max

    # Expand extent slightly and align to pixel grid
    pad = pixel_size * 2
    x_min -= pad
    y_min -= pad
    x_max += pad
    y_max += pad
    cols = int((x_max - x_min) / pixel_size)
    rows = int((y_max - y_min) / pixel_size)
    if cols < 1 or rows < 1:
        raise RuntimeError("Extent too small")

    gt = (x_min, pixel_size, 0, y_max, 0, -pixel_size)

    out_driver = gdal.GetDriverByName("GTiff")
    out_ds = out_driver.Create(
        output_tif, cols, rows, 1, gdal.GDT_Byte,
        options=["COMPRESS=LZW", "TILED=YES"]
    )
    out_ds.SetGeoTransform(gt)
    out_ds.SetProjection(out_srs.ExportToWkt())
    band = out_ds.GetRasterBand(1)
    band.SetNoDataValue(DEFAULT_CODE)
    band.FlushCache()

    result = gdal.RasterizeLayer(
        out_ds, [1], merged_layer,
        options=["ATTRIBUTE=code", "ALL_TOUCHED=TRUE"]
    )
    if result != 0:
        raise RuntimeError(f"RasterizeLayer failed: {result}")

    out_ds.FlushCache()
    out_ds = None
    mem_ds = None


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert land cover Shapefiles to GeoTIFF for Climate tiles"
    )
    parser.add_argument(
        "--input-dir",
        required=True,
        help="Directory containing Province_YYYY.shp files",
    )
    parser.add_argument(
        "--output-dir",
        default="raster_data",
        help="Output directory for landcover_YYYY.tif (default: raster_data)",
    )
    parser.add_argument(
        "--class-field",
        default="Class",
        help="Attribute field name for land cover class (default: Class)",
    )
    parser.add_argument(
        "--pixel-size",
        type=float,
        default=PIXEL_SIZE,
        help=f"Pixel size in degrees (default: {PIXEL_SIZE})",
    )
    parser.add_argument(
        "--fast",
        action="store_true",
        help="Use ogr2ogr for merge (faster for large datasets)",
    )
    args = parser.parse_args()

    input_dir = os.path.abspath(args.input_dir)
    output_dir = os.path.abspath(args.output_dir)
    if not os.path.isdir(input_dir):
        print(f"Error: Input directory not found: {input_dir}")
        sys.exit(1)
    os.makedirs(output_dir, exist_ok=True)

    by_year = find_shapefiles_by_year(input_dir)
    if not by_year:
        print(f"Error: No *_YYYY.shp files found in {input_dir}")
        sys.exit(1)

    for year, paths in sorted(by_year.items()):
        out_tif = os.path.join(output_dir, f"landcover_{year}.tif")
        print(f"Processing {year}: {len(paths)} files -> {out_tif}")
        merge_and_rasterize(
            paths,
            out_tif,
            class_field=args.class_field,
            pixel_size=args.pixel_size,
            use_ogr2ogr=args.fast,
        )
        print(f"  Created {out_tif}")

    print("\nDone. Next: ./scripts/generate_raster_tiles.sh")


if __name__ == "__main__":
    main()
