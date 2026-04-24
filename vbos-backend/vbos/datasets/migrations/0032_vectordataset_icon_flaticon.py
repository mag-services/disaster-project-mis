# Allow Flaticon icon format (fi-sr-*) - remove choices, increase max_length

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0031_vectordataset_color"),
    ]

    operations = [
        migrations.AlterField(
            model_name="vectordataset",
            name="icon",
            field=models.CharField(
                blank=True,
                help_text="Icon to display on the map. Use Lucide key (e.g. droplet) or Flaticon class (e.g. fi-sr-hospital). Leave empty for auto.",
                max_length=80,
                null=True,
            ),
        ),
    ]
