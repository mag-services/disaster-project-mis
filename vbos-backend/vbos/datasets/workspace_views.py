from django.db.utils import OperationalError, ProgrammingError
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated

from vbos.datasets.models import MapSavedWorkspace
from vbos.datasets.workspace_serializers import (
    MapSavedWorkspaceCreateSerializer,
    MapSavedWorkspaceDetailSerializer,
    MapSavedWorkspaceListSerializer,
    MapSavedWorkspaceUpdateSerializer,
)

MAX_SAVED_MAP_WORKSPACES_PER_USER = 30

# Raised when migration 0046_map_saved_workspace (MapSavedWorkspace) is not applied.
_DB_TABLE_ERRORS = (OperationalError, ProgrammingError)


def _workspace_table_missing(exc: BaseException) -> bool:
    msg = str(exc).lower()
    return "mapsavedworkspace" in msg


class WorkspaceDatabaseNotReady(APIException):
    status_code = 503
    default_detail = (
        "Saved workspaces need the database table from migration "
        "0046_map_saved_workspace. Run: python manage.py migrate datasets"
    )
    default_code = "workspace_table_missing"


class _MapWorkspaceDbGuardMixin:
    """Return JSON 503 with a migration hint instead of HTML 500 when the table is missing."""

    def dispatch(self, request, *args, **kwargs):
        try:
            return super().dispatch(request, *args, **kwargs)
        except _DB_TABLE_ERRORS as exc:
            if _workspace_table_missing(exc):
                raise WorkspaceDatabaseNotReady() from exc
            raise


class MapSavedWorkspaceListCreateView(_MapWorkspaceDbGuardMixin, ListCreateAPIView):
    """
    GET: list current user's saved workspaces (metadata only).
    POST: save current layout — body {"name": "...", "payload": {...}}.
    """

    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return MapSavedWorkspace.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return MapSavedWorkspaceCreateSerializer
        return MapSavedWorkspaceListSerializer

    def perform_create(self, serializer):
        user = self.request.user
        n = MapSavedWorkspace.objects.filter(user=user).count()
        if n >= MAX_SAVED_MAP_WORKSPACES_PER_USER:
            raise ValidationError(
                {
                    "detail": f"Maximum {MAX_SAVED_MAP_WORKSPACES_PER_USER} saved workspaces. "
                    "Delete one before saving a new layout."
                }
            )
        serializer.save(user=user)


class MapSavedWorkspaceDetailView(_MapWorkspaceDbGuardMixin, RetrieveUpdateDestroyAPIView):
    """GET full payload, PATCH rename/update payload, DELETE."""

    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = "pk"

    def get_queryset(self):
        return MapSavedWorkspace.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return MapSavedWorkspaceUpdateSerializer
        return MapSavedWorkspaceDetailSerializer
