from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpResponseRedirect
from django.urls import include, path, re_path
from django.views.generic import RedirectView

from vbos.datasets.admin_views import icon_picker
from vbos.datasets.tile_serve import serve_tile
from vbos.land_accounts.admin_views import (
    add_land_accounts,
    delete_land_accounts,
    download_land_accounts_template,
    edit_land_accounts,
    import_land_accounts,
    list_land_accounts,
)
from vbos.climate.views import climate_dashboard, climate_import_geojson, climate_module_detail
from vbos.field_check.admin import field_check_dashboard
from vbos.compare.views import EventCompareView
from vbos.admin_pipeline_status_api import AdminPipelineStatusView
from vbos.rap_import.views import RAPUploadView
from vbos.maintenance.task_status_views import celery_task_status
from vbos.maintenance.views import backup_download, backup_restore_dashboard, restore_upload
from vbos.coastal_changes.admin_views import (
    add_coastal_changes,
    delete_coastal_changes,
    download_coastal_changes_template,
    edit_coastal_changes,
    import_coastal_changes,
    list_coastal_changes,
)
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from vbos.api_meta import api_health, api_v1_meta
from vbos.users.auth_2fa import (
    obtain_auth_token,
    verify_2fa,
    resend_email_otp,
    setup_totp_request,
    setup_totp_verify,
    setup_email_otp,
    disable_2fa,
    auth_me,
)

admin.site.site_header = "DRMIS Admin"
admin.site.site_title = "DRMIS Admin · Django"
admin.site.index_title = "Site administration"
API_BASE_URL = "api/v1"


def admin_append_slash_redirect(request, path):
    """Redirect admin paths without trailing slash to version with slash."""
    return HttpResponseRedirect(f"/admin/{path}/", permanent=True)


api_urls = [
    path(f"{API_BASE_URL}/meta/", api_v1_meta, name="api_v1_meta"),
    path(f"{API_BASE_URL}/health/", api_health, name="api_v1_health"),
    path(
        f"{API_BASE_URL}/",
        include(("vbos.users.urls", "vbos.users"), namespace="users"),
    ),
    path(
        f"{API_BASE_URL}/",
        include(("vbos.datasets.urls", "vbos.datasets"), namespace="datasets"),
    ),
    path(
        f"{API_BASE_URL}/",
        include(("vbos.land_accounts.urls", "vbos.land_accounts"), namespace="land_accounts"),
    ),
    path(
        f"{API_BASE_URL}/",
        include(("vbos.coastal_changes.urls", "vbos.coastal_changes"), namespace="coastal_changes"),
    ),
    path(
        f"{API_BASE_URL}/",
        include(("vbos.feedback.urls", "vbos.feedback"), namespace="feedback"),
    ),
    path(
        f"{API_BASE_URL}/",
        include(("vbos.area_submissions.urls", "vbos.area_submissions"), namespace="area_submissions"),
    ),
    path(
        f"{API_BASE_URL}/",
        include(("vbos.field_check.urls", "vbos.field_check"), namespace="field_check"),
    ),
    path(
        f"{API_BASE_URL}/integrations/",
        include(("vbos.integrations.urls", "vbos.integrations"), namespace="integrations"),
    ),
    path(
        f"{API_BASE_URL}/",
        include(("vbos.alerts.urls", "vbos.alerts"), namespace="alerts"),
    ),
]

