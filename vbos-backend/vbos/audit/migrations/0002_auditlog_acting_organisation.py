import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("organisations", "0001_initial"),
        ("audit", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="auditlog",
            name="acting_organisation",
            field=models.ForeignKey(
                blank=True,
                help_text="User's organisation at action time (GGGI / MoCCA attribution for publication and sensitive edits).",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to="organisations.organisation",
            ),
        ),
    ]
