from rest_framework import permissions


class IsAdminOrReadOnlySelf(permissions.BasePermission):
    """
    - Only staff users can create new users (admin adds users).
    - Users can read their own profile, staff can read any.
    - Users can update their own profile (e.g. password), staff can update any.
    """

    def has_permission(self, request, view):
        if view.action == "create":
            return request.user and request.user.is_staff
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if view.action == "create":
            return request.user and request.user.is_staff

        is_read_only = request.method in permissions.SAFE_METHODS
        if is_read_only:
            return request.user.is_staff or obj == request.user

        return request.user.is_staff or obj == request.user
