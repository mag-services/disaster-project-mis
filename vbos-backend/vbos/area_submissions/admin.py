from django.contrib import admin
from django.utils import timezone
from unfold.admin import ModelAdmin as UnfoldModelAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

from .models import AreaAdministrator, AreaDataSubmission
from .services import promote_submission_to_tabular


@admin.register(AreaAdministrator)
class AreaAdministratorAdmin(UnfoldModelAdmin):
    list_display = ["user", "areas_display", "updated"]
    filter_horizontal = ["area_councils", "provinces"]
    search_fields = ["user__username", "user__email"]
    readonly_fields = ["created", "updated"]

    def areas_display(self, obj):
        acs = list(obj.area_councils.values_list("name", flat=True))[:5]
        provs = list(obj.provinces.values_list("name", flat=True))[:5]
        parts = []
        if acs:
            parts.append(f"AC: {', '.join(acs)}{'…' if obj.area_councils.count() > 5 else ''}")
        if provs:
            parts.append(f"Prov: {', '.join(provs)}{'…' if obj.provinces.count() > 5 else ''}")
        return " | ".join(parts) or "—"

    areas_display.short_description = "Assigned areas"


def _approve_submission(modeladmin, request, queryset):
    for s in queryset.filter(status=AreaDataSubmission.STATUS_SUBMITTED):
        s.status = AreaDataSubmission.STATUS_APPROVED
        s.reviewed_by = request.user
        s.reviewed_at = timezone.now()
        s.rejection_reason = ""
        s.save()
        promote_submission_to_tabular(s)
    modeladmin.message_user(request, f"Approved {queryset.count()} submission(s).")


def _reject_submission(modeladmin, request, queryset):
    for s in queryset.filter(status=AreaDataSubmission.STATUS_SUBMITTED):
        s.status = AreaDataSubmission.STATUS_REJECTED
        s.reviewed_by = request.user
        s.reviewed_at = timezone.now()
        s.rejection_reason = ""
        s.save()
    modeladmin.message_user(request, f"Rejected {queryset.count()} submission(s).")


_approve_submission.short_description = "Approve selected submissions"
_reject_submission.short_description = "Reject selected submissions"


@admin.register(AreaDataSubmission)
class AreaDataSubmissionAdmin(UnfoldModelAdmin):
    list_display = [
        "id",
        "dataset",
        "province",
        "area_council",
        "year",
        "status_badge",
        "submitted_by",
        "submitted_at",
        "reviewed_by",
        "reviewed_at",
    ]
    list_filter = ["status", "dataset", "province", "year"]
    search_fields = ["submitted_by__username", "dataset__name", "province__name"]
    readonly_fields = [
        "submitted_at",
        "reviewed_by",
        "reviewed_at",
        "created",
        "updated",
        "view_on_map_link",
    ]
    actions = [_approve_submission, _reject_submission]
    date_hierarchy = "submitted_at"

    fieldsets = (
        (
            None,
            {
                "fields": ("dataset", "province", "area_council", "year", "items", "view_on_map_link"),
            },
        ),
        (
            "Status",
            {
                "fields": (
                    "status",
                    "submitted_by",
                    "submitted_at",
                    "reviewed_by",
                    "reviewed_at",
                    "rejection_reason",
                )
            },
        ),
    )

    def status_badge(self, obj):
        styles = {
            "draft": "background:#F8F9FB;color:#4A5568;border:1px solid #E2E6EE",
            "submitted": "background:#FDF3E0;color:#633806;border:1px solid #F5C875",
            "approved": "background:#EAF6EE;color:#27500A;border:1px solid #9FE1CB",
            "rejected": "background:#FEECEA;color:#A32D2D;border:1px solid #F7C1C1",
        }
        s = styles.get(obj.status, styles["draft"])
        return format_html(
            '<span style="font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;font-size:10px;'
            'padding:2px 8px;border-radius:4px;{}">{}</span>',
            s,
            obj.get_status_display(),
        )

    status_badge.short_description = "Status"

    @admin.display(description="View on map")
    def view_on_map_link(self, obj):
        province = getattr(obj, "province", None)
        # Incidents are represented by AreaDataSubmission (tabular dataset + province)
        layers = f"t{obj.dataset_id}"
        url = f"/app/live-map?layers={layers}"
        if province is not None:
            url += f"&province={province.pk}"
        return format_html(
            '<a href="{}" target="_blank" style="font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;font-size:11px;color:#185FA5;text-decoration:none;">Open in Live Map →</a>',
            url,
        )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            "dataset", "province", "area_council", "submitted_by", "reviewed_by"
        )

    def save_model(self, request, obj, form, change):
        if change and obj.status == AreaDataSubmission.STATUS_APPROVED:
            old = AreaDataSubmission.objects.get(pk=obj.pk)
            if old.status != AreaDataSubmission.STATUS_APPROVED:
                obj.reviewed_by = request.user
                obj.reviewed_at = timezone.now()
        super().save_model(request, obj, form, change)
        if obj.status == AreaDataSubmission.STATUS_APPROVED:
            promote_submission_to_tabular(obj)
