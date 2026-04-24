"""Climate admin: Raster, PMTiles, Vector, Vector Items with Display-in-modules checkboxes."""

import json

from django import forms
from django.contrib import admin
from django.contrib.gis import admin as gis_admin
from unfold.admin import ModelAdmin as UnfoldModelAdmin
from django.contrib import messages
from django.db.models import Q
from django.shortcuts import redirect, render
from django.urls import path, reverse

from vbos.datasets.admin import (
    PMTilesDatasetAdmin,
    RasterDatasetAdmin,
    RasterFileAdmin,
    VectorDatasetAdmin,
)
from vbos.datasets.forms import VectorDatasetAdminForm
from vbos.datasets.models import AreaCouncil, Cluster, Province, VectorDataset, VectorItem
from vbos.datasets.utils import process_geojson_file_to_vector_items

from .constants import CLIMATE_DISPLAY_MODULE_CHOICES
from .forms import ClimateGeoJSONUploadForm
from .models import (
    ClimatePMTilesDataset,
    ClimateRasterDataset,
    ClimateRasterFile,
    ClimateVectorDataset,
    ClimateVectorItem,
)


@admin.register(ClimateRasterDataset)
class ClimateRasterDatasetAdmin(RasterDatasetAdmin):
    """Raster datasets for Climate (Land cover). URL: /admin/climate/climaterasterdataset/"""


@admin.register(ClimateRasterFile)
class ClimateRasterFileAdmin(RasterFileAdmin):
    """Raster files for Climate. URL: /admin/climate/climaterasterfile/"""


