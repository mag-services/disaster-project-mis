# Initial AuditLog model

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("contenttypes", "0002_remove_content_type_name"),
    ]

    operations = [
        migrations.CreateModel(
            name="AuditLog",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "object_id",
                    models.PositiveIntegerField(
                        help_text="Primary key of the tracked object.",
                    ),
                ),
                (
                    "action",
                    models.CharField(
                        choices=[
                            ("create", "Created"),
                            ("update", "Updated"),
                            ("delete", "Deleted"),
                        ],
                        db_index=True,
                        max_length=10,
                    ),
                ),
                (
                    "timestamp",
                    models.DateTimeField(auto_now_add=True, db_index=True),
                ),
                (
                    "field_name",
                    models.CharField(
                        blank=True,
                        db_index=True,
                        help_text="Name of the field that was changed.",
                        max_length=100,
                        null=True,
                    ),
                ),
                (
                    "old_value",
                    models.TextField(
                        blank=True,
                        help_text="Previous value before the change.",
                        null=True,
                    ),
                ),
                (
                    "new_value",
                    models.TextField(
                        blank=True,
                        help_text="New value after the change.",
                        null=True,
                    ),
                ),
                (
                    "ip_address",
                    models.GenericIPAddressField(
                        blank=True,
                        help_text="IP address of the user who made the change.",
                        null=True,
                    ),
                ),
                (
                    "user_agent",
                    models.TextField(
                        blank=True,
                        help_text="Browser/client information.",
                        null=True,
                    ),
                ),
                (
                    "object_repr",
                    models.CharField(
                        blank=True,
                        help_text="String representation of the object for easy identification.",
                        max_length=200,
                        null=True,
                    ),
                ),
                (
                    "content_type",
                    models.ForeignKey(
                        help_text="The model class being tracked.",
                        limit_choices_to={
                            "model__in": [
                                "tabularitem",
                                "vectoritem",
                                "fieldcheckrecord",
                                "rasterdataset",
                                "vectordataset",
                                "tabulardataset",
                                "pmtilesdataset",
                            ]
                        },
                        on_delete=django.db.models.deletion.CASCADE,
                        to="contenttypes.contenttype",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        help_text="User who performed the action.",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="audit_logs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Audit Log",
                "verbose_name_plural": "Audit Logs",
                "ordering": ["-timestamp"],
            },
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(
                fields=["content_type", "object_id"],
                name="audit_audit_content_0c6b_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(
                fields=["user", "timestamp"],
                name="audit_audit_user_id_0a1b_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(
                fields=["action", "timestamp"],
                name="audit_audit_action_t_1c2d_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(
                fields=["field_name", "timestamp"],
                name="audit_audit_field_n_2e3f_idx",
            ),
        ),
    ]
