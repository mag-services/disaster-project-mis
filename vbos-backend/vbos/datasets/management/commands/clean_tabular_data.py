from django.core.management.base import BaseCommand

from ...models import TabularDataset
from ...utils import clean_redundant_tabular_items


class Command(BaseCommand):
    help = """Clean TabularItem data, removing entries that are redundant."""

    def handle(self, *args, **options):
        datasets = TabularDataset.objects.all()

        for d in datasets:
            clean_redundant_tabular_items(d)

            self.stdout.write(f"Removed redundant {d.name} tabular items.")
