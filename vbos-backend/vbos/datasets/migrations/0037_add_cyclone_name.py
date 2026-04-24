# Add cyclone_name to PMTilesDataset and VectorDataset for displaying event name when layer is active

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0036_precomputed_tile_url_charfield"),
    ]

    operations = [
        migrations.AddField(
            model_name="pmtilesdataset",
            name="cyclone_name",
            field=models.CharField(
                blank=True,
                help_text="Name of the cyclone/event (e.g. Cyclone Lola). Shown when layer is active.",
                max_length=155,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="vectordataset",
            name="cyclone_name",
            field=models.CharField(
                blank=True,
                help_text="Name of the cyclone/event (e.g. Cyclone Lola). Shown when layer is active.",
                max_length=155,
                null=True,
            ),
        ),
    ]
