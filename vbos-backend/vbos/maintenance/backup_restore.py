"""Backup and restore logic with ZIP, selective categories, compression."""
import io
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from django.conf import settings
from django.core.management import call_command

from .constants import (
    CAT_APP_DATA,
    CAT_MEDIA,
    CAT_PMTILES,
    CAT_RASTERS,
    CAT_SCHEMA,
    CAT_VECTORS,
)

BACKUP_APPS = [
    "contenttypes",
    "auth.permission",
    "admin.logentry",
    "users",
    "datasets",
    "climate",
    "land_accounts",
    "coastal_changes",
    "field_check",
    "feedback",
    "area_submissions",
    "integrations",
]

# Media subdirs to include per category
RASTER_PATHS = ["staging/raster", "production/raster"]
VECTOR_PATHS = []  # VectorItem stores geometry in DB; GeoJSON imports may be in media
PMTILES_PATHS = []  # .pmtiles in media root
TILES_PATH = "tiles"
MEDIA_PATHS = ["staging", "production"]  # Exclude rasters (handled separately)


def _zip_compression(level: str):
    """Map compression level to zipfile constant."""
    import zipfile

    if level == "high":
        return zipfile.ZIP_DEFLATED
    if level == "medium":
        return zipfile.ZIP_DEFLATED
    return zipfile.ZIP_STORED


def _add_dir_to_zip(zf, base_path: Path, arc_prefix: str, compression):
    """Recursively add directory to zipfile."""
    if not base_path.exists():
        return 0
    count = 0
    for root, dirs, files in os.walk(base_path):
        for f in files:
            fp = Path(root) / f
            try:
                rel = fp.relative_to(base_path)
                arcname = f"{arc_prefix}/{rel}".replace("\\", "/")
                zf.write(fp, arcname, compress_type=compression)
                count += 1
            except (OSError, ValueError):
                pass
    return count


def create_backup_zip(
    categories: list[str],
    compression: str = "medium",
    password: str | None = None,
    filename: str | None = None,
) -> tuple[bytes, int]:
    """
    Create a ZIP backup with selected categories.
    Returns (zip_bytes, total_size).
    """
    import zipfile

    media_root = Path(settings.MEDIA_ROOT)
    compression_type = _zip_compression(compression)
    buf = io.BytesIO()

    try:
        zf = zipfile.ZipFile(
            buf,
            "w",
            compression_type,
            strict_timestamps=False,
        )
    except TypeError:
        zf = zipfile.ZipFile(buf, "w", compression_type)

    total_size = 0

    # 1. Application data (JSON)
    if CAT_APP_DATA in categories:
        out = io.StringIO()
        call_command(
            "dumpdata",
            *BACKUP_APPS,
            indent=2,
            stdout=out,
            natural_foreign=True,
            natural_primary=True,
        )
        data = out.getvalue().encode("utf-8")
        zf.writestr("data/dumpdata.json", data, compress_type=compression_type)
        total_size += len(data)

    # 2. Rasters
    if CAT_RASTERS in categories:
        for sub in RASTER_PATHS:
            src = media_root / sub
            if src.exists():
                n = _add_dir_to_zip(zf, src, f"rasters/{sub}", compression_type)
                if n:
                    for info in zf.infolist():
                        if info.filename.startswith(f"rasters/{sub}"):
                            total_size += info.compress_size if info.compress_type else info.file_size

    # 3. Vectors (GeoJSON files in media - if any)
    if CAT_VECTORS in categories:
        for sub in VECTOR_PATHS:
            src = media_root / sub
            if src.exists():
                _add_dir_to_zip(zf, src, f"vectors/{sub}", compression_type)
        # Also check raster_data for shapefiles if present
        base = Path(settings.MEDIA_ROOT).parent
        raster_data = base / "raster_data"
        if raster_data.exists():
            _add_dir_to_zip(zf, raster_data, "vectors/raster_data", compression_type)

    # 4. PMTiles (local .pmtiles in media)
    if CAT_PMTILES in categories:
        if media_root.exists():
            for f in media_root.iterdir():
                if f.is_file() and f.suffix.lower() == ".pmtiles":
                    arcname = f"pmtiles/{f.name}"
                    zf.write(f, arcname, compress_type=compression_type)
                    total_size += f.stat().st_size
        for sub in ["pmtiles", "pmtile"]:
            src = media_root / sub
            if src.exists():
                _add_dir_to_zip(zf, src, f"pmtiles/{sub}", compression_type)

    # 5. Precomputed tiles
    if CAT_PMTILES in categories or "tiles" in str(categories):
        tiles_src = media_root / TILES_PATH
        if tiles_src.exists():
            _add_dir_to_zip(zf, tiles_src, "tiles", compression_type)

    # 6. Media (other uploads)
    if CAT_MEDIA in categories:
        for sub in MEDIA_PATHS:
            src = media_root / sub
            if src.exists():
                for item in src.iterdir():
                    if item.is_dir() and item.name != "raster":
                        _add_dir_to_zip(zf, item, f"media/{sub}/{item.name}", compression_type)
                    elif item.is_file():
                        arcname = f"media/{sub}/{item.name}"
                        zf.write(item, arcname, compress_type=compression_type)

    # 7. Database schema (SQL dump structure only)
    if CAT_SCHEMA in categories:
        try:
            with tempfile.NamedTemporaryFile(suffix=".sql", delete=False) as tmp:
                tmp_path = tmp.name
            subprocess.run(
                [
                    "pg_dump",
                    "--schema-only",
                    "--no-owner",
                    "--no-privileges",
                    "-f",
                    tmp_path,
                ],
                env={**os.environ, "PGPASSWORD": os.environ.get("PGPASSWORD", "")},
                capture_output=True,
                timeout=60,
            )
            if Path(tmp_path).exists():
                with open(tmp_path, "rb") as f:
                    schema_data = f.read()
                zf.writestr("schema/schema.sql", schema_data, compress_type=compression_type)
                total_size += len(schema_data)
            os.unlink(tmp_path)
        except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
            pass

    zf.close()
    result = buf.getvalue()
    return result, total_size + len(result)


