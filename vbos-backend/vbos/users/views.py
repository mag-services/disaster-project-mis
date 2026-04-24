from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import User
from .permissions import IsAdminOrReadOnlySelf
from .serializers import (
    CreateUserSerializer,
    PasswordChangeSerializer,
    ProfileUpdateSerializer,
    UserSerializer,
)


class UserViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """
    Updates and retrieves user accounts. Only staff can create new users.
    """

    queryset = User.objects.select_related("organisation")
    serializer_class = UserSerializer
    permission_classes = (IsAdminOrReadOnlySelf,)

    def get_serializer_class(self):
        if self.action == "create":
            return CreateUserSerializer
        return self.serializer_class

    @action(detail=False, methods=["get", "patch", "put"], url_path="me", permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get or update the currently authenticated user."""
        if request.method == "GET":
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        # PATCH/PUT: update profile
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)

    @action(
        detail=False,
        methods=["post"],
        url_path="me/change-password",
        permission_classes=[IsAuthenticated],
    )
    def change_password(self, request):
        """Change current user password."""
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data["current_password"]):
            return Response(
                {"current_password": ["Current password is incorrect."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"detail": "Password updated successfully."})

    @action(
        detail=False,
        methods=["post"],
        url_path="me/avatar",
        permission_classes=[IsAuthenticated],
    )
    def avatar(self, request):
        """Upload avatar for current user."""
        file = request.FILES.get("avatar")
        if not file:
            return Response(
                {"avatar": ["No file provided."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Basic validation
        if file.size > 5 * 1024 * 1024:  # 5MB
            return Response(
                {"avatar": ["File too large. Max 5MB."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        allowed = ("image/jpeg", "image/png", "image/gif", "image/webp")
        if file.content_type not in allowed:
            return Response(
                {"avatar": ["Invalid format. Use JPEG, PNG, GIF, or WebP."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = request.user
        if user.avatar:
            user.avatar.delete(save=False)
        user.avatar = file
        user.save()
        return Response(UserSerializer(user).data)
