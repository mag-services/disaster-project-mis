# VectorDataset.color: any #RRGGBB hex (or empty), not limited to preset choices.

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0046_map_saved_workspace"),
    ]

    operations = [
        migrations.AlterField(
            model_name="vectordataset",
            name="color",
            field=models.CharField(
                blank=True,
                help_text="Hex color for map markers (e.g. #3d4aff). Leave empty for auto (cluster or index).",
                max_length=7,
                null=True,
                validators=[
                    django.core.validators.RegexValidator(
                        regex=r"^$|^#[0-9A-Fa-f]{6}$",
                        message="Use empty for auto, or a hex color like #3d4aff.",
                    )
                ],
            ),
        ),
    ]
