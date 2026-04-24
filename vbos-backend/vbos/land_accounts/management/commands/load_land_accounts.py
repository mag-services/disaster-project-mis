"""
Load land accounts data from JSON file.
Usage: ./manage.py load_land_accounts [path_to_json]
If no path given, loads from bundled fixture (vbos/land_accounts/fixtures/initial_land_accounts.json).
"""
import json
from pathlib import Path

from django.core.management.base import BaseCommand

from vbos.land_accounts.models import LandAccountsData


class Command(BaseCommand):
    help = "Load land accounts data from JSON file"

    def add_arguments(self, parser):
        parser.add_argument(
            "path",
            nargs="?",
            type=str,
            help="Path to landAccountsData.json (default: bundled fixture)",
        )

    def handle(self, *args, **options):
        path_arg = options.get("path")
        if path_arg:
            path = Path(path_arg)
        else:
            # Default: bundled fixture (works in Docker)
            fixture_dir = Path(__file__).resolve().parent.parent.parent / "fixtures"
            path = fixture_dir / "initial_land_accounts.json"

        if not path.exists():
            self.stderr.write(self.style.ERROR(f"File not found: {path}"))
            return

        with open(path, encoding="utf-8") as f:
            data = json.load(f)

        if "provinces" not in data:
            self.stderr.write(self.style.ERROR("JSON must have 'provinces' key"))
            return

        obj = LandAccountsData.objects.first()
        if obj:
            obj.data = data
            obj.save()
            self.stdout.write(self.style.SUCCESS(f"Updated land accounts ({len(data['provinces'])} provinces)"))
        else:
            LandAccountsData.objects.create(data=data)
            self.stdout.write(self.style.SUCCESS(f"Created land accounts ({len(data['provinces'])} provinces)"))
