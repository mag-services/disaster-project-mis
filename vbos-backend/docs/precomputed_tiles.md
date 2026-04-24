# Precomputed Tiles (Raster + Tabular Joins)

For heavy datasets that combine raster values with tabular statistics (e.g. population-weighted flood risk), the system supports **precomputed tiles** instead of dynamic TiTiler rendering.

## How it works

1. **RasterDataset** has an optional `precomputed_tile_url` field (Admin: Climate → Raster datasets → Precomputed tiles).
2. When set, the frontend uses this URL template instead of TiTiler for tile requests.
3. Placeholders: `{z}`, `{x}`, `{y}` (Leaflet replaces these), and `{year}` (replaced with the current map year).

## URL template format

Example:

```
https://example.com/tiles/flood-risk/{year}/{z}/{x}/{y}.png
```

The frontend requests tiles like:

```
https://example.com/tiles/flood-risk/2025/10/512/384.png
```

## Producing precomputed tiles

Precomputed tiles are generated **outside** the MIS application by an ETL or analysis pipeline. The pipeline should:

1. Join raster data (e.g. hazard raster) with tabular data (e.g. province population).
2. Render the result into Web Mercator (EPSG:3857) tile pyramids.
3. Host the tiles on a web server or CDN (e.g. S3, PMTiles, or a static tile server).

Common approaches:

- **GDAL + raster algebra**: Combine rasters with tabular lookup tables.
- **Python (rasterio, geopandas)**: Zonal statistics per tile, then render to PNG.
- **TiTiler custom endpoint**: Extend TiTiler with a route that performs the join at request time (slower but no precompute).

When `precomputed_tile_url` is set, the frontend skips the usual TiTiler availability check.
