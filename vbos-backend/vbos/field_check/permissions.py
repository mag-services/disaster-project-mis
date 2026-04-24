from rest_framework import permissions

from vbos.area_submissions.permissions import user_is_area_admin, user_can_manage_area


class IsAreaAdminOrStaff(permissions.BasePermission):
    """Allow area administrators (for field checks) and staff. Area admins are the ones who do field checks."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff:
            return True
        return user_is_area_admin(request.user)
