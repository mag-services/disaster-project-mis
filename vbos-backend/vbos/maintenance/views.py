"""Admin views for backup and restore."""
from django.contrib import admin
from django.contrib import messages
from django.http import HttpResponse
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.http import require_http_methods

from .backup_restore import create_backup_zip, restore_from_upload, restore_from_zip
from .constants import BACKUP_CATEGORIES
from .forms import BackupConfigForm, RestoreForm
from .models import BackupLog


def backup_restore_dashboard(request):
    """Dashboard with Backup and Restore configuration."""
    backup_form = BackupConfigForm(request.POST or None)
    restore_form = RestoreForm(request.POST or None, request.FILES or None)

    # Default filename
    default_filename = f"drmis-backup-{timezone.now().strftime('%Y-%m-%d')}-full.zip"
    if not request.POST:
        backup_form.initial.setdefault("filename", default_filename)

    context = {
        "title": "Backup & Restore",
        "default_filename": default_filename,
        "opts": None,
        "backup_form": backup_form,
        "restore_form": restore_form,
        "backup_categories": BACKUP_CATEGORIES,
        "backup_history": BackupLog.objects.select_related("created_by")[:10],
    }
    context.update(admin.site.each_context(request))
    return render(request, "admin/maintenance/backup_restore.html", context)


@require_http_methods(["POST"])
def backup_download(request):
    """Create backup ZIP and return as downloadable file."""
    if not request.user.is_staff:
        return HttpResponse("Forbidden", status=403)

    form = BackupConfigForm(request.POST)
    if not form.is_valid():
        for field, errs in form.errors.items():
            for e in errs:
                messages.error(request, f"{field}: {e}")
        return redirect("admin_maintenance_backup_restore")

    categories = form.get_selected_categories()
    if not categories:
        messages.error(request, "Select at least one category to backup.")
        return redirect("admin_maintenance_backup_restore")

    compression = form.cleaned_data.get("compression", "medium")
    filename = form.cleaned_data.get("filename") or f"drmis-backup-{timezone.now().strftime('%Y-%m-%d-%H%M')}.zip"
    if not filename.endswith(".zip"):
        filename += ".zip"

    try:
        zip_bytes, _ = create_backup_zip(
            categories=categories,
            compression=compression,
        )
    except Exception as e:
        messages.error(request, f"Backup failed: {e}")
        return redirect("admin_maintenance_backup_restore")

    # Log backup
    BackupLog.objects.create(
        backup_type="full" if len(categories) >= 6 else "custom",
        size_bytes=len(zip_bytes),
        filename=filename,
        included_categories=categories,
        created_by=request.user,
    )

    response = HttpResponse(zip_bytes, content_type="application/zip")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


@require_http_methods(["POST"])
def restore_upload(request):
    """Upload backup file and restore."""
    if not request.user.is_staff:
        return HttpResponse("Forbidden", status=403)

    form = RestoreForm(request.POST, request.FILES)
    if not form.is_valid():
        for field, errs in form.errors.items():
            for e in errs:
                messages.error(request, f"{field}: {e}")
        return redirect("admin_maintenance_backup_restore")

    uploaded = form.cleaned_data["backup_file"]
    password = form.cleaned_data.get("password") or None
    dry_run = form.cleaned_data.get("dry_run", False)
    overwrite = form.cleaned_data.get("overwrite", False)
    merge = form.cleaned_data.get("merge", False)

    if uploaded.name.endswith(".json"):
        try:
            restore_from_upload(uploaded)
            messages.success(request, "Restore completed successfully.")
        except Exception as e:
            messages.error(request, f"Restore failed: {e}")
    elif uploaded.name.endswith(".zip"):
        content = uploaded.read()
        try:
            result = restore_from_zip(
                content,
                password=password,
                dry_run=dry_run,
                overwrite=overwrite,
                merge=merge,
            )
            if dry_run:
                messages.info(request, f"Dry-run: would restore {len(result.get('preview', []))} files.")
            else:
                messages.success(request, "Restore completed successfully.")
        except Exception as e:
            messages.error(request, f"Restore failed: {e}")
    else:
        messages.error(request, "Please upload a .zip or .json backup file.")

    return redirect("admin_maintenance_backup_restore")


