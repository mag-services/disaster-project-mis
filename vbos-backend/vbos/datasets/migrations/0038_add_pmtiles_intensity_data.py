# Add intensity_data JSONField to PMTilesDataset for cyclone intensity lookup.
# When set, the backend can return filtered intensity by province/area_council
# without reading the PMTiles file. Structure: list of {acname, Province, Intensity, intensity_color}

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0037_add_cyclone_name"),
    ]

    operations = [
        migrations.AddField(
            model_name="pmtilesdataset",
            name="intensity_data",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="Optional. For cyclone datasets: list of {acname, Province, Intensity, intensity_color}. Enables right-panel intensity display for PMTiles.",
            ),
        ),
    ]
