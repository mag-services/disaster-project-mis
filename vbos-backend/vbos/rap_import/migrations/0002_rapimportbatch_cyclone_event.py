import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0053_cyclone_event_and_tabular_fk"),
        ("rap_import", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="rapimportbatch",
            name="cyclone_event",
            field=models.ForeignKey(
                blank=True,
                help_text="Link to DRMIS cyclone record (recommended for new batches).",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="rap_batches",
                to="datasets.cycloneevent",
            ),
        ),
    ]
