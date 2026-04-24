"""Form-based admin views for Coastal Changes (non-programmer friendly)."""

from django.contrib import messages
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse

from .constants import DEFAULT_YEARS, PROVINCES
from .excel_utils import get_template_bytes, parse_import_file


def _key(prov: str, year: str) -> str:
    return f"{prov.replace(' ', '_')}_{year}"


def build_data_from_request(request):
    """Build provinces JSON from form POST data."""
    provinces = {}
    for prov in PROVINCES:
        provinces[prov] = {}
        for yr in DEFAULT_YEARS:
            key = f"val_{_key(prov, yr)}"
            try:
                val = float(request.POST.get(key, 0) or 0)
            except (ValueError, TypeError):
                val = 0
            provinces[prov][yr] = val
    return {"provinces": provinces}


def list_coastal_changes(request):
    """List view: table with Edit/Delete per row and Add button."""
    from .models import CoastalChangesData

    objects = list(CoastalChangesData.objects.order_by("-updated_at"))
    for obj in objects:
        obj.provinces_count = len(obj.data.get("provinces", {}))
    context = {
        "title": "Coastal Changes Data",
        "objects": objects,
        "opts": CoastalChangesData._meta,
    }
    return render(request, "admin/coastal_changes/list.html", context)


def edit_coastal_changes(request, object_id=None):
    """Form-based edit view for coastal changes."""
    from .models import CoastalChangesData

    if object_id:
        obj = get_object_or_404(CoastalChangesData, pk=object_id)
    else:
        obj = CoastalChangesData.objects.first()
        if not obj:
            messages.warning(request, "No coastal changes data. Click Add to create one.")
            return redirect("admin_coastal_changes_list")

    if request.method == "POST":
        obj.title = (request.POST.get("title") or "").strip()[:100]
        data = build_data_from_request(request)
        obj.data = data
        obj.save()
        messages.success(request, "Coastal changes saved successfully.")
        return redirect("admin_coastal_changes_edit", object_id=obj.pk)

    provinces_data = obj.data.get("provinces", {})

    def _get_val(prov: str, yr: str):
        return provinces_data.get(prov, {}).get(yr, 0)

    rows = []
    for prov in PROVINCES:
        for yr in DEFAULT_YEARS:
            rows.append({
                "prov": prov,
                "year": yr,
                "name": f"val_{_key(prov, yr)}",
                "value": _get_val(prov, yr),
            })

    page_title = f"Edit Coastal Changes: {obj.title}" if obj.title else "Edit Coastal Changes"
    context = {
        "title": page_title,
        "object": obj,
        "provinces": PROVINCES,
        "years": DEFAULT_YEARS,
        "rows": rows,
        "form_action": reverse("admin_coastal_changes_edit", args=[obj.pk]),
        "opts": CoastalChangesData._meta,
    }
    return render(request, "admin/coastal_changes/edit_form.html", context)


def delete_coastal_changes(request, object_id):
    """Delete a coastal changes record."""
    from .models import CoastalChangesData

    obj = get_object_or_404(CoastalChangesData, pk=object_id)
    if request.method == "POST":
        obj.delete()
        messages.success(request, "Coastal changes record deleted.")
        return redirect("admin_coastal_changes_list")
    context = {
        "title": "Delete Coastal Changes",
        "object": obj,
        "opts": CoastalChangesData._meta,
    }
    return render(request, "admin/coastal_changes/delete_confirm.html", context)


def _empty_provinces_data():
    """Build empty provinces structure with zeros."""
    provinces = {prov: {yr: 0 for yr in DEFAULT_YEARS} for prov in PROVINCES}
    return {"provinces": provinces}


def add_coastal_changes(request):
    """Create a new coastal changes record with empty data."""
    from .models import CoastalChangesData

    if request.method == "POST":
        obj = CoastalChangesData.objects.create(data=_empty_provinces_data())
        messages.success(request, "Coastal changes record created. Edit data below.")
        return redirect("admin_coastal_changes_edit", object_id=obj.pk)
    return redirect("admin_coastal_changes_list")


def download_coastal_changes_template(request):
    """Download Excel template for coastal changes import."""
    data = get_template_bytes()
    response = HttpResponse(
        data,
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    response["Content-Disposition"] = 'attachment; filename="coastal_changes_template.xlsx"'
    return response


def import_coastal_changes(request):
    """Import coastal changes from Excel."""
    from .models import CoastalChangesData

    if request.method != "POST":
        return redirect("admin_coastal_changes_list")

    f = request.FILES.get("file")
    if not f or not f.name.lower().endswith(".xlsx"):
        messages.error(request, "Please upload an Excel file (.xlsx).")
        return redirect("admin_coastal_changes_list")

    try:
        f.seek(0)
        data = parse_import_file(f)
    except Exception as e:
        messages.error(request, f"Could not parse Excel file: {e}")
        return redirect("admin_coastal_changes_list")

    title = (request.POST.get("title") or "").strip()[:100] or "Imported"
    obj = CoastalChangesData.objects.create(title=title, data=data)
    messages.success(request, "Coastal changes imported from Excel.")
    return redirect("admin_coastal_changes_edit", object_id=obj.pk)
