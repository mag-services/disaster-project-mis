# Add is_land_cover to RasterDataset for Climate mode land cover detection

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0026_add_tabular_datasets"),
    ]

    operations = [
        migrations.AddField(
            model_name="rasterdataset",
            name="is_land_cover",
            field=models.BooleanField(
                default=False,
                help_text="When checked, this raster is treated as categorical land cover (9 classes). Frontend auto-activates it in Climate mode and applies a discrete colormap.",
            ),
        ),
    ]
