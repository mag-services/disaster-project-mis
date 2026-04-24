# Add icon field to VectorDataset for map display

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0029_remove_map_annotation"),
    ]

    operations = [
        migrations.AddField(
            model_name="vectordataset",
            name="icon",
            field=models.CharField(
                blank=True,
                choices=[
                    ("circle", "Circle (default)"),
                    ("graduationCap", "Graduation cap (schools)"),
                    ("cross", "Cross (health)"),
                    ("mapPin", "Map pin"),
                    ("building", "Building"),
                    ("square", "Square"),
                    ("triangle", "Triangle"),
                    ("star", "Star"),
                ],
                help_text="Icon to display on the map. Leave empty for auto (cluster-based or index).",
                max_length=50,
                null=True,
            ),
        ),
    ]
