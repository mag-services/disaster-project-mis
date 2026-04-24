# Allow relative paths for precomputed tile URL (e.g. /media/tiles/...)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0035_raster_cluster_nullable"),
    ]

    operations = [
        migrations.AlterField(
            model_name="rasterdataset",
            name="precomputed_tile_url",
            field=models.CharField(
                blank=True,
                help_text="URL template for precomputed tiles. Use {z},{x},{y},{year} placeholders. Relative paths like /media/tiles/landcover/{year}/{z}/{x}/{y}.png work with Vite proxy in dev.",
                max_length=1024,
                null=True,
            ),
        ),
    ]
