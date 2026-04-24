import csv

from django.core.management.base import BaseCommand

from ...models import Cluster, TabularDataset
from ...utils import REVERSE_TYPE_MAPPING


class Command(BaseCommand):
    help = """Read a local CSV file and import datasets from it."""

    def add_arguments(self, parser):
        parser.add_argument("filename", nargs=1, type=str)

    def handle(self, *args, **options):
        filename = options["filename"][0]

        with open(filename) as file:
            reader = csv.DictReader(file)
            created_count = 0

            datasets = [
                (i.name, i.cluster.name, i.type) for i in TabularDataset.objects.all()
            ]

            for row in reader:
                type = (
                    REVERSE_TYPE_MAPPING[row["Type"].strip()]
                    if row["Type"]
                    else "baseline"
                )
                if (
                    row["Indicator"].strip(),
                    row["Cluster"].strip(),
                    type,
                ) not in datasets:
                    TabularDataset.objects.create(
                        name=row["Indicator"].strip(),
                        cluster=Cluster.objects.get_or_create(
                            name=row["Cluster"].strip()
                        )[0],
                        type=type,
                        unit=row["Unit"].strip(),
                        source=row["Source"].strip(),
                    )
                    datasets.append(
                        (
                            row["Indicator"].strip(),
                            row["Cluster"].strip(),
                            type,
                        )
                    )
                    created_count += 1

            self.stdout.write(f"{created_count} datasets created from {filename}.")
