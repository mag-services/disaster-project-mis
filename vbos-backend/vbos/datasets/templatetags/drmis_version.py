"""DRMIS release string for admin footer (single source: settings.DRMIS_VERSION_DISPLAY)."""

from django import template
from django.conf import settings

register = template.Library()


@register.simple_tag
def drmis_version_display() -> str:
    return getattr(settings, "DRMIS_VERSION_DISPLAY", "v1.0.0 · Build 2026.03.21")
