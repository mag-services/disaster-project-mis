# Restructure: climate_module replaces available_in_disaster/climate.
# Disaster = climate_module null. Climate Land Accounts = land_accounts. Climate Coastal = coastal_changes.

from django.db import migrations, models


def add_climate_module(apps, schema_editor):
    PMTilesDataset = apps.get_model("datasets", "PMTilesDataset")
    VectorDataset = apps.get_model("datasets", "VectorDataset")
    Cluster = apps.get_model("datasets", "Cluster")

    # Create Land Accounts and Coastal Changes clusters for Climate
    Cluster.objects.get_or_create(name="Land Accounts", defaults={"order": 100})
    Cluster.objects.get_or_create(name="Coastal Changes", defaults={"order": 101})

    for obj in PMTilesDataset.objects.all():
        if obj.available_in_climate and not obj.available_in_disaster:
            if "coastal" in (obj.name or "").lower() or "shoreline" in (obj.name or "").lower():
                obj.climate_module = "coastal_changes"
            else:
                obj.climate_module = "land_accounts"
        else:
            obj.climate_module = None
        obj.save()

    for obj in VectorDataset.objects.all():
        if obj.available_in_climate and not obj.available_in_disaster:
            if "coastal" in (obj.name or "").lower() or "shoreline" in (obj.name or "").lower():
                obj.climate_module = "coastal_changes"
            else:
                obj.climate_module = "land_accounts"
        else:
            obj.climate_module = None
        obj.save()


def reverse_add_climate_module(apps, schema_editor):
    PMTilesDataset = apps.get_model("datasets", "PMTilesDataset")
    VectorDataset = apps.get_model("datasets", "VectorDataset")
    PMTilesDataset.objects.all().update(climate_module=None)
    VectorDataset.objects.all().update(climate_module=None)


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0039_add_available_in_disaster_climate"),
    ]

    operations = [
        migrations.AddField(
            model_name="pmtilesdataset",
            name="climate_module",
            field=models.CharField(
                max_length=30,
                blank=True,
                null=True,
                choices=[
                    ("", "Disaster only"),
                    ("land_accounts", "Land Accounts (Climate)"),
                    ("coastal_changes", "Coastal Changes (Climate)"),
                ],
                help_text="Null/empty = Disaster section. land_accounts = Land Accounts. coastal_changes = Coastal Changes.",
            ),
        ),
        migrations.AddField(
            model_name="vectordataset",
            name="climate_module",
            field=models.CharField(
                max_length=30,
                blank=True,
                null=True,
                choices=[
                    ("", "Disaster only"),
                    ("land_accounts", "Land Accounts (Climate)"),
                    ("coastal_changes", "Coastal Changes (Climate)"),
                ],
                help_text="Null/empty = Disaster section. land_accounts = Land Accounts. coastal_changes = Coastal Changes.",
            ),
        ),
        migrations.RunPython(add_climate_module, reverse_add_climate_module),
        migrations.RemoveField(model_name="pmtilesdataset", name="available_in_disaster"),
        migrations.RemoveField(model_name="pmtilesdataset", name="available_in_climate"),
        migrations.RemoveField(model_name="vectordataset", name="available_in_disaster"),
        migrations.RemoveField(model_name="vectordataset", name="available_in_climate"),
    ]
