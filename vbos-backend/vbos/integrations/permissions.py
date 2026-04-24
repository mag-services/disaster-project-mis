"""
Permissions for integration API endpoints.
"""
from rest_framework import permissions


class IsIntegrationAPIKey(permissions.BasePermission):
    """Allow only requests authenticated via Integration API key."""

    def has_permission(self, request, view):
        if not request.user:
            return False
        # Our auth returns (IntegrationAPIKey, IntegrationAPIKey) as user
        from .models import IntegrationAPIKey
        return isinstance(request.user, IntegrationAPIKey)
