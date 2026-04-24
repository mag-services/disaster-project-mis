import csv
import json
from io import TextIOWrapper

from adminsortable2.admin import SortableAdminMixin
from django import forms
from django.contrib.admin import SimpleListFilter
from django.db.models import Q
from django.contrib import messages
from django.contrib.gis import admin
from django.shortcuts import redirect, render
from django.utils import timezone
from django.urls import reverse
from django.utils.html import format_html
from django.urls import path
from unfold.admin import ModelAdmin as UnfoldModelAdmin

from .forms import GeoJSONUploadForm, IconPickerWidget, VectorDatasetAdminForm
from .widgets import VectorColorPickerWidget
from vbos.audit.models import AuditLog
from vbos.audit.signals import log_audit_action

from .models import (
    AreaCouncil,
    Cluster,
    CycloneEvent,
    DatasetPublicationStatus,
    DisasterDatasetTag,
    MapSavedWorkspace,
    PMTilesDataset,
    Province,
    RasterDataset,
    RasterFile,
    TabularDataset,
    TabularItem,
    VectorDataset,
    VectorItem,
)
from .utils import (
    CSVRow,
    clean_redundant_tabular_items,
    create_tabular_item,
    import_wide_format_csv,
    process_geojson_file_to_vector_items,
)

# RAP sector_family → (inline CSS, short label) for changelist badges — light surfaces
RAP_SECTOR_COLORS = {
    "education": ("background:#EBF3FE;color:#0C447C;border:1px solid #B5D4F4", "Education"),
    "energy": ("background:#FDF3E0;color:#633806;border:1px solid #F5C875", "Energy"),
    "food_security": ("background:#EAF6EE;color:#27500A;border:1px solid #9FE1CB", "Food Security"),
    "gender_protection": ("background:#FBF0F5;color:#72243E;border:1px solid #F4C0D1", "Gender & Prot."),
    "health": ("background:#FEECEA;color:#A32D2D;border:1px solid #F7C1C1", "Health"),
    "logistics": ("background:#EEEDFE;color:#3C3489;border:1px solid #CECBF6", "Logistics"),
    "shelter": ("background:#E1F5EE;color:#085041;border:1px solid #9FE1CB", "Shelter"),
    "telecom": ("background:#E6F1FB;color:#0C447C;border:1px solid #85B7EB", "Telecom"),
    "wash": ("background:#E1F5EE;color:#04342C;border:1px solid #5DCAA5", "WASH"),
    "qc": ("background:#F1EFE8;color:#444441;border:1px solid #D3D1C7", "QC"),
    "hazard": ("background:#FDF3E0;color:#712B13;border:1px solid #F0997B", "Hazard"),
}

# Cat intensity → (text color, background, border) for light badges
INTENSITY_BADGE_STYLES = {
    2: ("#185FA5", "#E6F1FB", "#85B7EB"),
    3: ("#633806", "#FDF3E0", "#F5C875"),
    4: ("#A32D2D", "#FEECEA", "#F7C1C1"),
    5: ("#791F1F", "#FEECEA", "#F7C1C1"),
}