def create_backup_bytes():
    """Legacy: create JSON-only backup (for backward compatibility)."""
    from io import StringIO

    buf = StringIO()
    call_command(
        "dumpdata",
        *BACKUP_APPS,
        indent=2,
        stdout=buf,
        natural_foreign=True,
        natural_primary=True,
    )
    return buf.getvalue().encode("utf-8")


def restore_from_zip(zip_bytes: bytes, password: str | None = None,
                    dry_run: bool = False, overwrite: bool = False,
                    merge: bool = False, categories: list[str] | None = None) -> dict:
    """
    Restore from ZIP backup.
    Returns: {"created": int, "updated": int, "errors": list}
    """
    import zipfile

    media_root = Path(settings.MEDIA_ROOT)
    result = {"created": 0, "updated": 0, "errors": []}

    try:
        zf = zipfile.ZipFile(io.BytesIO(zip_bytes), "r")
        if password:
            zf.setpassword(password.encode("utf-8"))
    except (zipfile.BadZipFile, RuntimeError) as e:
        result["errors"].append(str(e))
        return result

    if dry_run:
        result["preview"] = zf.namelist()
        return result

    if categories is None:
        categories = [CAT_APP_DATA, CAT_RASTERS, CAT_VECTORS, CAT_PMTILES, CAT_MEDIA]

    # 1. Restore app data
    if CAT_APP_DATA in categories:
        try:
            data = zf.read("data/dumpdata.json")
            if data:
                with tempfile.NamedTemporaryFile(suffix=".json", delete=False, mode="wb") as tmp:
                    tmp.write(data)
                    path = tmp.name
                try:
                    call_command("loaddata", path, verbosity=2)
                finally:
                    os.unlink(path)
        except KeyError:
            pass
        except Exception as e:
            result["errors"].append(f"Restore app data: {e}")

    # 2. Extract rasters
    if CAT_RASTERS in categories:
        for name in zf.namelist():
            if name.startswith("rasters/") and not name.endswith("/"):
                dest = media_root / name[7:]
                dest.parent.mkdir(parents=True, exist_ok=True)
                with zf.open(name) as src, open(dest, "wb") as out:
                    shutil.copyfileobj(src, out)

    # 3. Extract vectors
    if CAT_VECTORS in categories:
        for name in zf.namelist():
            if name.startswith("vectors/") and not name.endswith("/"):
                dest = media_root / name[8:]
                dest.parent.mkdir(parents=True, exist_ok=True)
                with zf.open(name) as src, open(dest, "wb") as out:
                    shutil.copyfileobj(src, out)

    # 4. Extract PMTiles
    if CAT_PMTILES in categories:
        for name in zf.namelist():
            if name.startswith("pmtiles/") and not name.endswith("/"):
                dest = media_root / name[8:]
                dest.parent.mkdir(parents=True, exist_ok=True)
                with zf.open(name) as src, open(dest, "wb") as out:
                    shutil.copyfileobj(src, out)

    # 5. Extract tiles
    for name in zf.namelist():
        if name.startswith("tiles/") and not name.endswith("/"):
            dest = media_root / name[6:]
            dest.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(name) as src, open(dest, "wb") as out:
                shutil.copyfileobj(src, out)

    # 6. Extract media
    if CAT_MEDIA in categories:
        for name in zf.namelist():
            if name.startswith("media/") and not name.endswith("/"):
                dest = media_root / name[6:]
                dest.parent.mkdir(parents=True, exist_ok=True)
                with zf.open(name) as src, open(dest, "wb") as out:
                    shutil.copyfileobj(src, out)

    zf.close()
    return result


def restore_from_upload(uploaded_file):
    """Restore from JSON or ZIP upload."""
    content = uploaded_file.read()
    # JSON dumpdata starts with "[" or "{"
    is_json = content.strip().startswith(b"[") or content.strip().startswith(b"{")
    if is_json:
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False, mode="wb") as f:
            f.write(content)
            path = f.name
        try:
            call_command("loaddata", path, verbosity=2)
        finally:
            os.unlink(path)
    else:
        restore_from_zip(content)
