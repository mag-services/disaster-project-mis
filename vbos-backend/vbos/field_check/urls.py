from django.urls import path

from . import views

urlpatterns = [
    path("field-checks/", views.FieldTeamDeploymentStatsView.as_view(), name="field-checks-stats"),
    path("field-check/content-types/", views.FieldCheckContentTypesView.as_view(), name="field-check-content-types"),
    path("field-check/records/", views.FieldCheckRecordListCreateView.as_view(), name="field-check-records"),
    path("field-check/coverage/", views.FieldCheckCoverageView.as_view(), name="field-check-coverage"),
    path(
        "field-check/items/<str:content_type_app>/<str:content_type_model>/<int:object_id>/",
        views.FieldCheckItemConfidenceView.as_view(),
        name="field-check-item-confidence",
    ),
]
