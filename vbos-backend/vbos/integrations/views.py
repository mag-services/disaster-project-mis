"""
Integration API views for departmental MIS data ingest and read.
Bidirectional: external systems can push data (ingest) and read data (tabular/aggregate).
"""
from django.db.models import Sum, Count, Avg
from django.utils.dateparse import parse_date

from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from vbos.datasets.models import TabularDataset, TabularItem, Province, AreaCouncil
from vbos.datasets.serializers import TabularDatasetSerializer, TabularItemSerializer
from vbos.datasets.pagination import DataResultsSetPagination, DatasetListPagination
from vbos.datasets.filters import TabularDatasetFilter, TabularItemFilter
from vbos.datasets.publication import (
    filter_queryset_for_public_api,
    get_dataset_for_read_or_404,
)

from .authentication import IntegrationAPIKeyAuthentication
from .permissions import IsIntegrationAPIKey


# --- Read endpoints (other systems read from Disaster MIS) ---


class IntegrationTabularListView(ListAPIView):
    """List tabular datasets. Auth: X-API-Key or Authorization: ApiKey <key>."""
    serializer_class = TabularDatasetSerializer
    authentication_classes = [IntegrationAPIKeyAuthentication]
    permission_classes = [IsIntegrationAPIKey]
    pagination_class = DatasetListPagination
    filterset_class = TabularDatasetFilter

    def get_queryset(self):
        return filter_queryset_for_public_api(TabularDataset.objects.all(), self.request)


class IntegrationTabularDetailView(RetrieveAPIView):
    """Get a single tabular dataset. Auth: X-API-Key or Authorization: ApiKey <key>."""
    serializer_class = TabularDatasetSerializer
    authentication_classes = [IntegrationAPIKeyAuthentication]
    permission_classes = [IsIntegrationAPIKey]

    def get_queryset(self):
        return filter_queryset_for_public_api(TabularDataset.objects.all(), self.request)


class IntegrationTabularDataView(ListAPIView):
    """Get tabular data for a dataset. Auth: X-API-Key or Authorization: ApiKey <key>."""
    serializer_class = TabularItemSerializer
    authentication_classes = [IntegrationAPIKeyAuthentication]
    permission_classes = [IsIntegrationAPIKey]
    pagination_class = DataResultsSetPagination
    filterset_class = TabularItemFilter

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        get_dataset_for_read_or_404(TabularDataset, request, self.kwargs.get("pk"))

    def get_queryset(self):
        return TabularItem.objects.filter(
            dataset=self.kwargs.get("pk")
        ).select_related("province", "area_council")


