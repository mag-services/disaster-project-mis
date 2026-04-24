"""Form-based admin views for Land Accounts (non-programmer friendly)."""

from django.contrib import messages
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse

from .constants import ACCOUNT_TYPES, CATEGORIES, PROVINCES
from .excel_utils import get_template_bytes, parse_import_file
from .utils import build_provinces_from_opening_closing


def _key(*parts):
    return "_".join(str(p).replace(" ", "_") for p in parts)


def build_data_from_request(request):
    """Build provinces JSON from form POST data."""
    provinces = {}
    for prov in PROVINCES:
        pa = {}
        for atype in ACCOUNT_TYPES:
            pa[atype] = {}
            for cat in CATEGORIES:
                key = f"pa_{_key(prov, cat, atype)}"
                try:
                    val = float(request.POST.get(key, 0) or 0)
                except (ValueError, TypeError):
                    val = 0
                pa[atype][cat] = val

        cm = {}
        for from_cat in CATEGORIES:
            cm[from_cat] = {}
            for to_cat in CATEGORIES:
                key = f"cm_{_key(prov, from_cat, to_cat)}"
                try:
                    val = float(request.POST.get(key, 0) or 0)
                except (ValueError, TypeError):
                    val = 0
                cm[from_cat][to_cat] = val

        provinces[prov] = {
            "physical_account": pa,
            "unit": "sqkm",
            "change_matrix": cm,
        }
    return {"provinces": provinces}


def list_land_accounts(request):
    """List view: table with Edit/Delete per row and Add button. Replaces default changelist."""
    from .models import LandAccountsData

    objects = list(LandAccountsData.objects.order_by("-updated_at"))
    for obj in objects:
        obj.provinces_count = len(obj.data.get("provinces", {}))
    context = {
        "title": "Land Accounts Data",
        "objects": objects,
        "opts": LandAccountsData._meta,
    }
    return render(request, "admin/land_accounts/list.html", context)


def _build_data_from_opening_closing_only(request):
    """Build provinces from form with only opening and closing; compute matrix."""
    provinces_input = {}
    for prov in PROVINCES:
        provinces_input[prov] = {}
        for cat in CATEGORIES:
            key_o = f"pa_{_key(prov, cat, 'opening')}"
            key_c = f"pa_{_key(prov, cat, 'closing')}"
            try:
                o = float(request.POST.get(key_o, 0) or 0)
                c = float(request.POST.get(key_c, 0) or 0)
            except (ValueError, TypeError):
                o = c = 0
            provinces_input[prov][cat] = {"opening": o, "closing": c}
    return {"provinces": build_provinces_from_opening_closing(provinces_input)}


