"""
Generate landcover_stats.json from raster. Run after generate_raster_tiles.sh.
Output: media/landcover_stats.json
"""
import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from vbos.datasets.landcover_stats import compute_landcover_stats
from vbos.datasets.models import Province


class Command(BaseCommand):
    help = "Generate landcover_stats.json from raster (run after generate_raster_tiles.sh)"

    def handle(self, *args, **options):
        # Docker: raster_data mounted at /data; local: project_root/raster_data
        if Path("/data").exists():
            raster_dir = Path("/data")
        else:
            base = Path(settings.MEDIA_ROOT).parent
            raster_dir = base / "raster_data"
        media_root = Path(settings.MEDIA_ROOT)
        out_path = media_root / "landcover_stats.json"

        province_geoms = {}
        for p in Province.objects.all():
            if p.geometry:
                province_geoms[p.name] = p.geometry

        if not province_geoms:
            self.stdout.write(self.style.WARNING("No provinces with geometry found."))
            return

        all_stats = {}
        for year in [2020, 2023]:
            src = raster_dir / f"landcover_{year}.tif"
            if not src.exists():
                src = raster_dir / f"landcover_{year}.vrt"
            if not src.exists():
                self.stdout.write(self.style.WARNING(f"Skip {year}: no raster found"))
                continue
            all_stats[str(year)] = compute_landcover_stats(src, province_geoms)
            self.stdout.write(f"Computed stats for {year}")

        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w") as f:
            json.dump(all_stats, f, indent=2)
        self.stdout.write(self.style.SUCCESS(f"Wrote {out_path}"))
