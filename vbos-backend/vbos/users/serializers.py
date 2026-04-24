from rest_framework import serializers

from vbos.organisations.serializers import OrganisationMiniSerializer

from .models import User, SMTPSettings


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """For PATCH /users/me/ - first_name, last_name, email only."""

    class Meta:
        model = User
        fields = ("first_name", "last_name", "email")


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)


class UserSerializer(serializers.ModelSerializer):
    groups = serializers.SlugRelatedField(
        many=True, read_only=True, slug_field="name"
    )
    organisation = OrganisationMiniSerializer(read_only=True)
    permissions = serializers.SerializerMethodField()
    avatar = serializers.ImageField(read_only=True)
    otp_required_for_all_logins = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "avatar",
            "organisation",
            "is_staff",
            "is_superuser",
            "mfa_enabled",
            "mfa_method",
            "otp_required_for_all_logins",
            "role",
            "groups",
            "permissions",
        )
        read_only_fields = ("username",)

    def get_permissions(self, obj):
        perms = obj.get_all_permissions()
        return list(perms)

    def get_otp_required_for_all_logins(self, obj):
        smtp = SMTPSettings.get_solo()
        return getattr(smtp, "otp_required_for_all_logins", True)

    def get_role(self, obj):
        """
        Canonical frontend role.
        Priority: staff/superuser -> admin; then group name mapping.
        """
        if obj.is_superuser or obj.is_staff:
            return "admin"

        group_names = {g.name.strip().lower() for g in obj.groups.all()}
        if any(name in group_names for name in {"field_officer", "field officer", "field-officer"}):
            return "field_officer"
        if any(name in group_names for name in {"analyst", "data_analyst", "data analyst"}):
            return "analyst"
        if any(name in group_names for name in {"read_only", "readonly", "read only", "viewer"}):
            return "read_only"
        return "analyst"


class CreateUserSerializer(serializers.ModelSerializer):
    def create(self, validated_data):
        # call create_user on user object. Without this
        # the password will be stored in plain text.
        user = User.objects.create_user(**validated_data)
        return user

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "password",
            "first_name",
            "last_name",
            "email",
            "auth_token",
        )
        read_only_fields = ("auth_token",)
        extra_kwargs = {"password": {"write_only": True}}
