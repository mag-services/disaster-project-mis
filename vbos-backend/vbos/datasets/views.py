import django_filters.rest_framework
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from drf_excel.mixins import XLSXFileMixin
from drf_excel.renderers import XLSXRenderer
from django.conf import settings
from django.contrib.gis.geos import Point
from rest_framework import status
from rest_framework.generics import DestroyAPIView, ListAPIView, ListCreateAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_gis.filters import InBBoxFilter

from vbos.datasets.filters import (
    PMTilesDatasetFilter,
    RasterDatasetFilter,
    TabularDatasetFilter,
    TabularItemFilter,
    VectorDatasetFilter,
    VectorItemFilter,
)

from .models import (
    AreaCouncil,
    Cluster,
    CycloneEvent,
    PMTilesDataset,
    Province,
    RasterDataset,
    TabularDataset,
    TabularItem,
    VectorDataset,
    VectorItem,
    get_disaster_dataset_tag_names,
)
from .pagination import (
    DataResultsSetPagination,
    DatasetListPagination,
    GeoJsonPagination,
    StandardResultsSetPagination,
)
from vbos.datasets.map_query import run_map_query
from vbos.datasets.publication import (
    filter_queryset_for_public_api,
    get_dataset_for_read_or_404,
)

from .serializers import (
    AreaCouncilSerializer,
    ClusterSerializer,
    CycloneEventSerializer,
    PMTilesDatasetSerializer,
    ProvinceSerializer,
    RasterDatasetSerializer,
    TabularDatasetSerializer,
    TabularItemExcelSerializer,
    TabularItemSerializer,
    VectorDatasetSerializer,
    VectorItemSerializer,
)


# Driver overlay names: fetched by name across all clusters (e.g. Roads in Logistics)
DRIVER_DATASET_NAMES = ["Population growth", "Roads", "Urban expansion"]