class ClimatePMTilesDatasetForm(forms.ModelForm):
    display_in = forms.MultipleChoiceField(
        choices=CLIMATE_DISPLAY_MODULE_CHOICES,
        required=False,
        widget=forms.CheckboxSelectMultiple,
        label="Display in",
        help_text="Select modules where this dataset appears (Land cover, Coastal changes, etc.).",
    )

    class Meta:
        model = ClimatePMTilesDataset
        fields = "__all__"
        exclude = ["climate_module", "climate_modules"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            mods = getattr(self.instance, "climate_modules", None) or []
            if not mods and getattr(self.instance, "climate_module", None):
                mods = [self.instance.climate_module]
            self.initial["display_in"] = mods

    def save(self, commit=True):
        obj = super().save(commit=False)
        mods = list(self.cleaned_data.get("display_in") or [])
        obj.climate_modules = mods
        obj.climate_module = mods[0] if mods else None
        if commit:
            obj.save()
        return obj


class ClimateVectorDatasetForm(VectorDatasetAdminForm):
    display_in = forms.MultipleChoiceField(
        choices=CLIMATE_DISPLAY_MODULE_CHOICES,
        required=False,
        widget=forms.CheckboxSelectMultiple,
        label="Display in",
        help_text="Select modules where this dataset appears (Land cover, Coastal changes, etc.).",
    )

    class Meta(VectorDatasetAdminForm.Meta):
        model = ClimateVectorDataset
        exclude = ("popup_properties", "climate_module", "climate_modules")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            mods = getattr(self.instance, "climate_modules", None) or []
            if not mods and getattr(self.instance, "climate_module", None):
                mods = [self.instance.climate_module]
            self.initial["display_in"] = mods

    def save(self, commit=True):
        obj = super().save(commit=False)
        mods = list(self.cleaned_data.get("display_in") or [])
        obj.climate_modules = mods
        obj.climate_module = mods[0] if mods else None
        if commit:
            obj.save()
            self.save_m2m()
        return obj


@admin.register(ClimatePMTilesDataset)
class ClimatePMTilesDatasetAdmin(PMTilesDatasetAdmin):
    form = ClimatePMTilesDatasetForm
    list_display = ["id", "name", "type", "publication_status", "display_modules", "updated"]
    list_editable = []

    def get_queryset(self, request):
        qs = super(PMTilesDatasetAdmin, self).get_queryset(request)
        return qs.filter(
            Q(climate_module__in=["land_accounts", "coastal_changes"])
            | ~Q(climate_modules=[])
        )

    def get_fieldsets(self, request, obj=None):
        fieldsets = list(super().get_fieldsets(request, obj))
        result = []
        for name, data in fieldsets:
            if name == "Section":
                result.append((
                    "Display in modules",
                    {
                        "fields": ("display_in",),
                        "description": "Select where this dataset appears in Climate.",
                    },
                ))
                continue
            if name == "PMTiles":
                # Climate dashboard: no cyclone fields (disaster-only)
                fields = tuple(
                    f for f in data.get("fields", ())
                    if f not in ("cyclone_name", "intensity_data")
                )
                if fields:
                    result.append((name, {**data, "fields": fields}))
                continue
            result.append((name, data))
        return result

    def save_model(self, request, obj, form, change):
        if hasattr(form, "cleaned_data") and "display_in" in form.cleaned_data:
            obj.climate_modules = list(form.cleaned_data.get("display_in") or [])
        if obj.climate_modules:
            obj.climate_module = obj.climate_modules[0]
        else:
            obj.climate_module = None
        if not obj.cluster_id:
            obj.cluster = Cluster.objects.get_or_create(name="Land Accounts", defaults={"order": 100})[0]
        super().save_model(request, obj, form, change)

    @admin.display(description="Display in")
    def display_modules(self, obj):
        mods = getattr(obj, "climate_modules", None) or []
        if not mods and getattr(obj, "climate_module", None):
            mods = [obj.climate_module]
        labels = dict(CLIMATE_DISPLAY_MODULE_CHOICES)
        return ", ".join(labels.get(m, m) for m in mods) or "—"


@admin.register(ClimateVectorDataset)
class ClimateVectorDatasetAdmin(VectorDatasetAdmin):
    form = ClimateVectorDatasetForm
    list_display = [
        "id",
        "name",
        "type",
        "publication_status",
        "display_modules",
        "icon",
        "color",
        "updated",
    ]
    # color uses VectorColorPickerWidget (inherited); not list-editable
    list_editable = ["icon"]

    def get_queryset(self, request):
        qs = super(VectorDatasetAdmin, self).get_queryset(request)
        return qs.filter(
            Q(climate_module__in=["land_accounts", "coastal_changes"])
            | ~Q(climate_modules=[])
        )

    def get_fieldsets(self, request, obj=None):
        fieldsets = list(super().get_fieldsets(request, obj))
        result = []
        for name, data in fieldsets:
            if name == "Section":
                result.append((
                    "Display in modules",
                    {
                        "fields": ("display_in",),
                        "description": "Select where this dataset appears in Climate.",
                    },
                ))
                continue
            if name == "Map display":
                # Climate dashboard: no cyclone name (disaster-only)
                fields = tuple(f for f in data.get("fields", ()) if f != "cyclone_name")
                if fields:
                    result.append((name, {**data, "fields": fields}))
                continue
            result.append((name, data))
        return result

    def save_model(self, request, obj, form, change):
        if hasattr(form, "cleaned_data") and "display_in" in form.cleaned_data:
            obj.climate_modules = list(form.cleaned_data.get("display_in") or [])
        if obj.climate_modules:
            obj.climate_module = obj.climate_modules[0]
        else:
            obj.climate_module = None
        if not obj.cluster_id:
            obj.cluster = Cluster.objects.get_or_create(name="Land Accounts", defaults={"order": 100})[0]
        super().save_model(request, obj, form, change)

    @admin.display(description="Display in")
    def display_modules(self, obj):
        mods = getattr(obj, "climate_modules", None) or []
        if not mods and getattr(obj, "climate_module", None):
            mods = [obj.climate_module]
        labels = dict(CLIMATE_DISPLAY_MODULE_CHOICES)
        return ", ".join(labels.get(m, m) for m in mods) or "—"


def _climate_vector_dataset_queryset():
    """Vector datasets for Climate (Land Accounts, Coastal Changes)."""
    return VectorDataset.objects.filter(
        Q(climate_module__in=["land_accounts", "coastal_changes"])
        | ~Q(climate_modules=[])
    ).order_by("name")


@admin.register(ClimateVectorItem)
class ClimateVectorItemAdmin(gis_admin.GISModelAdmin, UnfoldModelAdmin):
    """Vector items for Climate datasets. Lists items, Add vector item, Import File (GeoJSON)."""

    list_display = [
        "id",
        "dataset",
        "location_display",
        "coords_display",
        "name",
        "attribute",
    ]
    list_editable = ["name", "attribute"]
    list_filter = ["dataset", "province", "area_council"]
    search_fields = ["id", "name", "attribute"]
    list_per_page = 50
    change_list_template = "admin/climate/climatevectoritem/change_list.html"

    @admin.display(description="Location")
    def location_display(self, obj):
        parts = []
        if obj.province:
            parts.append(str(obj.province.name))
        if obj.area_council:
            parts.append(str(obj.area_council.name))
        return " / ".join(parts) if parts else "—"

    @admin.display(description="Coords")
    def coords_display(self, obj):
        if obj.geometry:
            try:
                centroid = obj.geometry.centroid
                return f"{centroid.y:.4f}, {centroid.x:.4f}"
            except Exception:
                pass
        return "—"

    fieldsets = (
        (
            "Main info",
            {
                "fields": ("dataset", "name", "attribute"),
                "description": "Edit name and attribute to fix missing or incorrect data.",
            },
        ),
        ("Location", {"fields": ("province", "area_council")}),
        ("Geometry", {"fields": ("geometry",)}),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(dataset__in=_climate_vector_dataset_queryset())

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "dataset":
            kwargs["queryset"] = _climate_vector_dataset_queryset()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "import-file/",
                self.admin_site.admin_view(self.import_file),
                name="climate_climatevectoritem_import_file",
            ),
        ]
        return custom_urls + urls

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context["upload_file"] = reverse("admin:climate_climatevectoritem_import_file")
        return super().changelist_view(request, extra_context=extra_context)

    def import_file(self, request):
        """Import GeoJSON for Climate vector datasets. Multi-file with auto-match like Disaster."""
        upload_url = reverse("admin:climate_climatevectoritem_import_file")
        climate_datasets = _climate_vector_dataset_queryset()

        # Multi-file upload
        if request.method == "POST":
            try:
                file_count = int(request.POST.get("file_count", 0))
            except ValueError:
                file_count = 0

            if file_count > 0:
                pairs = []
                valid_ids = set(climate_datasets.values_list("id", flat=True))
                for i in range(file_count):
                    f_key = f"file_{i}"
                    ds_key = f"dataset_{i}"
                    uploaded_file = request.FILES.get(f_key)
                    dataset_id = request.POST.get(ds_key)
                    if uploaded_file and dataset_id:
                        fname = (uploaded_file.name or "").lower()
                        if fname.endswith(".geojson") or (
                            fname.endswith(".json") and "package" not in fname
                        ):
                            try:
                                did = int(dataset_id)
                                if did in valid_ids:
                                    dataset = VectorDataset.objects.get(pk=did)
                                    pairs.append((uploaded_file, dataset))
                            except (VectorDataset.DoesNotExist, ValueError):
                                pass

                if not pairs:
                    messages.error(
                        request,
                        "Please add at least one GeoJSON file and select a climate vector dataset for it.",
                    )
                else:
                    total_created = 0
                    total_errors = 0
                    first_error = None
                    for uploaded_file, dataset in pairs:
                        try:
                            created, errors, err = process_geojson_file_to_vector_items(
                                uploaded_file, dataset
                            )
                            total_created += created
                            total_errors += errors
                            if err and first_error is None:
                                first_error = err
                        except Exception as e:
                            messages.error(
                                request,
                                f"Error processing '{uploaded_file.name}': {str(e)}",
                            )
                    if total_created > 0:
                        messages.success(
                            request,
                            f"Successfully created {total_created} new records",
                        )
                    if total_errors > 0:
                        msg = f"Failed to create {total_errors} items."
                        if first_error:
                            msg += f" First error: {first_error}"
                        messages.warning(request, msg)
                return redirect(upload_url)

            # Legacy single-file form
            form = ClimateGeoJSONUploadForm(request.POST, request.FILES)
            if form.is_valid():
                uploaded_file = request.FILES.get("file")
                if not uploaded_file or not (
                    uploaded_file.name.lower().endswith(".geojson")
                    or (
                        uploaded_file.name.lower().endswith(".json")
                        and "package" not in uploaded_file.name.lower()
                    )
                ):
                    messages.error(request, "Please upload a GeoJSON file")
                    return redirect(upload_url)

                dataset = form.cleaned_data["dataset"]
                icon = (form.cleaned_data.get("icon") or "").strip()
                color = (form.cleaned_data.get("color") or "").strip()
                update_fields = []
                if icon:
                    dataset.icon = icon
                    update_fields.append("icon")
                if color:
                    dataset.color = color
                    update_fields.append("color")
                if update_fields:
                    dataset.save(update_fields=update_fields)

                try:
                    created_count, error_count, first_error = process_geojson_file_to_vector_items(
                        uploaded_file, dataset
                    )
                    if created_count > 0:
                        messages.success(
                            request,
                            f"Successfully created {created_count} new records",
                        )
                    if error_count > 0:
                        msg = f"Failed to create {error_count} items."
                        if first_error:
                            msg += f" First error: {first_error}"
                        messages.warning(request, msg)
                except Exception as e:
                    messages.error(request, f"Error processing GeoJSON: {str(e)}")
                return redirect("admin:climate_climatevectoritem_changelist")

        # GET: show multi-file import UI
        labels = dict(CLIMATE_DISPLAY_MODULE_CHOICES)
        datasets = []
        for ds in climate_datasets.select_related("cluster"):
            mods = getattr(ds, "climate_modules", None) or []
            if not mods and getattr(ds, "climate_module", None):
                mods = [ds.climate_module]
            parts = [labels.get(m, m) for m in mods]
            display = ds.name + (f" — {', '.join(parts)}" if parts else "")
            datasets.append({
                "id": ds.id,
                "name": ds.name,
                "type": ds.type or "",
                "cluster__name": ds.cluster.name if ds.cluster else "",
                "display": display,
            })

        context = {
            "opts": self.model._meta,
            "title": "Import GeoJSON Files (Climate)",
            "datasets_json": json.dumps(datasets),
            "upload_url": upload_url,
        }
        context.update(self.admin_site.each_context(request))
        return render(request, "admin/climate/geojson_import.html", context)
