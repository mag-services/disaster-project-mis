# Add checkboxes for whether Vector and PMTiles datasets are available in Disaster or Climate mode.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0038_add_pmtiles_intensity_data"),
    ]

    operations = [
        migrations.AddField(
            model_name="vectordataset",
            name="available_in_disaster",
            field=models.BooleanField(
                default=True,
                help_text="When checked, this dataset is available in Disaster mode.",
            ),
        ),
        migrations.AddField(
            model_name="vectordataset",
            name="available_in_climate",
            field=models.BooleanField(
                default=True,
                help_text="When checked, this dataset is available in Climate mode.",
            ),
        ),
        migrations.AddField(
            model_name="pmtilesdataset",
            name="available_in_disaster",
            field=models.BooleanField(
                default=True,
                help_text="When checked, this dataset is available in Disaster mode.",
            ),
        ),
        migrations.AddField(
            model_name="pmtilesdataset",
            name="available_in_climate",
            field=models.BooleanField(
                default=True,
                help_text="When checked, this dataset is available in Climate mode.",
            ),
        ),
    ]
