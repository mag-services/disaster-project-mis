"""
Fix Coastal Shorelines PMTiles source_layer if it was incorrectly set to the pmtiles CLI command.

Usage: ./manage.py fix_coastal_shorelines_source_layer
"""
from django.core.management.base import BaseCommand

from vbos.datasets.models import PMTilesDataset


class Command(BaseCommand):
    help = "Fix Coastal Shorelines PMTiles source_layer (replace CLI command with 'default')"

    def handle(self, *args, **options):
        qs = PMTilesDataset.objects.filter(
            name__icontains="Coastal Shorelines",
            source_layer__icontains="pmtiles show",
        )
        count = qs.count()
        if count == 0:
            self.stdout.write(
                self.style.WARNING("No Coastal Shorelines dataset with incorrect source_layer found.")
            )
            return
        for obj in qs:
            old = obj.source_layer
            obj.source_layer = "default"
            obj.save()
            self.stdout.write(
                self.style.SUCCESS(f"Fixed PMTilesDataset id={obj.id}: source_layer '{old}' → 'default'")
            )
        self.stdout.write(
            self.style.SUCCESS(f"Updated {count} record(s). Try the map again.")
        )
