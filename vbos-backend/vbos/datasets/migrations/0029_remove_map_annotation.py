# Remove MapAnnotation model (revert annotation feature)

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0028_add_map_annotation"),
    ]

    operations = [
        migrations.DeleteModel(name="MapAnnotation"),
    ]
