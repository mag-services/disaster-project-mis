# Climate Vector Layer Not Showing (e.g. Rates of Change)

If a vector layer (e.g. "Rates of Change") is enabled in the sidebar but nothing appears on the map, check the following.

## 1. Upload GeoJSON Data (Most Common)

The vector **dataset** (name, icon, color) is separate from the vector **items** (the actual geometries). If you created the dataset but never uploaded GeoJSON, the map will be empty.

**Fix:**
1. Go to **Admin** → **Climate** → **Vector items**
2. Click **Import File**
3. Select the dataset (e.g. "Rates of Change") and upload your GeoJSON file
4. Ensure features have `geometry` and optionally `properties` (province, area_council, name, etc.)

## 2. Verify Dataset Has "Display in" Set

For Coastal changes: **Admin** → **Climate** → **Vector datasets** → edit the dataset → ensure "Display in" includes **Coastal changes**.

## 3. Verify Data Exists

In Django admin: **Admin** → **Climate** → **Vector items** → filter by dataset "Rates of Change". If the list is empty, upload GeoJSON as above.

## 4. Map Extent (Bbox)

Vector data is filtered by the current map view (bounding box). If your data is outside the visible area, zoom out or pan to include it. Vanuatu bounds are roughly 166°E–170°E, 21°S–12°S.

## 5. Geometry Type

The frontend supports Point, LineString, Polygon, and Multi* variants. Ensure your GeoJSON uses valid geometry types.

## 6. Geometry CRS (Coordinate Reference System)

Climate vector data is returned without bbox filtering (to support projected CRS). Geometries are transformed to WGS84 (EPSG:4326) for the map. If data still doesn't show, verify in Admin → Climate → Vector items that the COORDS column shows reasonable values. Coordinates like `-2277382, 2213463` suggest a projected CRS; the backend transforms these to lat/lng for display.

## 7. Verify API Returns Data

**Important:** The URL requires a **numeric** dataset ID (e.g. `5`), not a placeholder. Using `DATASET_ID` or `{id}` literally will return 404.

**Find the dataset ID:**
```bash
# List all vector datasets (each has an "id" field)
curl -H "Authorization: Token YOUR_TOKEN" "http://localhost:8080/api/v1/vector/"
```

Or: **Admin** → **Climate** → **Coastal changes** → **Vector datasets** → click "Rates of Change" → the ID is in the URL (e.g. `/admin/coastal-changes/coastalchangesvectordataset/5/change/` → ID is `5`).

**Test the data endpoint** (replace `5` with your actual dataset ID):
```bash
curl -H "Authorization: Token YOUR_TOKEN" \
  "http://localhost:8080/api/v1/vector/5/data/?page_size=5000"
```

If you get `{"features": [], ...}` or no features, the data may not be linked to the dataset. Check Admin → Climate → Vector items for the Rates of Change dataset.
