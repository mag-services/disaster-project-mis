"""
Tabular aggregation endpoint. Replaces frontend heavy lifting.
GET api/v1/tabular/<pk>/aggregate/?group_by=province&year=2023&attribute=population
"""
from django.db.models import Sum, Count, Avg
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import TabularDataset, TabularItem
from .publication import get_dataset_for_read_or_404


class TabularAggregateView(APIView):
    """
    Aggregate tabular data by province or area_council.
    Query params:
      - group_by: province | area_council
      - year: YYYY (filters date)
      - attribute: optional, filter to this attribute before aggregating
      - agg: sum | count | avg (default: sum)
      - province: required when group_by=area_council, scope to this province
    """
    permission_classes = [IsAuthenticated]

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
            qs = qs.filter(
                date__year=year,
            )

        if attribute:
            qs = qs.filter(attribute__icontains=attribute)

        if province:
            qs = qs.filter(province__name__iexact=province)

        agg_func = {"sum": Sum, "count": Count, "avg": Avg}[agg]
        value_field = "value" if agg in ("sum", "avg") else "id"

        if group_by == "province":
            qs = qs.values("province__name", "attribute")
            qs = qs.annotate(value=agg_func(value_field))
            qs = qs.filter(province__name__isnull=False)
            results = [
                {
                    "province": row["province__name"],
                    "attribute": row["attribute"],
                    "value": float(row["value"]) if row["value"] is not None else 0,
                }
                for row in qs
            ]
        else:
            qs = qs.values("area_council__name", "attribute")
            qs = qs.annotate(value=agg_func(value_field))
            qs = qs.filter(area_council__name__isnull=False)
            results = [
                {
                    "area_council": row["area_council__name"],
                    "attribute": row["attribute"],
                    "value": float(row["value"]) if row["value"] is not None else 0,
                }
                for row in qs
            ]

        return Response({
            "group_by": group_by,
            "year": year,
            "attribute": attribute,
            "agg": agg,
            "results": results,
        })