class DatasetPublicationAdminMixin:
    """Bulk publish/archive + audit trail for dataset catalog models."""

    @admin.action(description="Publish selected")
    def publish_selected_datasets(self, request, queryset):
        user = request.user
        now = timezone.now()
        count = 0
        for obj in queryset:
            old = obj.publication_status
            if old == DatasetPublicationStatus.PUBLISHED:
                continue
            old_str = str(old)
            old_pb = obj.published_by_id
            old_pa = obj.published_at
            obj.publication_status = DatasetPublicationStatus.PUBLISHED
            obj.published_by = user
            obj.published_at = now
            obj.updated_by = user
            obj.save(
                update_fields=[
                    "publication_status",
                    "published_by",
                    "published_at",
                    "updated",
                    "updated_by",
                ]
            )
            log_audit_action(
                action=AuditLog.ACTION_UPDATE,
                instance=obj,
                user=user,
                field_changes={
                    "publication_status": (old_str, DatasetPublicationStatus.PUBLISHED),
                    "published_by": (str(old_pb) if old_pb is not None else None, str(user.pk)),
                    "published_at": (
                        str(old_pa) if old_pa is not None else None,
                        str(now),
                    ),
                },
                request=request,
            )
            count += 1
        self.message_user(
            request,
            f"Published {count} dataset(s).",
            level=messages.SUCCESS,
        )

    @admin.action(description="Archive selected")
    def archive_selected_datasets(self, request, queryset):
        user = request.user
        count = 0
        for obj in queryset:
            old = obj.publication_status
            if old == DatasetPublicationStatus.ARCHIVED:
                continue
            old_str = str(old)
            obj.publication_status = DatasetPublicationStatus.ARCHIVED
            obj.updated_by = user
            obj.save(update_fields=["publication_status", "updated", "updated_by"])
            log_audit_action(
                action=AuditLog.ACTION_UPDATE,
                instance=obj,
                user=user,
                field_changes={
                    "publication_status": (old_str, DatasetPublicationStatus.ARCHIVED),
                },
                request=request,
            )
            count += 1
        self.message_user(
            request,
            f"Archived {count} dataset(s).",
            level=messages.SUCCESS,
        )


class DatasetAdminAuthorshipMixin:
    """Set created_by / updated_by from the admin user on save."""

    def get_readonly_fields(self, request, obj=None):
        base = list(super().get_readonly_fields(request, obj))
        for f in ("created_by", "updated_by"):
            if f not in base:
                base.append(f)
        return base

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


class YearListFilter(SimpleListFilter):
    title = "Year"
    parameter_name = "year"

    def lookups(self, request, model_admin):
        years = (
            TabularItem.objects.filter(date__isnull=False)
            .dates("date", "year", order="DESC")
        )
        return [(d.year, str(d.year)) for d in years]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(date__year=self.value())
        return queryset


@admin.register(Cluster)
class ClusterAdmin(SortableAdminMixin, UnfoldModelAdmin):
    list_display = ["id", "name"]
    search_fields = ["name"]


@admin.register(CycloneEvent)
class CycloneEventAdmin(UnfoldModelAdmin):
    list_display = ["id", "name", "slug", "season_year", "is_archived", "updated_at"]
    list_filter = ["season_year", "is_archived"]
    search_fields = ["name", "slug", "notes"]
    prepopulated_fields = {"slug": ("name", "season_year")}


@admin.register(DisasterDatasetTag)
class DisasterDatasetTagAdmin(UnfoldModelAdmin):
    """Names matched against dataset names for the Disaster overlay (cluster=disaster)."""

    list_display = ["id", "name", "order"]
    list_editable = ["order"]
    ordering = ["order", "name"]
    search_fields = ["name"]


class RasterFileAdmin(UnfoldModelAdmin):
    """Base admin for RasterFile. Registered in climate app as ClimateRasterFileAdmin."""
    list_display = ["id", "name", "created", "file"]


class RasterDatasetAdmin(
    DatasetPublicationAdminMixin, DatasetAdminAuthorshipMixin, UnfoldModelAdmin
):
    """Base admin for RasterDataset. Registered in climate app as ClimateRasterDatasetAdmin."""
    list_display = [
        "id",
        "name",
        "type",
        "publication_status",
        "is_land_cover",
        "updated",
        "filename_id",
    ]
    list_filter = ["type", "is_land_cover", "publication_status", "owning_organisation"]
    list_editable = ["is_land_cover"]
    actions = ["publish_selected_datasets", "archive_selected_datasets"]
    fieldsets = (
        (
            None,
            {
                "fields": ("name", "type", "description", "source"),
                "description": "Raster datasets are Climate-mode only. They appear in the Land cover tab regardless of selected cluster.",
            },
        ),
        (
            "Publication",
            {
                "fields": (
                    "owning_organisation",
                    "publication_status",
                    "published_by",
                    "published_at",
                ),
                "description": "Draft / Published / Archived. New datasets default to Draft; use Publish to expose them in the API. "
                "Owning organisation restricts the catalog when VBOS_ORGANISATION_SCOPING is enabled.",
            },
        ),
        (
            "Record",
            {
                "fields": ("created_by", "updated_by"),
                "description": "Who created and last edited this row in admin.",
            },
        ),
        (
            "Raster / TiTiler",
            {
                "fields": ("filename_id", "titiler_url_params", "is_land_cover"),
                "description": "filename_id is used for VRT path: {MEDIA_URL}/{filename_id}_{year}.vrt. "
                "Check is_land_cover for categorical land cover rasters (Climate mode).",
            },
        ),
        (
            "Precomputed tiles",
            {
                "fields": ("precomputed_tile_url",),
                "description": "Optional URL template for precomputed raster+tabular tiles. Use {z}, {x}, {y}, {year}. When set, used instead of TiTiler.",
            },
        ),
    )


