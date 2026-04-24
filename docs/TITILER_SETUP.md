# TiTiler Setup for Land Cover

Use TiTiler to serve land cover GeoTIFFs dynamically (no precomputed tiles needed).

## 1. Prepare raster files

Place your GeoTIFFs in `vbos-backend/raster_data/` with this naming:

| File | Description |
|------|-------------|
| `landcover_2020.tif` or `landcover_2020.vrt` | 2020 land cover |
| `landcover_2023.tif` or `landcover_2023.vrt` | 2023 land cover |

TiTiler tries `.vrt` first, then `.tif`. If you have `geotiff2023.0.tif`, rename it to `landcover_2023.tif`.

```bash
cd vbos-backend
mkdir -p raster_data
# Copy or symlink your files, e.g.:
cp "/path/to/Land Cover/geotiff/landcover_2020.tif" raster_data/
cp "/path/to/Land Cover/geotiff/geotiff2023.0.tif" raster_data/landcover_2023.tif
# VRTs optional (VRT can reference the TIF)
```

## 2. Admin configuration

1. Go to **Admin → Climate → Raster datasets**
2. Create or edit the **Land cover** dataset
3. Set **Filename id** to `landcover` (must match the filename prefix)
4. Leave **Precomputed tile url** empty (so TiTiler is used)
5. Check **Is land cover**
6. Save

## 3. Start the stack

**VM deployment (nginx + TiTiler):**

```bash
cd /path/to/disaster-project-mis
docker compose -f deploy/vm/docker-compose.yml up -d --build
```

**Local dev (vbos-backend compose):**

```bash
cd vbos-backend
docker compose up -d
```

TiTiler reads from `/data` (mounted from `raster_data/`).

## 4. Frontend environment

Set `VITE_TITILER_API` so the map can reach TiTiler:

| Setup | VITE_TITILER_API |
|------|------------------|
| VM with nginx | `http://10.252.0.158/titiler` |
| Local, direct ports | `http://localhost:8002` |

For VM build:

```bash
cd vbos-frontend
echo 'VITE_TITILER_API=http://10.252.0.158/titiler' >> .env.production.local
pnpm build
```

## 5. Verify

- TiTiler health: `curl http://localhost:8002/healthz` (or `http://VM_IP/titiler/healthz`)
- Tile test: `curl -o tile.png "http://localhost:8002/dataset/landcover/years/2020/tiles/WebMercatorQuad/5/10/12.png"`
- Open the app, switch to Climate mode, enable Land cover

## Optional: Precomputed tiles instead

If you prefer static tiles (faster, no TiTiler needed):

1. Run `./scripts/generate_raster_tiles.sh`
2. In Admin → Land cover: set **Precomputed tile url** to `/media/tiles/landcover/{year}/{z}/{x}/{y}.png`
3. Leave **Filename id** as `landcover` (or blank)
