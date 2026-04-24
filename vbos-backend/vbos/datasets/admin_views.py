"""Admin-only views (icon picker, etc.)."""

import json
from pathlib import Path

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET


def _get_flaticon_icons():
    """Load Flaticon icon list from static JSON."""
    static_dir = Path(__file__).resolve().parent / "static" / "datasets"
    json_path = static_dir / "flaticon-icons.json"
    if not json_path.exists():
        return []
    with open(json_path, encoding="utf-8") as f:
        return json.load(f)


# Humanitarian cluster icons (Flaticon equivalents) - shown at top of picker
CLUSTER_ICONS = [
    ("Education", "fi-sr-graduation-cap"),
    ("Emergency", "fi-sr-broadcast-tower"),
    ("Energy", "fi-sr-bolt"),
    ("Food", "fi-sr-utensils"),
    ("Gender", "fi-sr-users"),
    ("Health", "fi-sr-heart"),
    ("Logistics", "fi-sr-truck-moving"),
    ("Shelter", "fi-sr-shield"),
    ("Business", "fi-sr-briefcase"),
    ("WASH", "fi-sr-bottle-droplet"),
    # Water / plumbing (faucet = water valve)
    ("Water valve", "fi-sr-faucet"),
    ("Tap", "fi-sr-tap"),
    ("Water", "fi-sr-water"),
]


@require_GET
def icon_picker(request):
    """Searchable icon picker page for Flaticon Uicons."""
    icons = _get_flaticon_icons()
    context = {
        "icons_json": json.dumps(icons),
        "icon_count": len(icons),
        "cluster_icons": CLUSTER_ICONS,
    }
    return render(request, "admin/icon_picker.html", context)


@require_GET
def icon_list_json(request):
    """JSON endpoint for icon list (for dynamic loading if needed)."""
    icons = _get_flaticon_icons()
    return JsonResponse(icons, safe=False)
