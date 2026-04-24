"""
Serve PMTiles files with HTTP Range (byte-serving) support.

PMTiles requires Content-Length and Range request support. Django's default
static/media serving does not support this. This view provides a proxy that
serves .pmtiles files from MEDIA_ROOT with proper headers.
"""
import os
import re
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, HttpResponse, HttpResponseNotModified
from django.views import View
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_GET


def _parse_range_header(range_header: str, file_size: int) -> tuple[int, int] | None:
    """Parse Range header. Returns (start, end) inclusive, or None if invalid."""
    if not range_header or not range_header.startswith("bytes="):
        return None
    match = re.match(r"bytes=(\d*)-(\d*)", range_header.strip())
    if not match:
        return None
    start_str, end_str = match.groups()
    start = int(start_str) if start_str else 0
    end = int(end_str) if end_str else file_size - 1
    if start < 0 or end >= file_size or start > end:
        return None
    return (start, end)


@require_GET
@cache_control(public=True, max_age=86400)  # 1 day cache
def serve_pmtiles(request, path: str):
    """
    Serve a PMTiles file with Range request support.
    Path can be 'roads.pmtiles' or 'media/roads.pmtiles' (media/ prefix is stripped).
    """
    if not path.endswith(".pmtiles"):
        return HttpResponse("Not found", status=404)
    # Strip "media/" prefix if present (API may return media/filename.pmtiles)
    if path.startswith("media/"):
        path = path[6:]  # len("media/") == 6
    # Prevent path traversal - only allow simple filenames (no slashes after strip)
    if "/" in path or "\\" in path or path.startswith("."):
        return HttpResponse("Invalid path", status=400)
    media_root = Path(settings.MEDIA_ROOT)
    file_path = media_root / path
    try:
        file_path.resolve().relative_to(media_root.resolve())
    except (ValueError, OSError):
        return HttpResponse("Invalid path", status=400)
    if not file_path.exists() or not file_path.is_file():
        return HttpResponse("Not found", status=404)
    file_size = file_path.stat().st_size
    range_header = request.META.get("HTTP_RANGE")
    if range_header:
        parsed = _parse_range_header(range_header, file_size)
        if parsed:
            start, end = parsed
            length = end - start + 1
            with open(file_path, "rb") as f:
                f.seek(start)
                content = f.read(length)
            response = HttpResponse(content, status=206)
            response["Content-Range"] = f"bytes {start}-{end}/{file_size}"
            response["Content-Length"] = str(length)
        else:
            # Invalid range - return full file
            response = FileResponse(open(file_path, "rb"), as_attachment=False)
            response["Content-Length"] = str(file_size)
    else:
        response = FileResponse(open(file_path, "rb"), as_attachment=False)
        response["Content-Length"] = str(file_size)
    response["Accept-Ranges"] = "bytes"
    response["Content-Type"] = "application/vnd.pmtiles"
    return response
