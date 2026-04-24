# Generated manually for vector map popup field configuration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0050_rename_datasets_ma_user_id_updated_idx_datasets_ma_user_id_563b23_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="vectordataset",
            name="popup_properties",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="Optional ordered list of GeoJSON property keys to show in the map popup. Empty = show all.",
            ),
        ),
    ]
