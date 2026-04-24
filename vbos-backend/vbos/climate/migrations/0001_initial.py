# Initial migration for climate proxy models

from django.db import migrations


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("datasets", "0041_climate_modules_multi_select"),
    ]

    operations = [
        migrations.CreateModel(
            name="ClimateRasterDataset",
            fields=[],
            options={
                "proxy": True,
                "verbose_name": "Raster dataset",
                "verbose_name_plural": "Raster datasets",
            },
            bases=("datasets.rasterdataset",),
        ),
        migrations.CreateModel(
            name="ClimateRasterFile",
            fields=[],
            options={
                "proxy": True,
                "verbose_name": "Raster file",
                "verbose_name_plural": "Raster files",
            },
            bases=("datasets.rasterfile",),
        ),
        migrations.CreateModel(
            name="ClimatePMTilesDataset",
            fields=[],
            options={
                "proxy": True,
                "verbose_name": "PMTiles dataset",
                "verbose_name_plural": "PMTiles datasets",
            },
            bases=("datasets.pmtilesdataset",),
        ),
        migrations.CreateModel(
            name="ClimateVectorDataset",
            fields=[],
            options={
                "proxy": True,
                "verbose_name": "Vector dataset",
                "verbose_name_plural": "Vector datasets",
            },
            bases=("datasets.vectordataset",),
        ),
    ]
