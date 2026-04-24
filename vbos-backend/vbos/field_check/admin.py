from django.contrib import admin
from django.shortcuts import render
from unfold.admin import ModelAdmin as UnfoldModelAdmin

from .models import FieldCheckRecord


@admin.register(FieldCheckRecord)
class FieldCheckRecordAdmin(UnfoldModelAdmin):
    list_display = ["id", "content_type", "object_id", "status", "observed_value", "verified_by", "verified_at"]
    list_filter = ["status", "content_type"]
    search_fields = ["notes", "verified_by__username"]
    readonly_fields = ["verified_at"]
    date_hierarchy = "verified_at"
    ordering = ["-verified_at"]

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context["show_dashboard_link"] = True
        return super().changelist_view(request, extra_context)


def field_check_dashboard(request):
    """Admin view: field check coverage and improvement over time."""
    from django.contrib.contenttypes.models import ContentType
    from vbos.datasets.models import (
        DatasetPublicationStatus,
        TabularItem,
        TabularDataset,
    )
    from django.db.models import OuterRef, Subquery
    from django.utils import timezone
    from datetime import timedelta

    tabular_ct = ContentType.objects.get_for_model(TabularItem)
    damage_types = ["estimated_damage", "estimate_financial_damage"]
    damage_datasets = TabularDataset.objects.filter(
        type__in=damage_types,
        publication_status=DatasetPublicationStatus.PUBLISHED,
    )
    item_ids = list(
        TabularItem.objects.filter(dataset__in=damage_datasets).values_list("id", flat=True)
    )

    latest_subq = (
        FieldCheckRecord.objects.filter(
            content_type=tabular_ct,
            object_id=OuterRef("pk"),
        )
        .order_by("-verified_at")
        .values("status")[:1]
    )
    items_with_latest = TabularItem.objects.filter(
        dataset__in=damage_datasets
    ).annotate(
        latest_status=Subquery(latest_subq)
    )

    model_count = sum(1 for i in items_with_latest if i.latest_status is None)
    verified_count = sum(1 for i in items_with_latest if i.latest_status == FieldCheckRecord.STATUS_VERIFIED)
    adjusted_count = sum(1 for i in items_with_latest if i.latest_status == FieldCheckRecord.STATUS_ADJUSTED)
    rejected_count = sum(1 for i in items_with_latest if i.latest_status == FieldCheckRecord.STATUS_REJECTED)

    total = model_count + verified_count + adjusted_count + rejected_count
    field_checked = verified_count + adjusted_count + rejected_count
    coverage_pct = (field_checked / total * 100) if total else 0

    # Weighted confidence: verified=100, adjusted=75, rejected=0, model=0
    weighted_score = verified_count * 100 + adjusted_count * 75
    confidence_pct = (weighted_score / total * 100) if total else 0

    now = timezone.now()
    weekly = []
    for i in range(7, -1, -1):
        week_end = now - timedelta(weeks=i)
        week_start = week_end - timedelta(weeks=1)
        count = FieldCheckRecord.objects.filter(
            content_type=tabular_ct,
            object_id__in=item_ids,
            verified_at__gte=week_start,
            verified_at__lt=week_end,
        ).count()
        weekly.append({"week": week_start.strftime("%Y-%m-%d"), "count": count})

    context = {
        "title": "Field Check Coverage",
        "total_items": total,
        "model_count": model_count,
        "verified_count": verified_count,
        "adjusted_count": adjusted_count,
        "rejected_count": rejected_count,
        "field_checked": field_checked,
        "coverage_percent": round(coverage_pct, 1),
        "confidence_percent": round(confidence_pct, 1),
        "weekly": weekly,
    }
    return render(request, "admin/field_check/dashboard.html", context)
