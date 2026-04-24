# Upload Cyclone Intensity into MIS

This guide describes how to get cyclone intensity (area councils colored by category) into the MIS.

> **Recommended:** Use **PMTiles** (tile-based, no browser crash) or **tabular choropleth** (lightest). GeoJSON vector import can crash browsers with heavy polygons.

## Option 1: PMTiles (Recommended – No Browser Crash)

PMTiles load only visible tiles, so they avoid the browser crash caused by large GeoJSON.

### Step 1: Export GeoJSON from RAP

```bash
cd /path/to/RAP/vanuatu
Rscript scripts/export_intensity_geojson.R
```

### Step 2: Convert to PMTiles

Requires `tippecanoe` (`brew install tippecanoe` or `apt install tippecanoe`):

```bash
./scripts/export_intensity_pmtiles.sh
```

This creates `output/area_councils_intensity.pmtiles`.

### Step 3: Copy to MIS Media

```bash
cp output/area_councils_intensity.pmtiles /path/to/disaster-project-mis/vbos-backend/media/
```

### Step 4: Create PMTiles Dataset in MIS Admin

1. **Datasets** → **PMTiles datasets** → **Add**
2. **Name:** `Cyclone Intensity`
3. **Cluster:** Disaster
4. **Type:** Estimated Hazard Damage
5. **URL:** `media/area_councils_intensity.pmtiles` (or full URL if hosted elsewhere)
6. **Source layer:** `councils`
7. **Cyclone name:** e.g. `Cyclone Lola` (optional; shown in sidebar and on map when layer is active)
8. **Intensity data:** (optional) JSON array for right-panel display. Export from GeoJSON:
   ```bash
   # From area_councils_intensity.geojson, extract properties:
   jq '[.features[].properties]' output/area_councils_intensity.geojson
   ```
   Paste the result. Enables "This area is facing Category 4 wind cyclones" and the full table in the right panel when province/area council is selected.
9. Save

### Step 5: View on Map

Enable the Cyclone Intensity layer in Disaster mode. Polygons are colored by `intensity_color` (Cat 2–5).

---

## Option 2: GeoJSON Vector Import

## Prerequisites

1. **RAP report** has been run and produced `output/area_councils_intensity.geojson`
2. **MIS** is running with Admin access

## Step 1: Export GeoJSON from RAP

From the RAP vanuatu project:

```bash
cd /path/to/RAP/vanuatu
Rscript scripts/export_intensity_geojson.R
```

The export simplifies geometries (`st_simplify`, tolerance 0.01°) to reduce vertex count. This creates:
- `output/area_councils_intensity.geojson` – polygons with `acname`, `Province`, `Intensity`, `intensity_color`
- `output/area_councils_intensity.shp` – same data as Shapefile

## Step 2: Create Vector Dataset in MIS Admin

1. Log in to MIS Admin (e.g. `http://localhost:8000/admin/` or your VM URL)
2. Go to **Datasets** → **Vector datasets**
3. Click **Add Vector dataset**
4. Fill in:
   - **Name:** `Cyclone Intensity`
   - **Cluster:** Disaster (or your hazard cluster)
   - **Type:** Estimated Hazard Damage
   - **Description:** (optional) Area councils colored by cyclone intensity (Cat 2–5)
5. Save

## Step 3: Import GeoJSON

1. Go to **Datasets** → **Vector items**
2. Click **Import File** (top right)
3. Select the **Cyclone Intensity** dataset from the dropdown
4. Choose `area_councils_intensity.geojson`
5. Click **Import**

The importer matches:
- `acname` → Area Council (by name)
- `Province` → Province (by name)

Features with matching council names will be linked to AreaCouncil and Province. Remaining properties (`Intensity`, `intensity_color`) are stored in metadata and shown on the map.

## Step 4: View on Map

1. In the MIS frontend, select **Disaster** mode
2. Choose the **Disaster** (or hazard) cluster in the left sidebar
3. Enable **Cyclone Intensity** in the map layers

Polygons will be colored by intensity:
- **Grey** (#cccccc) – No intensity (0)
- **Amber** (#fbbf24) – Cat 2
- **Orange** (#f97316) – Cat 3
- **Red** (#dc2626) – Cat 4
- **Dark red** (#7f1d1d) – Cat 5

## Council Name Matching

If some councils do not appear or are not linked:

- RAP GeoJSON uses `acname` from `2016_phc_vut_acid_4326.geojson`
- MIS uses `AreaCouncil` names from its own geometry
- Mismatches (e.g. "Tanvasoko" vs "Tanavuso") may need a mapping in the RAP export or MIS lookup

## If the Layer Still Crashes the Browser

1. **Simplify existing data** (if already imported):
   ```bash
   python manage.py simplify_vector_polygons
   # Or for a specific dataset:
   python manage.py simplify_vector_polygons --dataset 123
   ```

2. **Or delete and re-import** – new imports auto-simplify polygons with >500 vertices.

3. **Use the tabular choropleth instead** (recommended for heavy layers).

---

## Option 3: Tabular Choropleth – Lightest

For a choropleth on MIS admin boundaries (no polygon upload, no browser crash):

1. Use `Rscript scripts/export_hazard_for_mis.R` to create `Ex_hazard_areas_MIS_import.csv`
2. Create a **Tabular dataset** "Cyclone Intensity" (Cluster: Disaster, Type: Estimated Hazard Damage)
3. Import the CSV via **Tabular items** → Import

The choropleth will color MIS area councils by intensity from the tabular data. This uses the MIS’s existing admin boundaries and is much lighter than loading 66 detailed polygons.
