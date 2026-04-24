"""Custom auth app config: rename to Roles and Permissions."""

from django.contrib.auth.apps import AuthConfig


class RolesAndPermissionsConfig(AuthConfig):
    verbose_name = "Roles and Permissions"
