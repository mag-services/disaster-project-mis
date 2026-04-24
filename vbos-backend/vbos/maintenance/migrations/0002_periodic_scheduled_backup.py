# Register daily scheduled backup at 02:00 UTC (django-celery-beat)

from django.db import migrations


def create_daily_backup_schedule(apps, schema_editor):
    from django_celery_beat.models import CrontabSchedule, PeriodicTask

    schedule, _ = CrontabSchedule.objects.get_or_create(
        minute="0",
        hour="2",
        day_of_week="*",
        day_of_month="*",
        month_of_year="*",
        timezone="UTC",
    )
    PeriodicTask.objects.get_or_create(
        name="Daily scheduled backup (02:00 UTC)",
        defaults={
            "task": "vbos.maintenance.tasks.run_scheduled_backup",
            "crontab": schedule,
            "enabled": True,
        },
    )


def remove_daily_backup_schedule(apps, schema_editor):
    from django_celery_beat.models import PeriodicTask

    PeriodicTask.objects.filter(name="Daily scheduled backup (02:00 UTC)").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("maintenance", "0001_initial"),
        ("django_celery_beat", "0019_alter_periodictasks_options"),
    ]

    operations = [
        migrations.RunPython(create_daily_backup_schedule, remove_daily_backup_schedule),
    ]