class ClusterDatasetsView(APIView):
    """Single endpoint returning all dataset types for a cluster in one response.
    No cache so new datasets (e.g. Water Sources) appear immediately after admin adds them.

    Special case: cluster=Drivers fetches datasets by name (Roads, Population growth,
    Urban expansion) from ANY cluster, so Roads in Logistics appears without duplication.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cluster_name = request.query_params.get("cluster")
        scenario = request.query_params.get("scenario", "").lower()  # "disaster" or "climate"

        if not cluster_name:
            return Response(
                {"detail": "Missing required 'cluster' query parameter"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Filter vector/pmtiles by scenario: Disaster = no climate; Climate = by cluster
        def filter_by_scenario(qs, cluster_param=None):
            from django.db.models import Q
            if scenario == "disaster":
                # Exclude datasets that have any climate module
                return qs.exclude(
                    Q(climate_module__in=["land_accounts", "coastal_changes"])
                    | ~Q(climate_modules=[])
                )
            if scenario == "climate":
                cn = (cluster_param or cluster_name or "").lower().replace(" ", "_")
                if cn in ("drivers", "disaster"):
                    # Drivers: all climate datasets
                    return qs.filter(
                        Q(climate_module__in=["land_accounts", "coastal_changes"])
                        | ~Q(climate_modules=[])
                    )
                # Land Accounts, Coastal Changes, etc.: filter by module
                return qs.filter(
                    Q(climate_modules__contains=[cn]) | Q(climate_module=cn)
                )
            return qs

        if cluster_name.lower() == "drivers":
            # Drivers overlay: Climate mode — fetch by name across ALL clusters
            from django.db.models import Q
            name_q = Q()
            for n in DRIVER_DATASET_NAMES:
                name_q |= Q(name__icontains=n)
            tabular_qs = filter_queryset_for_public_api(
                TabularDataset.objects.filter(name_q).select_related("cyclone_event"),
                request,
            )
            raster_qs = filter_queryset_for_public_api(
                RasterDataset.objects.filter(name_q), request
            )
            vector_qs = filter_by_scenario(
                filter_queryset_for_public_api(
                    VectorDataset.objects.filter(name_q), request
                ),
                cluster_param=cluster_name,
            )
            pmtiles_qs = filter_by_scenario(
                filter_queryset_for_public_api(
                    PMTilesDataset.objects.filter(name_q), request
                ),
                cluster_param=cluster_name,
            )
            tabular = TabularDatasetSerializer(tabular_qs, many=True).data
            raster = RasterDatasetSerializer(raster_qs, many=True).data
            vector = VectorDatasetSerializer(vector_qs, many=True).data
            pmtiles = PMTilesDatasetSerializer(pmtiles_qs, many=True).data
        elif cluster_name.lower() == "disaster":
            # Disaster overlay: Disaster mode — fetch by name across ALL clusters
            # Tag names are admin-configurable (DisasterDatasetTag).
            from django.db.models import Q
            tag_names = get_disaster_dataset_tag_names()
            if tag_names:
                name_q = Q()
                for n in tag_names:
                    name_q |= Q(name__icontains=n)
                raster_qs = filter_queryset_for_public_api(
                    RasterDataset.objects.filter(name_q), request
                )
                vector_qs = filter_by_scenario(
                    filter_queryset_for_public_api(
                        VectorDataset.objects.filter(name_q), request
                    ),
                    cluster_param=cluster_name,
                )
                pmtiles_qs = filter_by_scenario(
                    filter_queryset_for_public_api(
                        PMTilesDataset.objects.filter(name_q), request
                    ),
                    cluster_param=cluster_name,
                )
            else:
                empty = RasterDataset.objects.none()
                raster_qs = filter_queryset_for_public_api(empty, request)
                vector_qs = filter_by_scenario(
                    filter_queryset_for_public_api(
                        VectorDataset.objects.none(), request
                    ),
                    cluster_param=cluster_name,
                )
                pmtiles_qs = filter_by_scenario(
                    filter_queryset_for_public_api(
                        PMTilesDataset.objects.none(), request
                    ),
                    cluster_param=cluster_name,
                )
            tabular = []
            raster = RasterDatasetSerializer(raster_qs, many=True).data
            vector = VectorDatasetSerializer(vector_qs, many=True).data
            pmtiles = PMTilesDatasetSerializer(pmtiles_qs, many=True).data
        elif cluster_name.lower() in ("land accounts", "coastal changes"):
            # Climate modules: filter by climate_modules or legacy climate_module
            from django.db.models import Q
            module = cluster_name.lower().replace(" ", "_")
            mod_filter = Q(climate_modules__contains=[module]) | Q(climate_module=module)
            base_vector = filter_queryset_for_public_api(
                VectorDataset.objects.filter(mod_filter), request
            )
            base_pmtiles = filter_queryset_for_public_api(
                PMTilesDataset.objects.filter(mod_filter), request
            )
            tabular = []
            # Land cover raster only in Land Use/Land Cover (Land Accounts); exclude from Coastal changes
            raster_qs = filter_queryset_for_public_api(
                RasterDataset.objects.all(), request
            )
            if cluster_name.lower() == "coastal changes":
                raster_qs = raster_qs.filter(is_land_cover=False)
            raster = RasterDatasetSerializer(raster_qs, many=True).data
            vector = VectorDatasetSerializer(base_vector, many=True).data
            pmtiles = PMTilesDatasetSerializer(base_pmtiles, many=True).data
        else:
            tabular_ids = list(
                filter_queryset_for_public_api(
                    TabularDataset.objects.filter(cluster__name__iexact=cluster_name),
                    request,
                ).values_list("id", flat=True)
            )
            tabular = TabularDatasetSerializer(
                TabularDataset.objects.filter(id__in=tabular_ids).select_related(
                    "cyclone_event"
                ),
                many=True,
            ).data
            # Rasters are Climate-mode only: return all rasters for every cluster
            raster = RasterDatasetSerializer(
                filter_queryset_for_public_api(RasterDataset.objects.all(), request),
                many=True,
            ).data
            base_vector = filter_queryset_for_public_api(
                VectorDataset.objects.filter(cluster__name__iexact=cluster_name),
                request,
            )
            base_pmtiles = filter_queryset_for_public_api(
                PMTilesDataset.objects.filter(cluster__name__iexact=cluster_name),
                request,
            )
            vector = VectorDatasetSerializer(
                filter_by_scenario(base_vector, cluster_param=cluster_name),
                many=True,
            ).data
            pmtiles = PMTilesDatasetSerializer(
                filter_by_scenario(base_pmtiles, cluster_param=cluster_name),
                many=True,
            ).data

        return Response({
            "tabular": tabular,
            "raster": raster,
            "vector": vector,
            "pmtiles": pmtiles,
        })


@method_decorator(cache_page(60 * 15), name="dispatch")  # 15 min cache
class ClusterListView(ListAPIView):
    queryset = Cluster.objects.all().order_by("order")
    serializer_class = ClusterSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def finalize_response(self, request, response, *args, **kwargs):
        # Prevent browser from caching so admin changes (e.g. cluster add/delete) show after clear_cache
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "no-store, must-revalidate"
        return response


class CycloneEventListView(ListAPIView):
    """
    Active (non-archived) cyclone events for the layer browser Risk sources accordion.
    Ordered newest season first. Archived events are excluded; staff can see all via ?all=1.
    """

    serializer_class = CycloneEventSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # small list, no pagination needed

    def get_queryset(self):
        qs = CycloneEvent.objects.order_by("-season_year", "name")
        show_all = self.request.query_params.get("all") == "1"
        if not (show_all and self.request.user and self.request.user.is_staff):
            qs = qs.filter(is_archived=False)
        return qs


@method_decorator(cache_page(60 * 15), name="dispatch")  # 15 min cache
class ProvinceListView(ListAPIView):
    queryset = Province.objects.all()
    serializer_class = ProvinceSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = GeoJsonPagination


@method_decorator(cache_page(60 * 15), name="dispatch")  # 15 min cache
class AreaCouncilListView(ListAPIView):
    serializer_class = AreaCouncilSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = GeoJsonPagination

    def get_queryset(self):
        return AreaCouncil.objects.filter(
            province__name__iexact=self.kwargs.get("province")
        )


@method_decorator(cache_page(60 * 15), name="dispatch")  # 15 min cache
class RasterDatasetListView(ListAPIView):
    serializer_class = RasterDatasetSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DatasetListPagination
    filterset_class = RasterDatasetFilter

    def get_queryset(self):
        return filter_queryset_for_public_api(RasterDataset.objects.all(), self.request)


class RasterDatasetDetailView(RetrieveAPIView):
    serializer_class = RasterDatasetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return filter_queryset_for_public_api(RasterDataset.objects.all(), self.request)


@method_decorator(cache_page(60 * 15), name="dispatch")  # 15 min cache
class PMTilesDatasetListView(ListAPIView):
    serializer_class = PMTilesDatasetSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DatasetListPagination
    filterset_class = PMTilesDatasetFilter

    def get_queryset(self):
        return filter_queryset_for_public_api(PMTilesDataset.objects.all(), self.request)


class PMTilesDatasetDetailView(RetrieveAPIView):
    serializer_class = PMTilesDatasetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return filter_queryset_for_public_api(PMTilesDataset.objects.all(), self.request)


class PMTilesIntensityView(APIView):
    """Return cyclone intensity data for a PMTiles dataset, filtered by province/area_council.
    Requires intensity_data JSONField to be populated (from RAP GeoJSON export)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        dataset = get_dataset_for_read_or_404(PMTilesDataset, request, pk)
        intensity_data = dataset.intensity_data or []
        if not isinstance(intensity_data, list):
            return Response(
                {"type": "FeatureCollection", "features": []},
                status=status.HTTP_200_OK,
            )
        provinces = [p.strip().lower() for p in request.query_params.getlist("province") if p]
        area_councils = [a.strip().lower() for a in request.query_params.getlist("area_council") if a]
        filtered = []
        for item in intensity_data:
            if not isinstance(item, dict):
                continue
            ac = (item.get("acname") or item.get("area_council") or item.get("name") or "").strip()
            prov = (item.get("Province") or item.get("province") or "").strip()
            ac_lower = ac.lower()
            prov_lower = prov.lower()
            match_province = not provinces or prov_lower in provinces
            match_ac = not area_councils or ac_lower in area_councils
            if match_province and match_ac:
                filtered.append({
                    "type": "Feature",
                    "properties": {
                        "acname": ac,
                        "area_council": ac,
                        "Province": prov,
                        "province": prov,
                        "Intensity": item.get("Intensity") or item.get("intensity") or "",
                        "intensity": item.get("Intensity") or item.get("intensity") or "",
                        "intensity_color": item.get("intensity_color") or "",
                    },
                    "geometry": None,
                })
        return Response({
            "type": "FeatureCollection",
            "features": filtered,
        })


