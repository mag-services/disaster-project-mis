import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("organisations", "0001_initial"),
        ("datasets", "0051_vectordataset_popup_properties"),
    ]

    operations = [
        migrations.AddField(
            model_name="pmtilesdataset",
            name="owning_organisation",
            field=models.ForeignKey(
                blank=True,
                help_text="Leave empty for national platform datasets; set for partner-owned layers.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="owned_pmtilesdataset",
                to="organisations.organisation",
            ),
        ),
        migrations.AddField(
            model_name="rasterdataset",
            name="owning_organisation",
            field=models.ForeignKey(
                blank=True,
                help_text="Leave empty for national platform datasets; set for partner-owned layers.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="owned_rasterdataset",
                to="organisations.organisation",
            ),
        ),
        migrations.AddField(
            model_name="tabulardataset",
            name="owning_organisation",
            field=models.ForeignKey(
                blank=True,
                help_text="Leave empty for national platform datasets; set for partner-owned layers.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="owned_tabulardataset",
                to="organisations.organisation",
            ),
        ),
        migrations.AddField(
            model_name="vectordataset",
            name="owning_organisation",
            field=models.ForeignKey(
                blank=True,
                help_text="Leave empty for national platform datasets; set for partner-owned layers.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="owned_vectordataset",
                to="organisations.organisation",
            ),
        ),
    ]