@admin.register(PMTilesDataset)
class PMTilesDatasetAdmin(
    DatasetPublicationAdminMixin, DatasetAdminAuthorshipMixin, UnfoldModelAdmin
):
    def get_queryset(self, request):
        from django.db.models import Q
        qs = super().get_queryset(request)
        return qs.filter(Q(climate_module__isnull=True) | Q(climate_module=""))
    list_display = [
        "id",
        "name",
        "cluster",
        "type",
        "publication_status",
        "climate_module",
        "updated",
    ]
    list_filter = ["cluster", "type", "climate_module", "publication_status", "owning_organisation"]
    list_editable = ["climate_module"]
    actions = ["publish_selected_datasets", "archive_selected_datasets"]

    fieldsets = (
        (None, {"fields": ("name", "type", "description", "source", "cluster")}),
        (
            "Publication",
            {
                "fields": (
                    "owning_organisation",
                    "publication_status",
                    "published_by",
                    "published_at",
                ),
            },
        ),
        (
            "Record",
            {
                "fields": ("created_by", "updated_by"),
            },
        ),
        (
            "Section",
            {
                "fields": ("climate_module",),
                "description": "Disaster only = show in Disaster section. Land Accounts / Coastal Changes = show in Climate under that module.",
            },
        ),
        (
            "PMTiles",
            {"fields": ("url", "source_layer", "cyclone_name", "intensity_data")},
        ),
    )

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if "intensity_data" in form.base_fields:
            form.base_fields["intensity_data"].help_text = (
                "For cyclone datasets: JSON array of {acname, Province, Intensity, intensity_color}. "
                "Export from RAP GeoJSON features.properties."
            )
        return form


@admin.register(VectorDataset)
class VectorDatasetAdmin(
    DatasetPublicationAdminMixin, DatasetAdminAuthorshipMixin, UnfoldModelAdmin
):
    form = VectorDatasetAdminForm

    def get_queryset(self, request):
        from django.db.models import Q
        qs = super().get_queryset(request)
        return qs.filter(Q(climate_module__isnull=True) | Q(climate_module=""))
    list_display = [
        "id",
        "name",
        "cluster",
        "type",
        "publication_status",
        "climate_module",
        "icon",
        "color",
        "updated",
    ]
    list_filter = ["cluster", "type", "climate_module", "publication_status", "owning_organisation"]
    # color uses VectorColorPickerWidget (not compatible with list_editable)
    list_editable = ["climate_module", "icon"]
    actions = ["publish_selected_datasets", "archive_selected_datasets"]
    change_form_template = "admin/datasets/vectordataset/change_form.html"
    readonly_fields = ["view_on_map_link"]
    # `created`/`updated` are non-editable model fields.
    # Exclude them to avoid FieldError when Unfold builds fieldsets.
    exclude = ("created", "updated")

    fieldsets = (
        (None, {"fields": ("name", "type", "description", "source", "cluster")}),
        (
            "Publication",
            {
                "fields": (
                    "owning_organisation",
                    "publication_status",
                    "published_by",
                    "published_at",
                ),
            },
        ),
        (
            "Record",
            {
                "fields": ("created_by", "updated_by"),
            },
        ),
        (
            "Section",
            {
                "fields": ("climate_module",),
                "description": "Disaster only = show in Disaster section. Land Accounts / Coastal Changes = show in Climate under that module.",
            },
        ),
        (
            "Map display",
            {
                "fields": ("icon", "color", "cyclone_name", "popup_property_keys", "view_on_map_link"),
                "description": (
                    "Map popup: tick the properties to show on the live map (keys come from this dataset’s vector items). "
                    "Leave all unchecked to show every property. Order in the list is top-to-bottom in the popup."
                ),
            },
        ),
    )

    @admin.display(description="View on map")
    def view_on_map_link(self, obj):
        province = getattr(obj, "province", None)
        layers = f"v{obj.pk}"
        url = f"/app/live-map?layers={layers}"
        if province is not None:
            url += f"&province={province.pk}"
        return format_html(
            '<a href="{}" target="_blank" style="font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;font-size:11px;color:#185FA5;text-decoration:none;">Open in Live Map →</a>',
            url,
        )

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        if db_field.name == "icon":
            kwargs["widget"] = IconPickerWidget
        if db_field.name == "color":
            kwargs["widget"] = VectorColorPickerWidget
        return super().formfield_for_dbfield(db_field, request, **kwargs)


