from rest_framework.pagination import PageNumberPagination
from rest_framework_gis.pagination import GeoJsonPagination as BaseGeoJsonPagination


class GeoJsonPagination(BaseGeoJsonPagination):
    """GeoJSON pagination with large page size for vector data (e.g. Rates of Change)."""
    page_size = 5000
    page_size_query_param = "page_size"
    max_page_size = 10000


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200


class DatasetListPagination(PageNumberPagination):
    """Larger page size for dataset list endpoints to reduce round-trips."""
    page_size = 100
    page_size_query_param = "page_size"
    max_page_size = 500


class DataResultsSetPagination(PageNumberPagination):
    """Larger page sizes for tabular/vector data endpoints to reduce round-trips."""
    page_size = 1000
    page_size_query_param = "page_size"
    max_page_size = 5000
