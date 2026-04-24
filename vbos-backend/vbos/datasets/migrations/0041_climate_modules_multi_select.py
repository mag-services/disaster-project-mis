# Add climate_modules for multi-select display (Land cover, Coastal erosion, etc.)

from django.db import migrations, models


def migrate_climate_module_to_modules(apps, schema_editor):
    PMTilesDataset = apps.get_model("datasets", "PMTilesDataset")
    VectorDataset = apps.get_model("datasets", "VectorDataset")
    for obj in PMTilesDataset.objects.all():
        if obj.climate_module:
            obj.climate_modules = [obj.climate_module]
        else:
            obj.climate_modules = []
        obj.save()
    for obj in VectorDataset.objects.all():
        if obj.climate_module:
            obj.climate_modules = [obj.climate_module]
        else:
            obj.climate_modules = []
        obj.save()


def reverse_migrate(apps, schema_editor):
    PMTilesDataset = apps.get_model("datasets", "PMTilesDataset")
    VectorDataset = apps.get_model("datasets", "VectorDataset")
    for obj in PMTilesDataset.objects.all():
        obj.climate_module = obj.climate_modules[0] if obj.climate_modules else None
        obj.save()
    for obj in VectorDataset.objects.all():
        obj.climate_module = obj.climate_modules[0] if obj.climate_modules else None
        obj.save()


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0040_climate_module_restructure"),
    ]

    operations = [
        migrations.AddField(
            model_name="pmtilesdataset",
            name="climate_modules",
            field=models.JSONField(
                default=list,
                blank=True,
                help_text="Modules where this dataset is shown: Land cover, Coastal erosion, Flood, etc. Empty = Disaster only.",
            ),
        ),
        migrations.AddField(
            model_name="vectordataset",
            name="climate_modules",
            field=models.JSONField(
                default=list,
                blank=True,
                help_text="Modules where this dataset is shown: Land cover, Coastal erosion, Flood, etc. Empty = Disaster only.",
            ),
        ),
        migrations.RunPython(migrate_climate_module_to_modules, reverse_migrate),
    ]
