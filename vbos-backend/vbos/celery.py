import os

from celery import Celery

# django-configurations: same entry as manage.py / wsgi (not vbos.settings)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "vbos.config")
os.environ.setdefault("DJANGO_CONFIGURATION", os.getenv("DJANGO_CONFIGURATION", "Local"))

from configurations import importer

importer.install()

app = Celery("vbos")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
