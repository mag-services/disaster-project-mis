"""
Land cover stats from uploaded raster. Pixel values 0-5 match generate_raster_tiles.sh (6-class QGIS).
Run: python manage.py generate_landcover_stats
"""
from pathlib import Path

# Pixel value -> class name (matches LAND_COVER_COLORMAP and generate_raster_tiles.sh)
# QGIS: 0=Water Bodies, 1=Grassland, 2=Mangrove, 3=Bareland, 4=Built Up, 5=Forest
PIXEL_TO_CLASS = {
    0: "Water Bodies",
    1: "Grassland",
    2: "Mangrove",
    3: "Bareland",
    4: "Built Up",
    5: "Forest",
}

# Pixel size in degrees (~30m at equator) - from shapefile_to_landcover_raster
PIXEL_SIZE = 0.00027
# Approx km² per pixel at Vanuatu latitude (~-17°)
KM2_PER_PIXEL = PIXEL_SIZE * PIXEL_SIZE * 111 * 111 * 0.85  # ~0.0007 km²


def _to_shapely(geom) -> "object | None":
    """Convert Django GEOSGeometry to Shapely for rasterio. Avoids GEOS BBOX parse errors."""
    try:
        from shapely.geometry import shape
        # Use GeoJSON dict (OGC standard) to avoid PostGIS-specific types like BBOX
        return shape(geom.__geo_interface__)
    except Exception:
        return None


def compute_landcover_stats(raster_path: Path, province_geoms: dict[str, object]) -> dict:
    """
    Compute area (km²) per pixel value per province.
    Returns: { "province": { "1": area, "2": area, ... }, "National": { ... } }
    """
    try:
        import rasterio
        from rasterio.mask import mask
        import numpy as np
    except ImportError:
        return {}

    if not raster_path.exists():
        return {}

    result = {}
    national = {str(i): 0.0 for i in range(6)}

    with rasterio.open(raster_path) as src:
        for province_name, geom in province_geoms.items():
            try:
                shapely_geom = _to_shapely(geom)
                if shapely_geom is None or shapely_geom.is_empty:
                    result[province_name] = {str(i): 0.0 for i in range(6)}
                    continue
                out_image, out_transform = mask(src, [shapely_geom], crop=True, nodata=-9999)
                data = out_image[0]
                counts = {}
                for v in range(6):
                    count = int(np.sum(data == v))
                    area_km2 = count * KM2_PER_PIXEL
                    counts[str(v)] = round(area_km2, 2)
                    national[str(v)] = national.get(str(v), 0) + area_km2
                result[province_name] = counts
            except Exception:
                result[province_name] = {str(i): 0.0 for i in range(6)}

        result["National"] = {k: round(v, 2) for k, v in national.items()}

    return result
