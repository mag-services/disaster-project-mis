from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import ListCreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from vbos.area_submissions.permissions import user_is_area_admin, user_can_manage_area

from .models import FieldCheckRecord
from .permissions import IsAreaAdminOrStaff
from .serializers import FieldCheckRecordSerializer, FieldCheckRecordCreateSerializer


class FieldCheckContentTypesView(APIView):
    """List allowed content types for field check (tabularitem, vectoritem). Area admins and staff only."""
    permission_classes = [IsAreaAdminOrStaff]

    def get(self, request):
        cts = ContentType.objects.filter(
            model__in=("tabularitem", "vectoritem")
        ).order_by("app_label", "model")
        return Response([
            {"id": ct.id, "app_label": ct.app_label, "model": ct.model}
            for ct in cts
        ])


def confidence_from_status(status_value):
    """Map record status to confidence level."""
    if status_value is None:
        return "model"
    if status_value == FieldCheckRecord.STATUS_VERIFIED:
        return "field_verified"
    if status_value == FieldCheckRecord.STATUS_ADJUSTED:
        return "field_adjusted"
    if status_value == FieldCheckRecord.STATUS_REJECTED:
        return "rejected"
    return "model"


def _item_belongs_to_area_admin(item, user):
    """Check if TabularItem or VectorItem belongs to an area the area admin can manage."""
    if not user_is_area_admin(user):
        return False
    province = getattr(item, "province", None)
    area_council = getattr(item, "area_council", None)
    if not province:
        return False
    return user_can_manage_area(user, province, area_council)


