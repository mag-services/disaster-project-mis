from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import LandAccountsData


class LandAccountsView(APIView):
    """
    GET: Return land accounts data (authenticated users).
    PUT: Update land accounts data (admin only).
    """

    def get_permissions(self):
        if self.request.method == "PUT":
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get(self, request):
        """Return the current land accounts data."""
        obj = LandAccountsData.objects.first()
        if not obj:
            return Response(
                {"provinces": {}},
                status=status.HTTP_200_OK,
            )
        return Response(obj.data)

    def put(self, request):
        """Replace land accounts data. Admin only."""
        data = request.data
        if not isinstance(data, dict):
            return Response(
                {"detail": "Request body must be a JSON object with 'provinces' key."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if "provinces" not in data:
            return Response(
                {"detail": "Missing 'provinces' key."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        obj = LandAccountsData.objects.first()
        if not obj:
            obj = LandAccountsData.objects.create(data=data)
        else:
            obj.data = data
            obj.save()
        return Response(obj.data, status=status.HTTP_200_OK)