class IntegrationTabularAggregateView(APIView):
    """Aggregate tabular data. Query params: group_by, year, attribute, agg, province."""
    authentication_classes = [IntegrationAPIKeyAuthentication]
    permission_classes = [IsIntegrationAPIKey]

    def get(self, request, pk):
        dataset = get_dataset_for_read_or_404(TabularDataset, request, pk)
        group_by = request.query_params.get("group_by", "province")
        year = request.query_params.get("year")
        attribute = request.query_params.get("attribute")
        agg = request.query_params.get("agg", "sum").lower()
        province = request.query_params.get("province")
        if group_by not in ("province", "area_council"):
            return Response(
                {"detail": "group_by must be 'province' or 'area_council'"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if group_by == "area_council" and not province:
            return Response(
                {"detail": "province is required when group_by=area_council"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if agg not in ("sum", "count", "avg"):
            return Response(
                {"detail": "agg must be 'sum', 'count', or 'avg'"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = TabularItem.objects.filter(dataset=dataset)
        if year:
            qs = qs.filter(date__year=year)
        if attribute:
            qs = qs.filter(attribute__icontains=attribute)
        if province:
            qs = qs.filter(province__name__iexact=province)
        agg_func = {"sum": Sum, "count": Count, "avg": Avg}[agg]
        value_field = "value" if agg in ("sum", "avg") else "id"
        if group_by == "province":
            qs = qs.values("province__name", "attribute").annotate(value=agg_func(value_field))
            qs = qs.filter(province__name__isnull=False)
            results = [
                {"province": r["province__name"], "attribute": r["attribute"], "value": float(r["value"]) if r["value"] is not None else 0}
                for r in qs
            ]
        else:
            qs = qs.values("area_council__name", "attribute").annotate(value=agg_func(value_field))
            qs = qs.filter(area_council__name__isnull=False)
            results = [
                {"area_council": r["area_council__name"], "attribute": r["attribute"], "value": float(r["value"]) if r["value"] is not None else 0}
                for r in qs
            ]
        return Response({"group_by": group_by, "year": year, "attribute": attribute, "agg": agg, "results": results})


# --- Ingest endpoint (other systems push data into Disaster MIS) ---


class TabularIngestView(APIView):
    """
    Bulk ingest tabular data from departmental MIS systems.
    POST with dataset_id and items array.
    """
    authentication_classes = [IntegrationAPIKeyAuthentication]
    permission_classes = [IsIntegrationAPIKey]

    def post(self, request):

        dataset_id = request.data.get("dataset_id")
        items = request.data.get("items", [])
        upsert = request.data.get("upsert", False)

        if not dataset_id:
            return Response(
                {"detail": "dataset_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(items, list) or len(items) == 0:
            return Response(
                {"detail": "items must be a non-empty array"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        dataset = TabularDataset.objects.filter(pk=dataset_id).first()
        if not dataset:
            return Response(
                {"detail": "Dataset not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Cache province/area_council lookups
        provinces = {p.name.lower(): p for p in Province.objects.all()}
        ac_by_province = {}
        for ac in AreaCouncil.objects.select_related("province"):
            key = (ac.province.name.lower(), ac.name.lower())
            ac_by_province[key] = ac

        created = 0
        updated = 0
        errors = []

        for idx, item in enumerate(items):
            if not isinstance(item, dict):
                errors.append({"index": idx, "error": "Item must be an object"})
                continue

            province_name = item.get("province")
            ac_name = item.get("area_council")
            attribute = item.get("attribute")
            date_val = item.get("date")
            value = item.get("value")
            metadata = item.get("metadata") or {}

            if not all([province_name, ac_name, attribute, date_val, value is not None]):
                errors.append({
                    "index": idx,
                    "error": "province, area_council, attribute, date, and value are required",
                })
                continue

            # Add external source to metadata for provenance
            metadata.setdefault("external_source", request.user.source.name)

            province = provinces.get(province_name.strip().lower()) if province_name else None
            if not province:
                errors.append({"index": idx, "error": f"Province '{province_name}' not found"})
                continue

            ac_key = (province.name.lower(), ac_name.strip().lower())
            area_council = ac_by_province.get(ac_key)
            if not area_council:
                errors.append({
                    "index": idx,
                    "error": f"Area council '{ac_name}' not found in province {province_name}",
                })
                continue

            parsed_date = parse_date(str(date_val)) if isinstance(date_val, str) else date_val
            if not parsed_date:
                errors.append({"index": idx, "error": f"Invalid date: {date_val}"})
                continue

            try:
                value_float = float(value)
            except (TypeError, ValueError):
                errors.append({"index": idx, "error": f"value must be numeric, got: {value}"})
                continue

            if upsert:
                existing = TabularItem.objects.filter(
                    dataset=dataset,
                    province=province,
                    area_council=area_council,
                    attribute=attribute,
                    date=parsed_date,
                ).first()
                if existing:
                    existing.value = value_float
                    existing.metadata = {**existing.metadata, **metadata}
                    existing.save()
                    updated += 1
                    continue

            TabularItem.objects.create(
                dataset=dataset,
                province=province,
                area_council=area_council,
                attribute=attribute,
                date=parsed_date,
                value=value_float,
                metadata=metadata,
            )
            created += 1

        return Response(
            {
                "created": created,
                "updated": updated,
                "errors": errors,
                "dataset_id": dataset_id,
            },
            status=status.HTTP_201_CREATED,
        )
