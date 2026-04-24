# Add color field to VectorDataset for map display

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0030_vectordataset_icon"),
    ]

    operations = [
        migrations.AddField(
            model_name="vectordataset",
            name="color",
            field=models.CharField(
                blank=True,
                choices=[
                    ("#3d4aff", "Blue"),
                    ("#10b981", "Emerald"),
                    ("#f09000", "Orange"),
                    ("#8b5cf6", "Violet"),
                    ("#e34a33", "Red"),
                    ("#06b6d4", "Cyan"),
                    ("#6366f1", "Indigo"),
                    ("#14b8a6", "Teal"),
                ],
                help_text="Color for map markers. Leave empty for auto (cluster or index).",
                max_length=7,
                null=True,
            ),
        ),
    ]
