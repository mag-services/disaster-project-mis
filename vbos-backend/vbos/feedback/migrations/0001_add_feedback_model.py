# Add Feedback model

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Feedback",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("category", models.CharField(choices=[("bug", "Bug"), ("feature", "Feature request"), ("general", "General feedback")], max_length=20)),
                ("message", models.TextField()),
                ("screenshot", models.ImageField(blank=True, null=True, upload_to="feedback/%Y-%m/")),
                ("user_email", models.EmailField(blank=True, max_length=254)),
                ("page_url", models.URLField(blank=True, max_length=500)),
                ("user_agent", models.CharField(blank=True, max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="feedback_submissions", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name_plural": "Feedback",
                "ordering": ["-created_at"],
            },
        ),
    ]
