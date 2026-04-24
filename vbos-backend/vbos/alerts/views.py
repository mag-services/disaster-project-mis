"""
Alert API views.

GET /api/v1/alerts/live/       — combined feed: DRMIS + USGS + VMGD + GDACS
GET /api/v1/alerts/earthquakes/ — USGS M4.0+ earthquakes near Vanuatu
GET /api/v1/alerts/vmgd/        — VMGD weather / volcano warnings
GET /api/v1/alerts/gdacs/       — GDACS global disaster alerts for Vanuatu
"""
from datetime import datetime, timezone
from uuid import uuid4

from django.core.files.storage import default_storage
from django.utils import timezone as dj_timezone
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from vbos.datasets.models import Province
from .external import fetch_gdacs, fetch_usgs, fetch_vmgd
from .models import Alert
from .serializers import AlertCreateSerializer, AlertSerializer


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class USGSEarthquakeView(APIView):
    """Public USGS feed (no auth)."""
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        alerts, status = fetch_usgs()
        return Response(
            {
                "alerts": alerts,
                "source": "USGS",
                "status": status,
                "updated_at": _now_iso(),
                "count": len(alerts),
            }
        )


class VMGDWarningsView(APIView):
    """Public VMGD feed (no auth)."""
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        alerts, status = fetch_vmgd()
        return Response(
            {
                "alerts": alerts,
                "source": "VMGD",
                "status": status,
                "updated_at": _now_iso(),
                "count": len(alerts),
            }
        )


class GDACSAlertsView(APIView):
    """Public GDACS feed (no auth)."""
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        alerts, status = fetch_gdacs()
        return Response(
            {
                "alerts": alerts,
                "source": "GDACS",
                "status": status,
                "updated_at": _now_iso(),
                "count": len(alerts),
            }
        )


class CombinedAlertsView(APIView):
    """
    Merged live alerts feed. Fetches all three external sources concurrently
    and merges with active internal (DRMIS) alerts for authenticated users only.
    Sorted newest-first by issued_at.

    Anonymous clients may read the combined feed (public external sources);
    internal DRMIS rows require auth.
    """

    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        import concurrent.futures

        sources: dict[str, str] = {}

        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
            f_usgs = pool.submit(fetch_usgs)
            f_vmgd = pool.submit(fetch_vmgd)
            f_gdacs = pool.submit(fetch_gdacs)

            usgs_alerts, usgs_status = f_usgs.result()
            vmgd_alerts, vmgd_status = f_vmgd.result()
            gdacs_alerts, gdacs_status = f_gdacs.result()

        sources["USGS"] = usgs_status
        sources["VMGD"] = vmgd_status
        sources["GDACS"] = gdacs_status

        internal_alerts: list
        if request.user.is_authenticated:
            internal_qs = Alert.objects.filter(is_active=True).select_related("province")[:20]
            internal_alerts = AlertSerializer(internal_qs, many=True).data
            for a in internal_alerts:
                a["id"] = f"drmis-{a['id']}"
            sources["DRMIS"] = "ok"
        else:
            internal_alerts = []
            sources["DRMIS"] = "auth_required"

        all_alerts = list(internal_alerts) + usgs_alerts + vmgd_alerts + gdacs_alerts

        # Sort newest first
        def _sort_key(a: dict) -> str:
            return a.get("issued_at") or ""

        all_alerts.sort(key=_sort_key, reverse=True)

        return Response(
            {
                "alerts": all_alerts,
                "sources": sources,
                "updated_at": _now_iso(),
                "count": len(all_alerts),
            }
        )


class AlertCreateView(APIView):
    """
    Create internal DRMIS incident alert.

    POST /api/v1/alerts/
    Accepts JSON or multipart form data with optional image file `photo`.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request: Request) -> Response:
        payload = request.data.copy()

        # Accept province by name for frontend convenience.
        province_name = (payload.get("province_name") or "").strip()
        if province_name and not payload.get("province"):
            province = Province.objects.filter(name__iexact=province_name).first()
            if province:
                payload["province"] = province.pk

        # Optional area council is preserved as context in summary.
        area_council_name = (payload.get("area_council_name") or "").strip()
        summary = payload.get("summary") or ""
        if area_council_name:
            summary = f"{summary}\n\nArea council: {area_council_name}".strip()
            payload["summary"] = summary

        serializer = AlertCreateSerializer(data=payload)
        serializer.is_valid(raise_exception=True)

        # Optional image upload: store file and expose URL via `url` field.
        photo = request.FILES.get("photo")
        photo_url = ""
        if photo:
            allowed = {"image/jpeg", "image/png", "image/gif", "image/webp"}
            if photo.content_type not in allowed:
                return Response(
                    {"photo": ["Invalid format. Use JPEG, PNG, GIF, or WebP."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if photo.size > 5 * 1024 * 1024:
                return Response(
                    {"photo": ["File too large. Max 5MB."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            ext = (photo.name.rsplit(".", 1)[-1] if "." in photo.name else "jpg").lower()
            file_path = default_storage.save(f"alerts/incidents/{uuid4().hex}.{ext}", photo)
            photo_url = request.build_absolute_uri(default_storage.url(file_path))

        alert = serializer.save(
            source="DRMIS",
            created_by=request.user,
            issued_at=serializer.validated_data.get("issued_at") or dj_timezone.now(),
            url=serializer.validated_data.get("url") or photo_url or "",
        )

        return Response(AlertSerializer(alert).data, status=status.HTTP_201_CREATED)
