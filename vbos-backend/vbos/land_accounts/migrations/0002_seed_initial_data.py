import json
from pathlib import Path

from django.db import migrations


def load_initial_data(apps, schema_editor):
    """Load initial land accounts (2020–2023) from fixture."""
    LandAccountsData = apps.get_model("land_accounts", "LandAccountsData")
    if LandAccountsData.objects.exists():
        return

    # Load from fixture bundled with the app (works in Docker)
    fixture_dir = Path(__file__).resolve().parent.parent / "fixtures"
    path = fixture_dir / "initial_land_accounts.json"
    if not path.exists():
        return

    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    if "provinces" in data:
        LandAccountsData.objects.create(data=data)


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("land_accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(load_initial_data, reverse_noop),
    ]