urlpatterns = [
    path("health/", api_health, name="health"),
    path("health", api_health),
    path(
        f"{API_BASE_URL}/tasks/<str:task_id>/status/",
        celery_task_status,
        name="api_celery_task_status",
    ),
    path(
        f"{API_BASE_URL}/admin/pipeline-status/",
        AdminPipelineStatusView.as_view(),
        name="api_admin_pipeline_status",
    ),
    path("admin", RedirectView.as_view(url="/admin/", permanent=True)),
    # Redirect admin paths without trailing slash (APPEND_SLASH=False)
    re_path(
        r"^admin/(?P<path>.*[^/])$",
        admin_append_slash_redirect,
    ),
    path("admin/datasets/icon-picker/", admin.site.admin_view(icon_picker), name="admin_icon_picker"),
    path("admin/climate/", admin.site.admin_view(climate_dashboard), name="admin_climate_dashboard"),
    path("admin/climate/import-geojson/", admin.site.admin_view(climate_import_geojson), name="admin_climate_import_geojson"),
    path("admin/climate/land_accounts/", admin.site.admin_view(climate_module_detail), {"module_id": "land_accounts"}, name="admin_climate_module_land_accounts"),
    path("admin/climate/coastal_changes/", admin.site.admin_view(climate_module_detail), {"module_id": "coastal_changes"}, name="admin_climate_module_coastal_changes"),
    path("admin/land-accounts/", admin.site.admin_view(list_land_accounts), name="admin_land_accounts_list"),
    path("admin/land-accounts/add/", admin.site.admin_view(add_land_accounts), name="admin_land_accounts_add"),
    path("admin/land-accounts/import/", admin.site.admin_view(import_land_accounts), name="admin_land_accounts_import"),
    path("admin/land-accounts/template/", admin.site.admin_view(download_land_accounts_template), name="admin_land_accounts_template"),
    path("admin/land-accounts/<int:object_id>/edit/", admin.site.admin_view(edit_land_accounts), name="admin_land_accounts_edit"),
    path("admin/land-accounts/<int:object_id>/delete/", admin.site.admin_view(delete_land_accounts), name="admin_land_accounts_delete"),
    path("admin/coastal-changes/", admin.site.admin_view(list_coastal_changes), name="admin_coastal_changes_list"),
    path("admin/coastal-changes/add/", admin.site.admin_view(add_coastal_changes), name="admin_coastal_changes_add"),
    path("admin/coastal-changes/import/", admin.site.admin_view(import_coastal_changes), name="admin_coastal_changes_import"),
    path("admin/coastal-changes/template/", admin.site.admin_view(download_coastal_changes_template), name="admin_coastal_changes_template"),
    path("admin/coastal-changes/<int:object_id>/edit/", admin.site.admin_view(edit_coastal_changes), name="admin_coastal_changes_edit"),
    path("admin/coastal-changes/<int:object_id>/delete/", admin.site.admin_view(delete_coastal_changes), name="admin_coastal_changes_delete"),
    path("admin/field-check/", admin.site.admin_view(field_check_dashboard), name="admin_field_check_dashboard"),
    path(
        "admin/rap-import/upload/",
        admin.site.admin_view(RAPUploadView.as_view()),
        name="admin_rap_import_upload",
    ),
    path(
        "admin/compare/event/",
        admin.site.admin_view(EventCompareView.as_view()),
        name="admin_compare_event",
    ),
    path("admin/maintenance/", admin.site.admin_view(backup_restore_dashboard), name="admin_maintenance_backup_restore"),
    path("admin/maintenance/backup/", admin.site.admin_view(backup_download), name="admin_maintenance_backup"),
    path("admin/maintenance/restore/", admin.site.admin_view(restore_upload), name="admin_maintenance_restore"),
    path("admin/", admin.site.urls),
    path("", include(api_urls)),
    path("api-token-auth/", obtain_auth_token),
    path("api/v1/auth/verify-2fa/", verify_2fa),
    path("api/v1/auth/resend-email-otp/", resend_email_otp),
    path("api/v1/auth/setup-totp/", setup_totp_request),
    path("api/v1/auth/setup-totp-verify/", setup_totp_verify),
    path("api/v1/auth/setup-email-otp/", setup_email_otp),
    path("api/v1/auth/disable-2fa/", disable_2fa),
    path("api/v1/auth/me/", auth_me),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
    # API-Docs
    path(f"{API_BASE_URL}/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        f"{API_BASE_URL}/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    # Precomputed tiles: serve from media, transparent PNG for tiles outside extent
    path(
        "media/tiles/landcover/<str:year>/<str:z>/<str:x>/<str:y>.png",
        serve_tile,
        name="serve_tile",
    ),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
