# Precomputed tiles for heavy raster + tabular joins

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0032_vectordataset_icon_flaticon"),
    ]

    operations = [
        migrations.AddField(
            model_name="rasterdataset",
            name="precomputed_tile_url",
            field=models.URLField(
                blank=True,
                help_text="Optional URL template for precomputed tiles (raster + tabular joins). Use {z},{x},{y},{year} placeholders. When set, frontend uses this instead of TiTiler for heavy datasets.",
                max_length=1024,
                null=True,
            ),
        ),
    ]
