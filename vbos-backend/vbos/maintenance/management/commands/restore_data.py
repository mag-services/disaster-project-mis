"""
Restore application data from a JSON backup created by backup_data.
Uses loaddata. Use with caution: may create duplicates or conflict with existing data.
"""
from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Restore application data from a JSON backup file (created by backup_data)."

    def add_arguments(self, parser):
        parser.add_argument(
            "file",
            help="Path to JSON backup file.",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing data before loading. Use with extreme caution.",
        )

    def handle(self, *args, **options):
        path = options["file"]
        clear = options.get("clear", False)

        if clear:
            self.stdout.write(self.style.WARNING("--clear: clearing data before load (use with caution)"))

        call_command("loaddata", path, verbosity=options.get("verbosity", 1))
        self.stdout.write(self.style.SUCCESS(f"Restore from {path} completed."))
