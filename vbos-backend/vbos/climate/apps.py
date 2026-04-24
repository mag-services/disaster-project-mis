from django.apps import AppConfig
from django.urls import reverse


def _custom_get_app_list(self, request):
    """Replace land_accounts and coastal_changes with a single Climate section."""
    app_list = self._get_app_list_orig(request)
    # Filter out land_accounts and coastal_changes
    app_list = [a for a in app_list if a["app_label"] not in ("land_accounts", "coastal_changes")]
    # Get Climate app models (Raster, PMTiles, Vector - all under Climate)
    climate_app_models = []
    for app in app_list:
        if app["app_label"] == "climate":
            climate_app_models = list(app["models"])
            app["models"] = []  # Remove from default position
            break
    # Build unified Climate section. ClimateVectorItem (Vector items) is already in climate_app_models.
    climate_models = [
        {
            "object_name": "climate",
            "name": "Manage modules",
            "add_url": None,
            "admin_url": reverse("admin_climate_dashboard"),
            "view_only": False,
        },
    ] + climate_app_models
    climate_entry = {
        "name": "Climate",
        "app_label": "climate",
        "app_url": reverse("admin_climate_dashboard"),
        "has_module_perms": True,
        "models": climate_models,
    }
    # Remove climate app if it has no models left (we merged into climate_entry)
    app_list = [a for a in app_list if a["app_label"] != "climate" or a["models"]]
    # Insert Climate after users (or at start)
    insert_at = 0
    for i, app in enumerate(app_list):
        if app["app_label"] == "users":
            insert_at = i + 1
            break
    app_list.insert(insert_at, climate_entry)
    return app_list


class ClimateConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "vbos.climate"
    verbose_name = "Climate"

    def ready(self):
        from django.contrib import admin
        # Patch get_app_list to show single Climate section
        if not hasattr(admin.site, "_get_app_list_orig"):
            admin.site._get_app_list_orig = admin.site.get_app_list
            admin.site.get_app_list = lambda request: _custom_get_app_list(admin.site, request)
