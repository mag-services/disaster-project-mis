# Lightweight Tile Server

Alternative to TiTiler for local development. Reads VRT files from `/data` (raster_data mount).

**API:** Matches vbos-titiler endpoints so the frontend works unchanged.

## To use pre-loaded vbos-titiler instead

If you have `vbos-titiler.tar` and prefer no build:

```bash
docker load -i vbos-titiler.tar
```

Then in `docker-compose.yml`, replace the titiler service `build:` block with:

```yaml
titiler:
  image: ghcr.io/developmentseed/vbos-titiler:main
  # remove: build: context: ./tile-server ...
```

**Note:** vbos-titiler fetches from DigitalOcean Spaces, not local files. Your land cover VRTs must be uploaded to `mis-geotiff-storage/production/raster/` for it to work.
