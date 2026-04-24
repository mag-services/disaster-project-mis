"""
Climate admin dashboard: one CLIMATE section with sub-modules.
Each module (Land Accounts, Coastal Changes, etc.) shows Data, PMTiles, Vector.
Separate GeoJSON import for Climate (no cluster-related info).
"""
import json
from io import TextIOWrapper

from django.db.models import Q
from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.gis.geos.geometry import GEOSGeometry
from django.shortcuts import redirect, render
from django.urls import reverse

from vbos.datasets.models import AreaCouncil, Province, VectorDataset, VectorItem
from vbos.datasets.utils import GeoJSONProperties

from .forms import ClimateGeoJSONUploadForm

# Module config: (id, label, has_models)
# has_models=True means we have Data, PMTiles, Vector for this module
CLIMATE_MODULES = [
    ("land_accounts", "Land Accounts", True),
    ("coastal_changes", "Coastal Changes", True),
    ("flood_risk", "Assessing Flood Risk from Past Weather", False),
    ("indicators", "Climate indicators", False),
    ("marine_heat", "Marine heat waves", False),
    ("coral_reef", "Coral reef mapping", False),
    ("soil_health", "Soil health", False),
]


def _land_accounts_links(request):
    """Land Accounts: Data only. PMTiles and Vector are under Climate section."""
    return [
        {
            "label": "Land Accounts Data",
            "add_url": reverse("admin_land_accounts_add"),
            "change_url": reverse("admin_land_accounts_list"),
        },
    ]


def _coastal_changes_links(request):
    """Coastal Changes: Data, Vector (Rates of Change), PMTiles."""
    return [
        {
            "label": "Coastal Changes Data",
            "add_url": reverse("admin_coastal_changes_add"),
            "change_url": reverse("admin_coastal_changes_list"),
        },
        {
            "label": "Coastal Changes Vector (e.g. Rates of Change)",
            "add_url": reverse("admin:coastal_changes_coastalchangesvectordataset_add"),
            "change_url": reverse("admin:coastal_changes_coastalchangesvectordataset_changelist"),
        },
        {
            "label": "Coastal Changes PMTiles",
            "add_url": reverse("admin:coastal_changes_coastalchangespmtilesdataset_add"),
            "change_url": reverse("admin:coastal_changes_coastalchangespmtilesdataset_changelist"),
        },
    ]


MODULE_LINKS = {
    "land_accounts": _land_accounts_links,
    "coastal_changes": _coastal_changes_links,
}


@staff_member_required
def climate_dashboard(request):
    """Main Climate dashboard: list of modules (Land Accounts, Coastal Changes, etc.)."""
    modules = []
    for module_id, label, has_models in CLIMATE_MODULES:
        modules.append({
            "id": module_id,
            "label": label,
            "has_models": has_models,
            "url": reverse(f"admin_climate_module_{module_id}") if has_models and module_id in ("land_accounts", "coastal_changes") else None,
        })
    rap_qc_available = False
    rap_qc_batch = None
    try:
        from vbos.rap_import.models import RAPImportFile

        latest_qc = (
            RAPImportFile.objects.filter(sector_family="qc", status="ok")
            .select_related("batch")
            .order_by("-uploaded_at")
            .first()
        )
        if latest_qc is not None:
            rap_qc_available = True
            rap_qc_batch = latest_qc.batch
    except Exception:
        pass

    context = {
        "title": "Climate",
        "modules": modules,
        "site_header": "VBoS MIS",
        "site_title": "Climate",
        "rap_qc_available": rap_qc_available,
        "rap_qc_batch": rap_qc_batch,
    }
    return render(request, "admin/climate/dashboard.html", context)


