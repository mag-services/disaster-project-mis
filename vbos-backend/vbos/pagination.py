"""Shared DRF pagination defaults (count / next / previous / results)."""

from rest_framework.pagination import PageNumberPagination


class VbosPageNumberPagination(PageNumberPagination):
    """
    Default list pagination — always exposes `count`, `next`, `previous`, `results`.
    Clients may use `?page=` and `?page_size=` (capped).
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200
