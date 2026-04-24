"""
API Key authentication for departmental MIS integration.
"""
from django.utils import timezone
from rest_framework import authentication
from rest_framework import exceptions

from .models import IntegrationAPIKey


def _get_api_key(request):
    """Extract API key from X-API-Key or Authorization: ApiKey <key>."""
    key = request.META.get("HTTP_X_API_KEY")
    if key:
        return key.strip()
    auth = request.META.get("HTTP_AUTHORIZATION")
    if auth and auth.startswith("ApiKey "):
        return auth[7:].strip()
    return None


class IntegrationAPIKeyAuthentication(authentication.BaseAuthentication):
    """
    Authenticate requests using Integration API keys.
    Use header: X-API-Key: <key> or Authorization: ApiKey <key>
    """
    keyword = "ApiKey"

    def authenticate(self, request):
        key = _get_api_key(request)
        if not key:
            return None

        for api_key in IntegrationAPIKey.objects.filter(is_active=True).select_related("source"):
            if not api_key.source.is_active:
                continue
            if api_key.check_key(key):
                IntegrationAPIKey.objects.filter(pk=api_key.pk).update(last_used=timezone.now())
                return (api_key, api_key)

        raise exceptions.AuthenticationFailed("Invalid or inactive API key.")
