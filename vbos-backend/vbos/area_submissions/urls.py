from django.urls import path

from . import views

urlpatterns = [
    path("area-submissions/areas/", views.AreaAdminAreasView.as_view(), name="area-admin-areas"),
    path("area-submissions/", views.AreaSubmissionListCreateView.as_view(), name="area-submission-list"),
    path(
        "area-submissions/<int:pk>/",
        views.AreaSubmissionDetailView.as_view(),
        name="area-submission-detail",
    ),
    path(
        "area-submissions/<int:pk>/submit/",
        views.AreaSubmissionSubmitView.as_view(),
        name="area-submission-submit",
    ),
    path(
        "area-submissions/<int:pk>/approve/",
        views.AreaSubmissionApproveView.as_view(),
        name="area-submission-approve",
    ),
    path(
        "area-submissions/<int:pk>/reject/",
        views.AreaSubmissionRejectView.as_view(),
        name="area-submission-reject",
    ),
]
