"""
Create a JSON backup of application data using dumpdata.
Excludes sessions, migrations, and cache.
"""
from django.core.management import call_command
from django.core.management.base import BaseCommand


# Apps to include in backup (excludes sessions, migrations, cache, etc.)
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


class Command(BaseCommand):
    help = "Create a JSON backup of application data using dumpdata."

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            "-o",
            default=None,
            help="Output file path. If None, writes to stdout.",
        )
        parser.add_argument(
            "--indent",
            type=int,
            default=2,
            help="JSON indent (default 2). Use 0 for compact.",
        )

    def handle(self, *args, **options):
        out_path = options.get("output")
        indent = options.get("indent")

        if out_path:
            with open(out_path, "w", encoding="utf-8") as f:
                call_command(
                    "dumpdata",
                    *BACKUP_APPS,
                    indent=indent,
                    stdout=f,
                    natural_foreign=True,
                    natural_primary=True,
                )
            self.stdout.write(self.style.SUCCESS(f"Backup written to {out_path}"))
        else:
            call_command(
                "dumpdata",
                *BACKUP_APPS,
                indent=indent,
                natural_foreign=True,
                natural_primary=True,
            )
