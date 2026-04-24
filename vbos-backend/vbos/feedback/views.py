from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Feedback
from .serializers import FeedbackSerializer


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_feedback(request):
    """
    Submit user feedback with optional screenshot.
    Body (multipart): category, message, screenshot?, user_email?, page_url?, user_agent?
    """
    data = request.data.copy()

    # Auto-fill context from request if not provided
    if not data.get("user_email") and request.user.email:
        data["user_email"] = request.user.email
    if not data.get("page_url") and request.META.get("HTTP_REFERER"):
        data["page_url"] = request.META["HTTP_REFERER"][:500]
    if not data.get("user_agent") and request.META.get("HTTP_USER_AGENT"):
        data["user_agent"] = request.META["HTTP_USER_AGENT"][:500]

    serializer = FeedbackSerializer(data=data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response({"detail": "Thank you for your feedback."}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