@admin.register(VectorItem)
class VectorItemAdmin(admin.GISModelAdmin, UnfoldModelAdmin):
    """Vector items for Disaster datasets only. Climate items are under Climate > Vector Items."""

    def get_queryset(self, request):
        from django.db.models import Q
        qs = super().get_queryset(request)
        # Exclude items from climate datasets (Land Accounts, Coastal Changes)
        return qs.exclude(
            Q(dataset__climate_module__in=["land_accounts", "coastal_changes"])
            | ~Q(dataset__climate_modules=[])  # climate_modules has items
        )

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

    @admin.display(description="Location")
    def location_display(self, obj):
        """Province / Area council - match this to the map popup to identify which school."""
        parts = []
        if obj.province:
            parts.append(str(obj.province.name))
        if obj.area_council:
            parts.append(str(obj.area_council.name))
        return " / ".join(parts) if parts else "—"

    @admin.display(description="Coords")
    def coords_display(self, obj):
        """Lat, lng - helps match to the map when multiple schools share the same area."""
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

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "upload-file/",
                self.admin_site.admin_view(self.import_file),
                name="datasets_vectoritem_import_file",
            ),
        ]
        return custom_urls + urls

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context["upload_file"] = reverse("admin:datasets_vectoritem_import_file")
        return super().changelist_view(request, extra_context=extra_context)

    def import_file(self, request):
        upload_url = reverse("admin:datasets_vectoritem_import_file")

        # Multi-file upload (like tabular CSV import)
        if request.method == "POST":
            try:
                file_count = int(request.POST.get("file_count", 0))
            except ValueError:
                file_count = 0

            if file_count > 0:
                pairs = []
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
                                dataset = VectorDataset.objects.get(pk=int(dataset_id))
                                pairs.append((uploaded_file, dataset))
                            except (VectorDataset.DoesNotExist, ValueError):
                                pass

                if not pairs:
                    messages.error(
                        request,
                        "Please add at least one GeoJSON file and select a vector dataset for it.",
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

            # Legacy single-file form (GeoJSONUploadForm)
            form = GeoJSONUploadForm(request.POST, request.FILES)
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
                return redirect(upload_url)

        # GET: show multi-file import UI
        datasets = list(
            VectorDataset.objects.select_related("cluster").values(
                "id", "name", "type", "cluster__name"
            )
        )
        for d in datasets:
            cluster = d.get("cluster__name") or ""
            ds_type = d.get("type") or ""
            d["display"] = (
                f"{d['name']} - {cluster} / {ds_type}" if cluster else d["name"]
            )

        context = {
            "opts": self.model._meta,
            "title": "Import GeoJSON Files",
            "datasets_json": json.dumps(datasets),
            "upload_url": upload_url,
        }
        context.update(self.admin_site.each_context(request))
        return render(request, "admin/geojson_import.html", context)


@admin.register(TabularDataset)
class TabularDatasetAdmin(
    DatasetPublicationAdminMixin, DatasetAdminAuthorshipMixin, UnfoldModelAdmin
):
    list_display = [
        "id",
        "name",
        "cluster",
        "type",
        "publication_status",
        "rap_sector_badge",
        "rap_batch_link",
        "updated",
    ]
    list_filter = [
        "cluster",
        "type",
        "cyclone_event",
        "rap_sector_family",
        "rap_batch",
        "publication_status",
        "owning_organisation",
    ]
    search_fields = ["name", "description", "rap_sector_family"]
    autocomplete_fields = ["cyclone_event", "rap_batch"]
    actions = [
        "clean_redundant_items",
        "publish_selected_datasets",
        "archive_selected_datasets",
    ]
    readonly_fields = ["view_on_map_link"]
    # `created`/`updated` are non-editable model fields.
    # Exclude them to avoid FieldError when Unfold builds fieldsets.
    exclude = ("created", "updated")
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "name",
                    "type",
                    "description",
                    "source",
                    "cluster",
                    "unit",
                    "cyclone_event",
                    "rap_batch",
                    "rap_sector_family",
                ),
                "description": (
                    "For Cyclone RAP output types (estimated damage, resources needed, "
                    "financial damage), set Cyclone event before publishing. "
                    "These three types are produced exclusively by the cyclone RAP tool."
                ),
            },
        ),
        (
            "Publication",
            {
                "fields": (
                    "owning_organisation",
                    "publication_status",
                    "published_by",
                    "published_at",
                ),
            },
        ),
        ("Record", {"fields": ("created_by", "updated_by")}),
        ("Map", {"fields": ("view_on_map_link",)}),
    )

    @admin.display(description="View on map")
    def view_on_map_link(self, obj):
        province = getattr(obj, "province", None)
        layers = f"t{obj.pk}"
        url = f"/app/live-map?layers={layers}"
        if province is not None:
            url += f"&province={province.pk}"
        return format_html(
            '<a href="{}" target="_blank" style="font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;font-size:11px;color:#185FA5;text-decoration:none;">Open in Live Map →</a>',
            url,
        )

    @admin.display(description="RAP Batch")
    def rap_batch_link(self, obj):
        batch = getattr(obj, "rap_batch", None)
        if batch:
            url = reverse("admin:rap_import_rapimportbatch_change", args=[batch.pk])
            return format_html(
                '<a href="{}" style="font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;'
                'font-size:10px;color:#378ADD;">{}</a>',
                url,
                batch.batch_ref,
            )
        return format_html(
            '<span style="color:#9AA5B8;font-size:10px;">Manual upload</span>'
        )

    @admin.display(description="RAP sector")
    def rap_sector_badge(self, obj):
        fam = getattr(obj, "rap_sector_family", None) or ""
        if not fam.strip():
            return format_html('<span style="color:#9AA5B8;font-size:10px;">—</span>')
        style_label = RAP_SECTOR_COLORS.get(
            fam, ("background:#F8F9FB;color:#4A5568;border:1px solid #E2E6EE", fam)
        )
        css, label = style_label
        return format_html(
            '<span style="font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;font-size:9px;'
            "padding:2px 6px;border-radius:3px;text-transform:uppercase;"
            'letter-spacing:.04em;{}">{}</span>',
            css,
            label,
        )

    @admin.action(description="Clean redundant TabularItems for dataset")
    def clean_redundant_items(self, request, queryset):
        for dataset in queryset:
            clean_redundant_tabular_items(dataset)

        dataset_names = list(queryset.values_list("name", flat=True))
        if len(dataset_names) == 1:
            message = f"Cleaned redundant values for: {dataset_names[0]}."
        else:
            # Join all but last with commas, then add "and" before last item
            message = f"Cleaned redundant values for: {', '.join(dataset_names[:-1])} and {dataset_names[-1]}."

        messages.success(request, message)


