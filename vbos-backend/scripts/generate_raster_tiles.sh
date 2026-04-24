#!/bin/bash
# Generate static tiles from TIFF or VRT files. No TiTiler needed.
# Usage: ./scripts/generate_raster_tiles.sh
# Input:  raster_data/landcover_2020.tif, raster_data/landcover_2023.tif (or .vrt)
# Output: media/tiles/landcover/{year}/{z}/{x}/{y}.png

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
MEDIA_TILES="$BACKEND_DIR/media/tiles/landcover"
COLOR_FILE="$SCRIPT_DIR/landcover_colors.txt"

cd "$BACKEND_DIR"
mkdir -p "$MEDIA_TILES"

# Requires GDAL (gdaldem, gdal2tiles.py)
if ! command -v gdal2tiles.py &>/dev/null; then
  echo "Error: gdal2tiles.py not found. Install GDAL: sudo apt install gdal-bin"
  exit 1
fi

# Colormap: value r g b [a] - matches LAND_COVER_COLORMAP (QGIS 6-class scheme)
# 0: Water Bodies, 1: Grassland, 2: Mangrove, 3: Bareland, 4: Built Up, 5: Forest
cat > "$COLOR_FILE" << 'COLORMAP'
0 52 152 219 255
1 205 220 57 255
2 46 125 50 255
3 161 136 127 255
4 117 117 117 255
5 56 142 60 255
COLORMAP

for year in 2020 2023; do
  # Prefer .tif (uploaded), fall back to .vrt
  src=""
  [ -f "raster_data/landcover_${year}.tif" ] && src="raster_data/landcover_${year}.tif"
  [ -z "$src" ] && [ -f "raster_data/landcover_${year}.vrt" ] && src="raster_data/landcover_${year}.vrt"
  [ -z "$src" ] && { echo "Skip (not found): landcover_${year}.tif or .vrt"; continue; }

  out="$MEDIA_TILES/$year"
  echo "Generating tiles for $year (from $(basename "$src"))..."
  # Apply colormap with opaque colors (source palette may produce transparent output)
  temp_rgb="raster_data/landcover_${year}_colored.tif"
  gdaldem color-relief -alpha -co COMPRESS=LZW -co TILED=YES --config CHECK_DISK_FREE_SPACE FALSE "$src" "$COLOR_FILE" "$temp_rgb"
  if [ ! -f "$temp_rgb" ] || [ ! -s "$temp_rgb" ]; then
    echo "Error: gdaldem did not create valid output: $temp_rgb"
    exit 1
  fi
  gdal2tiles.py -z 0-14 -r near --processes=4 "$temp_rgb" "$out"
  rm -f "$temp_rgb"
done

echo "Done. Tiles in $MEDIA_TILES"
echo ""
echo "Generate stats for chart: python manage.py generate_landcover_stats"
echo ""
echo "Tip: Place landcover_2020.tif and landcover_2023.tif in raster_data/ to use TIFFs directly."
echo ""
echo "In Admin → Climate → Raster datasets → Edit Land cover:"
echo "  Set Precomputed tile url to (use relative URL so Vite proxy works):"
echo "  /media/tiles/landcover/{year}/{z}/{x}/{y}.png"
echo ""
echo "Save, then refresh the map."
