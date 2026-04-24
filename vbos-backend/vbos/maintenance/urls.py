from django.urls import path

from . import views

app_name = "maintenance"

urlpatterns = [
    path("", views.backup_restore_dashboard, name="backup_restore"),
    path("backup/", views.backup_download, name="backup_download"),
    path("restore/", views.restore_upload, name="restore"),
]