@method_decorator(cache_page(60 * 15), name="dispatch")  # 15 min cache
class AssetExposureView(APIView):
    """
    Exposure endpoint supports two modes:

    1) Asset-level exposure check by point:
       GET ?lat=<>&lng=<>&vector_layer_ids=1,2,3
       Returns [{ layer_id, layer_name }] for layers whose polygon features contain the point.

    2) Province-level exposure summary for Command Centre:
       GET ?group_by=province
       Returns [{ province, score, raw_count }] where score is normalized 0-100.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        group_by = (request.query_params.get("group_by") or "").strip().lower()
        if group_by == "province":
            from django.db.models import Count

            province_counts_qs = (
                VectorItem.objects.filter(
                    dataset__name__in=get_disaster_dataset_tag_names(),
                    province__isnull=False,
                )
                .values("province__name")
                .annotate(raw_count=Count("id"))
                .order_by("province__name")
            )
            counts_by_name = {
                row["province__name"]: row["raw_count"]
                for row in province_counts_qs
                if row.get("province__name")
            }

            all_provinces = list(
                Province.objects.values_list("name", flat=True).order_by("name")
            )
            max_count = max(counts_by_name.values(), default=0)
            response = []
            for province_name in all_provinces:
                raw_count = counts_by_name.get(province_name, 0)
                score = round((raw_count / max_count) * 100) if max_count > 0 else 0
                response.append(
                    {
                        "province": province_name,
                        "score": score,
                        "raw_count": raw_count,
                    }
                )
            return Response(response)

        try:
            lat = float(request.query_params.get("lat", 0))
            lng = float(request.query_params.get("lng", 0))
        except (TypeError, ValueError):
            return Response(
                {"detail": "lat and lng are required and must be numbers"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        layer_ids_param = request.query_params.get("vector_layer_ids", "")
        if not layer_ids_param:
            return Response([])
        try:
            layer_ids = [int(x.strip()) for x in layer_ids_param.split(",") if x.strip()]
        except ValueError:
            return Response(
                {"detail": "vector_layer_ids must be comma-separated integers"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not layer_ids:
            return Response([])

        point = Point(lng, lat, srid=4326)
        exposed = []
        visible = filter_queryset_for_public_api(
            VectorDataset.objects.filter(pk__in=layer_ids), request
        )
        for ds in visible:
            has_feature = VectorItem.objects.filter(
                dataset=ds,
                geometry__intersects=point,
            ).exists()
            if has_feature:
                exposed.append({"layer_id": ds.pk, "layer_name": ds.name})
        return Response(exposed)


@method_decorator(cache_page(60 * 15), name="dispatch")  # 15 min cache
class VectorDatasetListView(ListAPIView):
    serializer_class = VectorDatasetSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DatasetListPagination
    filterset_class = VectorDatasetFilter

    def get_queryset(self):
        return filter_queryset_for_public_api(VectorDataset.objects.all(), self.request)


class VectorDatasetDetailView(RetrieveAPIView):
    serializer_class = VectorDatasetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return filter_queryset_for_public_api(VectorDataset.objects.all(), self.request)


class VectorDatasetDataView(ListAPIView):
    serializer_class = VectorItemSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = GeoJsonPagination
    bbox_filter_field = "geometry"
    filterset_class = VectorItemFilter
    filter_backends = (
        InBBoxFilter,
        django_filters.rest_framework.DjangoFilterBackend,
    )

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        get_dataset_for_read_or_404(VectorDataset, request, self.kwargs.get("pk"))

    def get_queryset(self):
        from vbos.datasets.models import VectorDataset

        pk = self.kwargs.get("pk")
        qs = VectorItem.objects.filter(dataset=pk).select_related(
            "province", "area_council"
        )
        try:
            ds = VectorDataset.objects.filter(pk=pk).values(
                "climate_module", "climate_modules"
            ).first()
            if ds and (ds.get("climate_module") or (ds.get("climate_modules") or [])):
                qs = qs.transform(4326)
        except Exception:
            pass
        return qs

    def get_filter_backends(self):
        """Skip bbox filter for climate datasets; geometries may be in projected CRS."""
        from vbos.datasets.models import VectorDataset

        pk = self.kwargs.get("pk")
        try:
            ds = VectorDataset.objects.filter(pk=pk).values(
                "climate_module", "climate_modules"
            ).first()
            if ds:
                mod = ds.get("climate_module")
                mods = ds.get("climate_modules") or []
                if mod or mods:
                    return (django_filters.rest_framework.DjangoFilterBackend,)
        except Exception:
            pass
        return super().get_filter_backends()


@method_decorator(cache_page(60 * 15), name="dispatch")  # 15 min cache
class TabularDatasetListView(ListAPIView):
    serializer_class = TabularDatasetSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DatasetListPagination
    filterset_class = TabularDatasetFilter

    def get_queryset(self):
        return filter_queryset_for_public_api(
            TabularDataset.objects.select_related("cyclone_event"), self.request
        )


class TabularDatasetDetailView(RetrieveAPIView):
    serializer_class = TabularDatasetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return filter_queryset_for_public_api(
            TabularDataset.objects.select_related("cyclone_event"), self.request
        )


class TabularDatasetDataView(ListAPIView):
    filterset_class = TabularItemFilter
    permission_classes = [IsAuthenticated]
    serializer_class = TabularItemSerializer
    pagination_class = DataResultsSetPagination

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        get_dataset_for_read_or_404(TabularDataset, request, self.kwargs.get("pk"))

    def get_queryset(self):
        return TabularItem.objects.filter(
            dataset=self.kwargs.get("pk")
        ).select_related("province", "area_council")


class TabularDatasetXSLXDataView(XLSXFileMixin, TabularDatasetDataView):
    serializer_class = TabularItemExcelSerializer
    renderer_classes = (XLSXRenderer,)
    pagination_class = None

    def get_filename(self, request, *args, **kwargs):
        return f"vbos-mis-tabular-{kwargs.get('pk')}.xlsx"


class MapQueryPlanView(APIView):
    """
    POST JSON body: {"query": "Show schools in Tafea with more than 200 students"}
    Returns: {"plan": {...}, "warnings": [...]} for the frontend to apply to map state.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        key = getattr(settings, "AI_OPENAI_API_KEY", "") or ""
        if not (key and str(key).strip()):
            return Response(
                {
                    "detail": "AI map query is not configured. Set OPENAI_API_KEY (or AI_OPENAI_API_KEY).",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        q = request.data.get("query") if isinstance(request.data, dict) else None
        if not q or not str(q).strip():
            return Response(
                {"errors": {"query": ["This field is required."]}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        text = str(q).strip()
        if len(text) > 4000:
            return Response(
                {"errors": {"query": ["Maximum length is 4000 characters."]}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            result = run_map_query(text, request=request)
        except RuntimeError as e:
            return Response({"detail": str(e)}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(result)
