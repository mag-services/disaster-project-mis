from rest_framework import permissions


def user_is_area_admin(user):
    """Check if user has an AreaAdministrator profile."""
    return hasattr(user, "area_administrator") and user.area_administrator is not None


def user_can_manage_area(user, province, area_council):
    """Check if area admin can manage this province/area_council."""
    if not user_is_area_admin(user):
        return False
    aa = user.area_administrator
    if area_council:
        return aa.area_councils.filter(pk=area_council.pk).exists()
    return aa.provinces.filter(pk=province.pk).exists()


class IsAreaAdminOrStaff(permissions.BasePermission):
    """Allow area admins (for their areas) and staff."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff:
            return True
        return user_is_area_admin(request.user)
