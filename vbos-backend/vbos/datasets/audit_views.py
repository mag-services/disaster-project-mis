"""
Read-only REST API for the dataset audit trail.

Accessible by any authenticated user (not staff-only).
Scoped to dataset-related content types only (app_label='datasets'):
  tabular_dataset, vector_dataset, raster_dataset, pmtiles_dataset, cluster, etc.
Admin/user-management/system log entries are excluded.

GET /api/v1/audit/
  ?page=1&page_size=50
  &search=<text>            # object_repr, user__username, change_message
  &action=1|2|3             # 1=Added, 2=Changed, 3=Deleted
  &user=<username>
  &model=<content_type model name, e.g. tabulardataset>
  &date_from=YYYY-MM-DD
  &date_to=YYYY-MM-DD
"""
import csv

from django.contrib.admin.models import ADDITION, CHANGE, DELETION, LogEntry
from django.db.models import Q
from django.http import HttpResponse
from rest_framework import serializers
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


# Django app_label for the datasets app (last segment of "vbos.datasets")
DATASET_APP_LABEL = "datasets"

# Human-readable labels for dataset model names (content_type.model is lower-case/no-space)
MODEL_DISPLAY_NAMES: dict[str, str] = {
    "tabulardataset": "Tabular Dataset",
    "vectordataset": "Vector Dataset",
    "rasterdataset": "Raster Dataset",
    "pmtilesdataset": "PMTiles Dataset",
    "cluster": "Cluster",
    "province": "Province",
    "areacouncil": "Area Council",
    "tabularitem": "Tabular Item",
    "vectoritem": "Vector Item",
    "rasterfile": "Raster File",
}

ACTION_LABELS = {
    ADDITION: "Added",
    CHANGE: "Changed",
    DELETION: "Deleted",
}


class AuditLogSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    action = serializers.SerializerMethodField()
    action_flag = serializers.IntegerField()
    model = serializers.SerializerMethodField()
    model_display = serializers.SerializerMethodField()
    change_message = serializers.SerializerMethodField()

    class Meta:
        model = LogEntry
        fields = [
            "id",
            "action_time",
            "user",
            "action",
            "action_flag",
            "model",
            "model_display",
            "object_id",
            "object_repr",
            "change_message",
        ]

    def get_user(self, obj):
        return obj.user.username if obj.user_id else None

    def get_action(self, obj):
        return ACTION_LABELS.get(obj.action_flag, str(obj.action_flag))

    def get_model(self, obj):
        if obj.content_type_id:
            return obj.content_type.model
        return None

    def get_model_display(self, obj):
        if obj.content_type_id:
            return MODEL_DISPLAY_NAMES.get(
                obj.content_type.model,
                obj.content_type.model.replace("_", " ").title(),
            )
        return None

    def get_change_message(self, obj):
        try:
            return obj.get_change_message() or obj.change_message
        except Exception:
            return obj.change_message or ""


class AuditLogPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200


class AuditLogView(APIView):
    """
    Authenticated (any user) paginated audit log scoped to dataset changes only.
    Supports: search, action filter, user filter, model filter, date range.
    """
    permission_classes = [IsAuthenticated]

    def _build_filtered_queryset(self, request):
        # Scope to dataset app content types only — excludes admin/auth/system logs
        qs = (
            LogEntry.objects
            .select_related("user", "content_type")
            .filter(content_type__app_label=DATASET_APP_LABEL)
            .order_by("-action_time")
        )

        # --- filters ---
        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(object_repr__icontains=search)
                | Q(user__username__icontains=search)
                | Q(change_message__icontains=search)
            )

        action = request.query_params.get("action", "").strip()
        if action and action in ("1", "2", "3"):
            qs = qs.filter(action_flag=int(action))

        user = request.query_params.get("user", "").strip()
        if user:
            qs = qs.filter(user__username__iexact=user)

        model = request.query_params.get("model", "").strip()
        if model:
            qs = qs.filter(content_type__model__iexact=model)

        date_from = request.query_params.get("date_from", "").strip()
        if date_from:
            qs = qs.filter(action_time__date__gte=date_from)

        date_to = request.query_params.get("date_to", "").strip()
        if date_to:
            qs = qs.filter(action_time__date__lte=date_to)

        return qs

    def _export_csv(self, request, qs):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="dataset-audit-log.csv"'
        writer = csv.writer(response)
        writer.writerow(
            [
                "timestamp",
                "user",
                "action",
                "model",
                "object_id",
                "object",
                "changes",
            ]
        )
        for entry in qs.iterator():
            action_label = ACTION_LABELS.get(entry.action_flag, str(entry.action_flag))
            model = entry.content_type.model if entry.content_type_id else ""
            try:
                change_message = entry.get_change_message() or entry.change_message or ""
            except Exception:
                change_message = entry.change_message or ""
            writer.writerow(
                [
                    entry.action_time.isoformat(),
                    entry.user.username if entry.user_id else "",
                    action_label,
                    model,
                    entry.object_id or "",
                    entry.object_repr or "",
                    change_message,
                ]
            )
        return response

    def get(self, request):
        qs = self._build_filtered_queryset(request)
        if (request.query_params.get("format") or "").strip().lower() == "csv":
            return self._export_csv(request, qs)

        # --- pagination ---
        paginator = AuditLogPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = AuditLogSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
