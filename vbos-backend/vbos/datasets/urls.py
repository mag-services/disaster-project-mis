from django.urls import path

from . import aggregate_views, audit_views, pmtiles_serve, views, workspace_views

app_name = "datasets"

urlpatterns = [
    path(
        "workspaces/",
        workspace_views.MapSavedWorkspaceListCreateView.as_view(),
        name="map-workspace-list",
    ),
    path(
        "workspaces/<int:pk>/",
        workspace_views.MapSavedWorkspaceDetailView.as_view(),
        name="map-workspace-detail",
    ),
    path(
        "ai/map-query/",
        views.MapQueryPlanView.as_view(),
        name="map-query-plan",
    ),
    path(
        "pmtiles-serve/<path:path>",
        pmtiles_serve.serve_pmtiles,
        name="pmtiles-serve",
    ),
    path("audit/", audit_views.AuditLogView.as_view(), name="audit-log"),
    path("cluster/", views.ClusterListView.as_view(), name="cluster-list"),
    path("cyclone-events/", views.CycloneEventListView.as_view(), name="cyclone-event-list"),
    path(
        "datasets/",
        views.ClusterDatasetsView.as_view(),
        name="cluster-datasets",
    ),
    path("provinces/", views.ProvinceListView.as_view(), name="province-list"),
    path(
        "provinces/<str:province>/area-councils/",
        views.AreaCouncilListView.as_view(),
        name="area-council-list",
    ),
    # raster
    path("raster/", views.RasterDatasetListView.as_view(), name="raster-list"),
    path(
        "raster/<int:pk>/",
        views.RasterDatasetDetailView.as_view(),
        name="raster-detail",
    ),
    # pmtiles
    path("pmtiles/", views.PMTilesDatasetListView.as_view(), name="pmtiles-list"),
    path(
        "pmtiles/<int:pk>/",
        views.PMTilesDatasetDetailView.as_view(),
        name="pmtiles-detail",
    ),
    path(
        "pmtiles/<int:pk>/intensity/",
        views.PMTilesIntensityView.as_view(),
        name="pmtiles-intensity",
    ),
    # vector
    path("vector/", views.VectorDatasetListView.as_view(), name="vector-list"),
    path(
        "vector/<int:pk>/",
        views.VectorDatasetDetailView.as_view(),
        name="vector-detail",
    ),
    path(
        "vector/<int:pk>/data/",
        views.VectorDatasetDataView.as_view(),
        name="vector-data",
    ),
    path(
        "exposure/",
        views.AssetExposureView.as_view(),
        name="asset-exposure",
    ),
    # tabular
    path("tabular/", views.TabularDatasetListView.as_view(), name="tabular-list"),
    path(
        "tabular/<int:pk>/",
        views.TabularDatasetDetailView.as_view(),
        name="tabular-detail",
    ),
    path(
        "tabular/<int:pk>/data/",
        views.TabularDatasetDataView.as_view(),
        name="tabular-data",
    ),
    path(
        "tabular/<int:pk>/aggregate/",
        aggregate_views.TabularAggregateView.as_view(),
        name="tabular-aggregate",
    ),
    path(
        "tabular/<int:pk>/data-xlsx/",
        views.TabularDatasetXSLXDataView.as_view(),
        name="tabular-data-xlsx",
    ),
]
