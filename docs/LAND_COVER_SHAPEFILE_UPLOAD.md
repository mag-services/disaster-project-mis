# Land Cover Shapefile Upload Guide

This guide explains how to convert your province-level land cover Shapefiles into raster tiles for the Climate land cover layer.

## Overview

The Climate land cover system expects **precomputed PNG tiles** at:

```
media/tiles/landcover/{year}/{z}/{x}/{y}.png
```

Your Shapefiles (Malampa_2020, Penama_2020, etc.) must be:

1. **Merged** per year (all provinces → one layer per 2020 and 2023)
2. **Rasterized** with pixel values 1–9 (one per land cover class)
3. **Tiled** into XYZ tiles

## Land Cover Classes (Pixel Values 1–9)

The frontend expects these classes in this order:

| Code | Class Name              | Color (hex) |
|------|-------------------------|-------------|
| 1    | Water bodies            | #42A5F5     |
| 2    | Coconut plantations     | #FFB300     |
| 3    | Grassland               | #CDDC39     |
| 4    | Mangrove                | #388E3C     |
| 5    | Agriculture             | #FBC02D     |
| 6    | Barelands               | #A1887F     |
| 7    | Builtup Infrastructure  | #757575     |
| 8    | Dense Forest            | #2E7D32     |
| 9    | Open Forest             | #66BB6A     |

Your Shapefiles use a `Class` attribute. Map your values to these codes. Example mapping for common names:

| Your Class Name | → Code |
|-----------------|--------|
| Water Bodies    | 1      |
| Coconut, Coconut plantations | 2 |
| Grassland       | 3      |
| Mangrove        | 4      |
| Agriculture     | 5      |
| Bareland, Barelands | 6  |
| Built Up, Builtup Infrastructure | 7 |
| Forest, Dense Forest | 8   |
| Open Forest     | 9      |

If your data uses different names, edit the mapping in the conversion script.

---

## Step 1: Convert Shapefiles to GeoTIFF

Use the provided Python script to merge and rasterize:

```bash
cd /home/htevilili/Documents/Work/Disaster\ Project/disaster-project-mis/vbos-backend
python3 scripts/shapefile_to_landcover_raster.py \
  --input-dir "/home/htevilili/Documents/Work/Disaster Project/Land Cover/Land_Cover_2020_2023" \
  --output-dir raster_data \
  --fast
```

Use `--fast` to merge with ogr2ogr (recommended for large datasets; much faster).

This produces:

- `raster_data/landcover_2020.tif`
- `raster_data/landcover_2023.tif`

### Requirements

- Python 3.8+
- GDAL: `sudo apt install gdal-bin python3-gdal` (or `pip install gdal`)

---

## Step 2: Generate XYZ Tiles

Run the existing tile generation script:

```bash
cd vbos-backend
chmod +x scripts/generate_raster_tiles.sh
./scripts/generate_raster_tiles.sh
```

Output: `media/tiles/landcover/2020/` and `media/tiles/landcover/2023/` (zoom 0–12).

---

## Step 3: Configure in Admin

1. Go to **Admin → Climate → Raster datasets**
2. Create or edit the **Land cover** dataset
3. Set **Precomputed tile url** to:
   ```
   /media/tiles/landcover/{year}/{z}/{x}/{y}.png
   ```
   For production, use the full URL (e.g. `https://your-domain.com/media/tiles/landcover/{year}/{z}/{x}/{y}.png`)
4. Check **Is land cover**
5. Save

---

## Troubleshooting

### Class mapping mismatch

If some polygons appear as wrong colors or transparent, your `Class` values may not match the script’s mapping. Run:

```bash
ogrinfo -al -q "path/to/Province_2020.shp" | grep "Class (String)"
```

Then update the `CLASS_TO_CODE` dict in `scripts/shapefile_to_landcover_raster.py`.

### CRS / extent issues

The script reprojects to EPSG:4326 (WGS84) and uses a common extent for all provinces. If tiles look wrong, check that all Shapefiles share the same CRS (e.g. EPSG:32759 for Vanuatu UTM 59S).

### Missing GDAL

```bash
sudo apt install gdal-bin python3-gdal
```

### Land cover not showing on map

1. **Verify tiles exist** – Backend returns transparent PNG when tiles are missing:
   ```bash
   ls vbos-backend/media/tiles/landcover/2020/
   # Should show zoom dirs: 0, 1, 2, ... 12
   curl -o /tmp/tile.png "http://localhost:8000/media/tiles/landcover/2020/5/10/12.png"
   file /tmp/tile.png  # Should be "PNG image data" (not 1x1 transparent)
   ```

2. **Admin config** – Climate → Raster datasets → Land cover: check **Is land cover**. For precomputed tiles, set **Precomputed tile url** to `/media/tiles/landcover/{year}/{z}/{x}/{y}.png`. For TiTiler, leave it empty and set **Filename id** to `landcover` (see [TITILER_SETUP.md](TITILER_SETUP.md)).

3. **Compare years off** – Turn off "Compare years" in the right sidebar to see single-year raster first.

4. **Backend running** – Ensure Django is on port 8000; Vite proxies `/media` to it.

5. **TMS vs XYZ** – `gdal2tiles` outputs TMS (y from bottom). The frontend uses `tms: true` so Leaflet requests the correct y coordinates. If you regenerate tiles with `gdal2tiles.py --xyz`, remove `tms: true` from the tile layer options.

6. **Land cover stats (chart)** – After generating tiles, run `python manage.py generate_landcover_stats` to create `media/landcover_stats.json`. The right-sidebar chart and legend use this raster-derived data.
