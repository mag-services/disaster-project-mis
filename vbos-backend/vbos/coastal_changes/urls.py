from django.urls import path

from . import views

app_name = "coastal_changes"

urlpatterns = [
    path("coastal-changes/", views.CoastalChangesView.as_view(), name="coastal-changes"),
]
