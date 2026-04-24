# Coastal Shorelines PMTiles Setup

## Issue: Layer Not Showing on Map

If "Coastal Shorelines (Annual)" is enabled but nothing appears on the map, check the following.

### 1. Source Layer (Most Common Fix)

The **Source layer** in the PMTiles admin must match the actual layer name inside the PMTiles file.

**For this file:** `Coastal Shorelines (Annual)` (from `vector_layers[0].id`)

**Wrong:** `pmtiles show coastal_shorelines.pmtiles` (this is the CLI command, not a layer name)

**Wrong:** `default` (this file uses a named layer)

To find the layer name for other PMTiles:

```bash
# Install pmtiles CLI: npm install -g pmtiles
pmtiles show --metadata vbos-backend/media/coastal_shorelines.pmtiles
```
In the JSON output, look at `vector_layers[0].id` — use that exact name in the admin **Source layer** field.

### 2. Admin Configuration

1. Go to **Admin** → **Climate › Coastal Changes** → **Coastal Changes PMTiles**
2. Add or edit "Coastal Shorelines (Annual)"
3. **URL:** `coastal_shorelines.pmtiles` or `/media/coastal_shorelines.pmtiles` (both work)
4. **Source layer:** `Coastal Shorelines (Annual)` (from metadata)
5. **Cluster:** Coastal Changes (or Baseline)
6. **Cyclone name:** Leave blank (coastal data, not cyclone)

### 3. File Location

The file must be in `vbos-backend/media/coastal_shorelines.pmtiles` (or your `MEDIA_ROOT`).

### 4. Year Property (for coloring)

This file has a `year` property (1999–2023). The frontend uses it for year-based coloring and labels. If `year` is missing, all lines use the first color and no labels appear.