@staff_member_required
def climate_import_geojson(request):
    """Import GeoJSON for Climate vector datasets only. No cluster info."""
    if request.method == "POST":
        form = ClimateGeoJSONUploadForm(request.POST, request.FILES)
        if form.is_valid():
            uploaded_file = request.FILES["file"]
            if not uploaded_file.name.endswith(".geojson"):
                messages.error(request, "Please upload a GeoJSON file")
                return redirect("admin_climate_import_geojson")

            try:
                dataset = form.cleaned_data["dataset"]
                mods = getattr(dataset, "climate_modules", None) or []
                cm = getattr(dataset, "climate_module", None)
                if not mods and cm not in ("land_accounts", "coastal_changes"):
                    messages.error(request, "Invalid dataset for Climate import")
                    return redirect("admin_climate_import_geojson")

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

                decoded = TextIOWrapper(uploaded_file.file, encoding="utf-8")
                geojson_content = json.loads(decoded.read())

                created_count = 0
                error_count = 0
                first_error = None
                for item in geojson_content.get("features", []):
                    props = item.get("properties") or {}
                    metadata = GeoJSONProperties(props.copy())
                    try:
                        province_name = str(metadata.province or "").strip()
                        province = (
                            Province.objects.filter(name__iexact=province_name).first()
                            if province_name
                            else None
                        )
                        ac_name = str(metadata.area_council or "").strip()
                        area_council = (
                            AreaCouncil.objects.filter(name__iexact=ac_name).first()
                            if ac_name
                            else None
                        )
                        attribute = (str(metadata.attribute or "").strip() or None)
                        name = str(metadata.name or "").strip() or None
                        ref = str(metadata.ref or "").strip() or None
                        if ref and len(ref) > 50:
                            ref = ref[:50]

                        geom = item.get("geometry")
                        if not geom:
                            raise ValueError("Feature has no geometry")

                        geos_geom = GEOSGeometry(json.dumps(geom))
                        if geos_geom.geom_type in ("Polygon", "MultiPolygon"):
                            try:
                                n = geos_geom.num_coords
                            except (AttributeError, TypeError):
                                n = 0
                            if n > 500:
                                geos_geom = geos_geom.simplify(
                                    tolerance=0.01, preserve_topology=True
                                )

                        VectorItem.objects.create(
                            dataset=dataset,
                            metadata=metadata.properties,
                            name=name,
                            ref=ref,
                            attribute=attribute,
                            province=province,
                            area_council=area_council,
                            geometry=geos_geom,
                        )
                        created_count += 1
                    except Exception as e:
                        error_count += 1
                        if first_error is None:
                            first_error = str(e)

                if created_count > 0:
                    messages.success(
                        request, f"Successfully created {created_count} new records"
                    )
                if error_count > 0:
                    msg = f"Failed to create {error_count} items."
                    if first_error:
                        msg += f" First error: {first_error}"
                    messages.warning(request, msg)

            except Exception as e:
                messages.error(request, f"Error processing GeoJSON: {str(e)}")

            return redirect("admin_climate_import_geojson")
    else:
        dataset_id = request.GET.get("dataset")
        initial = {}
        if dataset_id:
            try:
                ds = VectorDataset.objects.filter(
                    pk=int(dataset_id),
                ).filter(
                    Q(climate_module__in=["land_accounts", "coastal_changes"])
                    | ~Q(climate_modules=[])
                ).get()
                initial["dataset"] = ds
            except (ValueError, VectorDataset.DoesNotExist):
                pass
        form = ClimateGeoJSONUploadForm(initial=initial)

    dataset_meta = {
        str(d.id): {"icon": d.icon or "", "color": d.color or ""}
        for d in VectorDataset.objects.filter(
            Q(climate_module__in=["land_accounts", "coastal_changes"])
            | ~Q(climate_modules=[])
        ).only("id", "icon", "color")
    }

    context = {
        "form": form,
        "title": "Import GeoJSON (Climate)",
        "site_header": "VBoS MIS",
        "site_title": "Climate",
        "dataset_meta_json": json.dumps(dataset_meta),
    }
    return render(request, "admin/climate/import_geojson.html", context)


@staff_member_required
def climate_module_detail(request, module_id):
    """Module detail: Data, PMTiles, Vector for the selected module."""
    if module_id not in MODULE_LINKS:
        from django.http import HttpResponseNotFound
        return HttpResponseNotFound("Module not found")

    links = MODULE_LINKS[module_id](request)
    module_label = next((m[1] for m in CLIMATE_MODULES if m[0] == module_id), module_id)

    context = {
        "title": module_label,
        "module_label": module_label,
        "links": links,
        "site_header": "VBoS MIS",
        "site_title": "Climate",
    }
    return render(request, "admin/climate/module_detail.html", context)
