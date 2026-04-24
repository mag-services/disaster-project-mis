# Precomputed Tiles Setup (No TiTiler)

Use static tiles instead of TiTiler. Generate once, serve from Django.

## 1. Generate tiles

```bash
cd vbos-backend
chmod +x scripts/generate_raster_tiles.sh
./scripts/generate_raster_tiles.sh
```

Requires GDAL: `sudo apt install gdal-bin`

Output: `media/tiles/landcover/2020/` and `media/tiles/2023/` (zoom levels 0–12).

## 2. Configure in Admin

1. Go to **Admin → Climate → Raster datasets → Land cover** (or create it).
2. Set **Precomputed tile url** to (relative URL works with Vite proxy in dev):
   ```
   /media/tiles/landcover/{year}/{z}/{x}/{y}.png
   ```
   For production, use full URL (e.g. `https://api.example.com/media/tiles/landcover/{year}/{z}/{x}/{y}.png`).
3. Leave **Filename id** as `landcover` (or blank if you only use precomputed).
4. Check **Is land cover**.
5. Save.

## 3. Run without TiTiler

TiTiler has been removed from docker-compose. Start the stack:

```bash
docker-compose up -d
```

The backend serves tiles from `media/tiles/` at `/media/tiles/...`.
