"""
Serve precomputed raster tiles. Returns transparent PNG for tiles outside extent (404).
"""
from pathlib import Path

from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_GET

# 1x1 transparent PNG
TRANSPARENT_PNG = bytes(
    [
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
        0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
        0x42, 0x60, 0x82,
    ]
)


@require_GET
@cache_control(public=True, max_age=86400)
def serve_tile(request, year: str, z: str, x: str, y: str):
    """Serve tile or transparent PNG if outside raster extent."""
    media_root = Path(settings.MEDIA_ROOT)
    tile_path = media_root / "tiles" / "landcover" / year / z / x / f"{y}.png"
    try:
        tile_path.resolve().relative_to(media_root.resolve())
    except (ValueError, OSError):
        return HttpResponse("Invalid path", status=400)
    if tile_path.exists() and tile_path.is_file():
        with open(tile_path, "rb") as f:
            return HttpResponse(f.read(), content_type="image/png")
    return HttpResponse(TRANSPARENT_PNG, content_type="image/png")
