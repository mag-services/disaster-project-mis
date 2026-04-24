"""
Simplify polygon geometries in VectorItem to reduce vertex count and prevent browser crash.
Run after importing heavy GeoJSON (e.g. area councils with detailed coastlines).
"""
from django.core.management.base import BaseCommand

from ...models import VectorItem


class Command(BaseCommand):
    help = "Simplify polygon VectorItems with >500 vertices (tolerance=0.01 degrees)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dataset",
            type=int,
            help="Only simplify items in this VectorDataset ID",
        )
        parser.add_argument(
            "--tolerance",
            type=float,
            default=0.01,
            help="Douglas-Peucker tolerance in degrees (default 0.01 ~1km)",
        )

    def handle(self, *args, **options):
        qs = VectorItem.objects.exclude(geometry__isnull=True)
        if options.get("dataset"):
            qs = qs.filter(dataset_id=options["dataset"])
        tolerance = options["tolerance"]

        updated = 0
        for item in qs:
            geom = item.geometry
            if geom.geom_type not in ("Polygon", "MultiPolygon"):
                continue
            try:
                n = geom.num_coords
            except (AttributeError, TypeError):
                continue
            if n <= 500:
                continue
            item.geometry = geom.simplify(
                tolerance=tolerance, preserve_topology=True
            )
            item.save(update_fields=["geometry"])
            updated += 1
            self.stdout.write(f"  Simplified VectorItem {item.id} ({n} -> ~fewer coords)")

        self.stdout.write(self.style.SUCCESS(f"Simplified {updated} polygon(s)"))