def edit_land_accounts(request, object_id=None):
    """Form-based edit view for land accounts. Province tabs with tables."""
    from .models import LandAccountsData

    if object_id:
        obj = get_object_or_404(LandAccountsData, pk=object_id)
    else:
        obj = LandAccountsData.objects.first()
        if not obj:
            messages.warning(request, "No land accounts data. Run: ./manage.py load_land_accounts")
            return redirect("admin_land_accounts_list")

    simple_mode = request.GET.get("mode") == "simple"

    if request.method == "POST":
        obj.title = (request.POST.get("title") or "").strip()[:100]
        if request.POST.get("action") == "calculate":
            # Compute matrix from opening/closing, re-render with filled matrix
            data = _build_data_from_opening_closing_only(request)
            obj.data = data
            messages.success(request, "Change matrix computed from opening and closing.")
            # Fall through to render with new data (don't save yet)
        elif simple_mode:
            data = _build_data_from_opening_closing_only(request)
            obj.data = data
            obj.save()
            messages.success(request, "Land accounts saved (change matrix computed).")
            return redirect(reverse("admin_land_accounts_edit", args=[obj.pk]) + "?mode=simple")
        else:
            data = build_data_from_request(request)
            obj.data = data
            obj.save()
            messages.success(request, "Land accounts saved successfully.")
            return redirect("admin_land_accounts_edit", object_id=obj.pk)

    provinces_data = obj.data.get("provinces", {})

    def _get_pa(prov, cat, atype):
        pa = provinces_data.get(prov, {}).get("physical_account", {})
        return pa.get(atype, {}).get(cat, 0)

    def _get_cm(prov, from_cat, to_cat):
        cm = provinces_data.get(prov, {}).get("change_matrix", {})
        return cm.get(from_cat, {}).get(to_cat, 0)

    # Build pa_rows and cm_rows for template (no custom tags needed)
    pa_rows = []
    for prov in PROVINCES:
        for cat in CATEGORIES:
            cells = [
                {"name": f"pa_{_key(prov, cat, atype)}", "value": _get_pa(prov, cat, atype)}
                for atype in ACCOUNT_TYPES
            ]
            pa_rows.append({"prov": prov, "cat": cat, "cells": cells})

    cm_rows = []
    for prov in PROVINCES:
        for from_cat in CATEGORIES:
            cells = [
                {"name": f"cm_{_key(prov, from_cat, to_cat)}", "value": _get_cm(prov, from_cat, to_cat)}
                for to_cat in CATEGORIES
            ]
            cm_rows.append({"prov": prov, "from_cat": from_cat, "cells": cells})

    page_title = f"Edit Land Accounts: {obj.title}" if obj.title else "Edit Land Accounts"
    form_action = reverse("admin_land_accounts_edit", args=[obj.pk])
    if simple_mode:
        form_action += "?mode=simple"
    context = {
        "title": page_title,
        "object": obj,
        "provinces": PROVINCES,
        "categories": CATEGORIES,
        "account_types": ACCOUNT_TYPES,
        "pa_rows": pa_rows,
        "cm_rows": cm_rows,
        "simple_mode": simple_mode,
        "form_action": form_action,
        "opts": LandAccountsData._meta,
    }
    return render(request, "admin/land_accounts/edit_form.html", context)


def delete_land_accounts(request, object_id):
    """Delete a land accounts record."""
    from .models import LandAccountsData

    obj = get_object_or_404(LandAccountsData, pk=object_id)
    if request.method == "POST":
        obj.delete()
        messages.success(request, "Land accounts record deleted.")
        return redirect("admin_land_accounts_list")
    context = {
        "title": "Delete Land Accounts",
        "object": obj,
        "opts": LandAccountsData._meta,
    }
    return render(request, "admin/land_accounts/delete_confirm.html", context)


def _empty_provinces_data():
    """Build empty provinces structure with zeros."""
    provinces = {}
    for prov in PROVINCES:
        pa = {atype: {cat: 0 for cat in CATEGORIES} for atype in ACCOUNT_TYPES}
        cm = {fc: {tc: 0 for tc in CATEGORIES} for fc in CATEGORIES}
        provinces[prov] = {"physical_account": pa, "unit": "sqkm", "change_matrix": cm}
    return {"provinces": provinces}


def add_land_accounts(request):
    """Create a new land accounts record with empty data."""
    from .models import LandAccountsData

    if request.method == "POST":
        obj = LandAccountsData.objects.create(data=_empty_provinces_data())
        messages.success(request, "Land accounts record created. Edit data below.")
        return redirect("admin_land_accounts_edit", object_id=obj.pk)
    return redirect("admin_land_accounts_list")


def download_land_accounts_template(request):
    """Download Excel template for land accounts import."""
    data = get_template_bytes()
    response = HttpResponse(
        data,
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    response["Content-Disposition"] = 'attachment; filename="land_accounts_template.xlsx"'
    return response


def import_land_accounts(request):
    """Import land accounts from Excel (opening and closing only); compute change matrix."""
    from .models import LandAccountsData

    if request.method != "POST":
        return redirect("admin_land_accounts_list")

    f = request.FILES.get("file")
    if not f or not f.name.lower().endswith(".xlsx"):
        messages.error(request, "Please upload an Excel file (.xlsx).")
        return redirect("admin_land_accounts_list")

    try:
        f.seek(0)
        provinces_input = parse_import_file(f)
    except Exception as e:
        messages.error(request, f"Could not parse Excel file: {e}")
        return redirect("admin_land_accounts_list")

    data = {"provinces": build_provinces_from_opening_closing(provinces_input)}
    title = (request.POST.get("title") or "").strip()[:100] or "Imported"

    obj = LandAccountsData.objects.create(title=title, data=data)
    messages.success(request, "Land accounts imported from Excel (change matrix computed).")
    return redirect("admin_land_accounts_edit", object_id=obj.pk)
