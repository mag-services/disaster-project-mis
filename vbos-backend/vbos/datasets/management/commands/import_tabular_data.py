import csv

from django.core.management.base import BaseCommand

from ...utils import CSVRow, create_tabular_item, get_dataset


class Command(BaseCommand):
    help = """Read a local CSV file and import TabularItems from it."""

    def add_arguments(self, parser):
        parser.add_argument("filename", nargs=1, type=str)

    def handle(self, *args, **options):
        filename = options["filename"][0]

        with open(filename) as file:
            reader = csv.DictReader(file)
            created_count = 0
            error_count = 0

            for row in reader:
                try:
                    dataset = get_dataset(row)
                    csv_row = CSVRow(row)
                    create_tabular_item(csv_row, dataset)

                    created_count += 1
                except Exception as e:
                    print(f"{e}: {row}")
                    error_count += 1

            self.stdout.write(f"{created_count} tabular items created from {filename}.")