@admin.register(TabularItem)
class TabularItemAdmin(UnfoldModelAdmin):
    list_display = [
        "id",
        "dataset",
        "province",
        "area_council",
        "intensity_badge",
        "attribute",
        "value",
        "year_column",
    ]
    list_filter = [
        "dataset__cluster",
        "dataset",
        YearListFilter,
        "province",
        "area_council",
        "attribute",
    ]

    @admin.display(description="Cat.")
    def intensity_badge(self, obj):
        intensity = getattr(obj, "intensity", None)
        if intensity is None and isinstance(obj.metadata, dict):
            raw = obj.metadata.get("intensity")
            if raw is not None and raw != "":
                try:
                    intensity = int(raw)
                except (TypeError, ValueError):
                    intensity = None
        if intensity is None:
            return "—"
        color, bg, border = INTENSITY_BADGE_STYLES.get(
            int(intensity), ("#4A5568", "#F8F9FB", "#E2E6EE")
        )
        return format_html(
            '<span style="font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;font-size:11px;'
            'font-weight:500;color:{};background:{};padding:2px 8px;border-radius:3px;'
            'border:1px solid {};">Cat {}</span>',
            color,
            bg,
            border,
            intensity,
        )

    @admin.display(description="Year")
    def year_column(self, obj):
        return obj.date.year if obj.date else None

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "upload-file/",
                self.admin_site.admin_view(self.import_file),
                name="datasets_tabularitem_import_file",
            ),
        ]
        return custom_urls + urls

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context["upload_file"] = reverse("admin:datasets_tabularitem_import_file")
        return super().changelist_view(request, extra_context=extra_context)

    def import_file(self, request):
        upload_url = reverse("admin:datasets_tabularitem_import_file")
        datasets = list(
            TabularDataset.objects.select_related("cluster").values(
                "id", "name", "type", "cluster__name"
            )
        )
        for d in datasets:
            cluster = d.get("cluster__name") or ""
            ds_type = d.get("type") or ""
            d["display"] = f"{d['name']} - {cluster} / {ds_type}" if cluster else d["name"]

        if request.method == "POST":
            pairs = []
            format_style = request.POST.get("format_style", "long")
            year = int(request.POST.get("year") or 2024)
            try:
                file_count = int(request.POST.get("file_count", 0))
            except ValueError:
                file_count = 0

            for i in range(file_count):
                f_key = f"file_{i}"
                ds_key = f"dataset_{i}"
                uploaded_file = request.FILES.get(f_key)
                dataset_id = request.POST.get(ds_key)
                if uploaded_file and dataset_id:
                    try:
                        dataset = TabularDataset.objects.get(pk=int(dataset_id))
                        pairs.append((uploaded_file, dataset))
                    except (TabularDataset.DoesNotExist, ValueError):
                        pass

            if not pairs:
                messages.error(
                    request,
                    "Please add at least one file and select a dataset for it.",
                )
            else:
                total_created = 0
                total_errors = 0
                first_error = None
                for uploaded_file, dataset in pairs:
                    if not uploaded_file.name.endswith(".csv"):
                        messages.error(
                            request,
                            f"'{uploaded_file.name}' is not a CSV file. "
                            "Only CSV files are accepted.",
                        )
                        continue
                    try:
                        decoded_file = TextIOWrapper(
                            uploaded_file.file, encoding="utf-8"
                        )
                        reader = csv.DictReader(decoded_file)
                        created_count = 0
                        error_count = 0
                        if format_style == "wide":
                            created_count, error_count, err = (
                                import_wide_format_csv(reader, dataset, year)
                            )
                            if err and first_error is None:
                                first_error = err
                        else:
                            for row in reader:
                                try:
                                    csv_row = CSVRow(row)
                                    create_tabular_item(csv_row, dataset)
                                    created_count += 1
                                except Exception as e:
                                    error_count += 1
                                    if first_error is None:
                                        first_error = str(e)
                        total_created += created_count
                        total_errors += error_count
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
                if pairs:
                    return redirect(upload_url)

        context = {
            "opts": self.model._meta,
            "title": "Import CSV Files",
            "datasets_json": json.dumps(datasets),
            "upload_url": upload_url,
        }
        context.update(self.admin_site.each_context(request))
        return render(request, "admin/csv_import.html", context)


@admin.register(MapSavedWorkspace)
class MapSavedWorkspaceAdmin(UnfoldModelAdmin):
    list_display = ("id", "name", "user", "updated_at")
    list_filter = ("updated_at",)
    search_fields = ("name", "user__username")
    readonly_fields = ("created_at", "updated_at", "payload")
    ordering = ("-updated_at",)
