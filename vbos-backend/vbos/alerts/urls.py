from django.urls import path

from . import views

app_name = "alerts"

urlpatterns = [
    path("alerts/", views.AlertCreateView.as_view(), name="alerts-create"),
    path("alerts/live/", views.CombinedAlertsView.as_view(), name="alerts-live"),
    path("alerts/earthquakes/", views.USGSEarthquakeView.as_view(), name="alerts-earthquakes"),
    path("alerts/vmgd/", views.VMGDWarningsView.as_view(), name="alerts-vmgd"),
    path("alerts/gdacs/", views.GDACSAlertsView.as_view(), name="alerts-gdacs"),
]
