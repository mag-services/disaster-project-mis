# Add order field for drag-and-drop reordering in admin

from django.db import migrations, models


def set_initial_order(apps, schema_editor):
    Cluster = apps.get_model("datasets", "Cluster")
    for order, cluster in enumerate(Cluster.objects.order_by("name"), 1):
        cluster.order = order
        cluster.save(update_fields=["order"])


def reverse_order(apps, schema_editor):
    # No-op: we can't restore previous order
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0024_add_clusters"),
    ]

    operations = [
        migrations.AddField(
            model_name="cluster",
            name="order",
            field=models.PositiveIntegerField(db_index=True, default=0),
            preserve_default=False,
        ),
        migrations.RunPython(set_initial_order, reverse_code=reverse_order),
    ]
