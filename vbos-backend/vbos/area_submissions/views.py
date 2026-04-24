from django.utils import timezone
from rest_framework import status
from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
    get_object_or_404,
)
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AreaDataSubmission
from .permissions import IsAreaAdminOrStaff, user_is_area_admin, user_can_manage_area
from .serializers import (
    AreaDataSubmissionSerializer,
    AreaDataSubmissionCreateUpdateSerializer,
)
from .services import promote_submission_to_tabular


class AreaAdminAreasView(APIView):
    """Return provinces and area councils. Area admins get their assigned areas; staff get all."""
    permission_classes = [IsAreaAdminOrStaff]

    def get(self, request):
        from vbos.datasets.models import Province, AreaCouncil

        if request.user.is_staff:
            provinces = [{"id": p.id, "name": p.name} for p in Province.objects.order_by("name")]
            area_councils = [
                {"id": ac.id, "name": ac.name, "province_id": ac.province_id, "province_name": ac.province.name}
                for ac in AreaCouncil.objects.select_related("province").order_by("province__name", "name")
            ]
            return Response({"provinces": provinces, "area_councils": area_councils})

        if not user_is_area_admin(request.user):
            return Response(
                {"detail": "You are not an area administrator."},
                status=status.HTTP_403_FORBIDDEN,
            )
        aa = request.user.area_administrator
        provinces = [
            {"id": p.id, "name": p.name}
            for p in aa.provinces.all().order_by("name")
        ]
        area_councils = [
            {"id": ac.id, "name": ac.name, "province_id": ac.province_id, "province_name": ac.province.name}
            for ac in aa.area_councils.select_related("province").order_by("province__name", "name")
        ]
        return Response({
            "provinces": provinces,
            "area_councils": area_councils,
        })


class AreaSubmissionListCreateView(ListCreateAPIView):
    """
    List: area admins see their submissions; staff see all.
    Create: area admins create for their areas only.
    """
    permission_classes = [IsAreaAdminOrStaff]
    serializer_class = AreaDataSubmissionSerializer

    def get_queryset(self):
        qs = AreaDataSubmission.objects.select_related(
            "dataset", "province", "area_council", "submitted_by"
        ).order_by("-updated")
        if self.request.user.is_staff:
            return qs
        if user_is_area_admin(self.request.user):
            aa = self.request.user.area_administrator
            ac_ids = list(aa.area_councils.values_list("pk", flat=True))
            prov_ids = list(aa.provinces.values_list("pk", flat=True))
            from django.db.models import Q
            return qs.filter(
                Q(area_council_id__in=ac_ids) | Q(area_council__isnull=True, province_id__in=prov_ids)
            ).filter(submitted_by=self.request.user)
        return qs.none()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AreaDataSubmissionCreateUpdateSerializer
        return AreaDataSubmissionSerializer

    def perform_create(self, serializer):
        province = serializer.validated_data.get("province")
        area_council = serializer.validated_data.get("area_council")
        if not self.request.user.is_staff and not user_can_manage_area(
            self.request.user, province, area_council
        ):
            raise PermissionError("You can only create submissions for your assigned areas.")
        serializer.save(
            submitted_by=self.request.user,
            status=AreaDataSubmission.STATUS_DRAFT,
        )

    def create(self, request: Request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_create(serializer)
        except PermissionError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(
            AreaDataSubmissionSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )


class AreaSubmissionDetailView(RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update (draft only), delete.
    Area admins can only access their own submissions for their areas.
    """
    permission_classes = [IsAreaAdminOrStaff]
    serializer_class = AreaDataSubmissionSerializer
    queryset = AreaDataSubmission.objects.select_related(
        "dataset", "province", "area_council", "submitted_by"
    )

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_staff:
            return qs
        return qs.filter(submitted_by=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return AreaDataSubmissionCreateUpdateSerializer
        return AreaDataSubmissionSerializer

    def perform_update(self, serializer):
        instance = serializer.instance
        if instance.status != AreaDataSubmission.STATUS_DRAFT:
            raise ValueError("Only draft submissions can be edited.")
        if not self.request.user.is_staff and not user_can_manage_area(
            self.request.user, instance.province, instance.area_council
        ):
            raise PermissionError("You can only edit submissions for your assigned areas.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_update(serializer)
        except (PermissionError, ValueError) as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(AreaDataSubmissionSerializer(serializer.instance).data)


class AreaSubmissionSubmitView(APIView):
    """Submit a draft for approval. POST only."""
    permission_classes = [IsAreaAdminOrStaff]

    def post(self, request, pk):
        submission = get_object_or_404(AreaDataSubmission, pk=pk)
        if submission.status != AreaDataSubmission.STATUS_DRAFT:
            return Response(
                {"detail": "Only draft submissions can be submitted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not request.user.is_staff and submission.submitted_by != request.user:
            return Response(
                {"detail": "You can only submit your own submissions."},
                status=status.HTTP_403_FORBIDDEN,
            )
        submission.status = AreaDataSubmission.STATUS_SUBMITTED
        submission.submitted_at = timezone.now()
        submission.save()
        return Response(AreaDataSubmissionSerializer(submission).data)


class AreaSubmissionApproveView(APIView):
    """VBoS: approve a submission. POST only."""
    permission_classes = [IsAreaAdminOrStaff]

    def post(self, request, pk):
        if not request.user.is_staff:
            return Response(
                {"detail": "Only staff can approve submissions."},
                status=status.HTTP_403_FORBIDDEN,
            )
        submission = get_object_or_404(AreaDataSubmission, pk=pk)
        if submission.status != AreaDataSubmission.STATUS_SUBMITTED:
            return Response(
                {"detail": "Only submitted submissions can be approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        submission.status = AreaDataSubmission.STATUS_APPROVED
        submission.reviewed_by = request.user
        submission.reviewed_at = timezone.now()
        submission.rejection_reason = ""
        submission.save()
        promote_submission_to_tabular(submission)
        return Response(AreaDataSubmissionSerializer(submission).data)


class AreaSubmissionRejectView(APIView):
    """VBoS: reject a submission. POST with optional rejection_reason."""
    permission_classes = [IsAreaAdminOrStaff]

    def post(self, request, pk):
        if not request.user.is_staff:
            return Response(
                {"detail": "Only staff can reject submissions."},
                status=status.HTTP_403_FORBIDDEN,
            )
        submission = get_object_or_404(AreaDataSubmission, pk=pk)
        if submission.status != AreaDataSubmission.STATUS_SUBMITTED:
            return Response(
                {"detail": "Only submitted submissions can be rejected."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        submission.status = AreaDataSubmission.STATUS_REJECTED
        submission.reviewed_by = request.user
        submission.reviewed_at = timezone.now()
        submission.rejection_reason = request.data.get("rejection_reason", "")
        submission.save()
        return Response(AreaDataSubmissionSerializer(submission).data)