class FieldCheckRecordListCreateView(ListCreateAPIView):
    """
    List: staff see all; area admins see their own records.
    Create: area administrators only (they perform field checks). Item must be in their area.
    """
    permission_classes = [IsAreaAdminOrStaff]

    def get_queryset(self):
        qs = FieldCheckRecord.objects.select_related(
            "content_type", "verified_by"
        ).order_by("-verified_at")
        if not self.request.user.is_staff:
            return qs.filter(verified_by=self.request.user)
        return qs

    def get_serializer_class(self):
        if self.request.method == "POST":
            return FieldCheckRecordCreateSerializer
        return FieldCheckRecordSerializer

    def create(self, request, *args, **kwargs):
        serializer = FieldCheckRecordCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ct = serializer.validated_data["content_type"]
        object_id = serializer.validated_data["object_id"]
        if not request.user.is_staff:
            model_class = ct.model_class()
            if model_class is None:
                return Response(
                    {"detail": "Invalid content type."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            item = model_class.objects.filter(pk=object_id).first()
            if item is None:
                return Response(
                    {"detail": "Item not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            if not _item_belongs_to_area_admin(item, request.user):
                return Response(
                    {"detail": "You can only add field checks for items in your assigned areas."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        serializer.save(verified_by=request.user)
        return Response(
            FieldCheckRecordSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )


class FieldCheckCoverageView(APIView):
    """
    Summary of field check coverage for damage estimates.
    Returns counts by confidence level and improvement over time. Staff only.
    """
    permission_classes = [IsAreaAdminOrStaff]

    def get(self, request):
        if not request.user.is_staff:
            return Response(
                {"detail": "Staff only."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from vbos.datasets.models import (
            DatasetPublicationStatus,
            TabularItem,
            TabularDataset,
        )

        # Damage estimate datasets only
        damage_types = ["estimated_damage", "estimate_financial_damage"]
        tabular_ct = ContentType.objects.get_for_model(TabularItem)
        damage_datasets = TabularDataset.objects.filter(
            type__in=damage_types,
            publication_status=DatasetPublicationStatus.PUBLISHED,
        )
        item_ids = list(
            TabularItem.objects.filter(dataset__in=damage_datasets).values_list("id", flat=True)
        )

        from django.db.models import OuterRef, Subquery

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

        model_count = 0
        verified_count = 0
        adjusted_count = 0
        rejected_count = 0
        for item in items_with_latest:
            s = item.latest_status
            if s is None:
                model_count += 1
            elif s == FieldCheckRecord.STATUS_VERIFIED:
                verified_count += 1
            elif s == FieldCheckRecord.STATUS_ADJUSTED:
                adjusted_count += 1
            elif s == FieldCheckRecord.STATUS_REJECTED:
                rejected_count += 1

        total = model_count + verified_count + adjusted_count + rejected_count
        field_checked = verified_count + adjusted_count + rejected_count
        coverage_pct = (field_checked / total * 100) if total else 0

        # Weighted confidence: verified=100, adjusted=75, rejected=0, model=0
        weighted_score = verified_count * 100 + adjusted_count * 75
        confidence_pct = (weighted_score / total * 100) if total else 0

        # Records per week (last 8 weeks, most recent last)
        from django.utils import timezone
        from datetime import timedelta

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

        return Response({
            "total_items": total,
            "model": model_count,
            "field_verified": verified_count,
            "field_adjusted": adjusted_count,
            "rejected": rejected_count,
            "field_checked": field_checked,
            "coverage_percent": round(coverage_pct, 1),
            "confidence_percent": round(confidence_pct, 1),
            "records_per_week": weekly,
        })


class FieldCheckItemConfidenceView(APIView):
    """
    Get confidence for a specific item (TabularItem or VectorItem).
    Returns latest record status and derived confidence. Area admins and staff.
    """
    permission_classes = [IsAreaAdminOrStaff]

    def get(self, request, content_type_app, content_type_model, object_id):
        ct = get_object_or_404(
            ContentType,
            app_label=content_type_app,
            model=content_type_model.lower(),
        )
        if ct.model not in ("tabularitem", "vectoritem"):
            return Response(
                {"detail": "Invalid content type."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        latest = (
            FieldCheckRecord.objects.filter(
                content_type=ct,
                object_id=object_id,
            )
            .order_by("-verified_at")
            .first()
        )
        if latest is None:
            return Response({
                "object_id": object_id,
                "content_type": f"{content_type_app}.{content_type_model}",
                "confidence": "model",
                "latest_record": None,
            })
        return Response({
            "object_id": object_id,
            "content_type": f"{content_type_app}.{content_type_model}",
            "confidence": confidence_from_status(latest.status),
            "latest_record": FieldCheckRecordSerializer(latest).data,
        })


class FieldTeamDeploymentStatsView(APIView):
    """
    Summary endpoint for Command Centre KPI.

    GET /api/v1/field-checks/?status=active&count=true
      - status=active: users who submitted field checks in last 24h
      - count=true: returns compact {"count": <int>}

    Supported statuses:
      - active
      - verified / adjusted / rejected
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        status_value = (request.query_params.get("status") or "").strip().lower()
        count_only = (request.query_params.get("count") or "").strip().lower() == "true"
        qs = FieldCheckRecord.objects.all()

        if status_value == "active":
            # "Deployed" approximated as users with field activity in the last 24 hours.
            since = timezone.now() - timezone.timedelta(hours=24)
            qs = qs.filter(verified_at__gte=since)
            count_value = qs.values("verified_by").distinct().count()
            if count_only:
                return Response({"count": count_value})
            return Response(
                {
                    "status": "active",
                    "window_hours": 24,
                    "count": count_value,
                }
            )

        if status_value in {
            FieldCheckRecord.STATUS_VERIFIED,
            FieldCheckRecord.STATUS_ADJUSTED,
            FieldCheckRecord.STATUS_REJECTED,
        }:
            qs = qs.filter(status=status_value)
        elif status_value:
            return Response(
                {
                    "detail": "Unsupported status. Use one of: active, verified, adjusted, rejected."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        count_value = qs.count()
        if count_only:
            return Response({"count": count_value})
        return Response(
            {
                "status": status_value or "all",
                "count": count_value,
            }
        )
