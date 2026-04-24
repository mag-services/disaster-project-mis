from django.urls import path

from . import views

app_name = "integrations"

urlpatterns = [
    # Read (other systems read from Disaster MIS)
    path("tabular/", views.IntegrationTabularListView.as_view(), name="tabular-list"),
    path("tabular/<int:pk>/", views.IntegrationTabularDetailView.as_view(), name="tabular-detail"),
    path("tabular/<int:pk>/data/", views.IntegrationTabularDataView.as_view(), name="tabular-data"),
    path("tabular/<int:pk>/aggregate/", views.IntegrationTabularAggregateView.as_view(), name="tabular-aggregate"),
    # Ingest (other systems push data into Disaster MIS)
    path("tabular/ingest/", views.TabularIngestView.as_view(), name="tabular-ingest"),
]
