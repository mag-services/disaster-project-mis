from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin, UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from django import forms
from django.shortcuts import redirect
from django.urls import path, reverse
from unfold.admin import ModelAdmin as UnfoldModelAdmin
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from .models import User, SMTPSettings


class Role(Group):
    """Proxy model to display as 'Role' instead of 'Group' in admin."""

    class Meta:
        proxy = True
        verbose_name = "Role"
        verbose_name_plural = "Roles"


@admin.register(User)
class UserAdmin(BaseUserAdmin, UnfoldModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm
    autocomplete_fields = ("organisation",)
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Organisation", {"fields": ("organisation",)}),
        ("Two-factor authentication", {"fields": ("mfa_enabled", "mfa_method")}),
    )


# Replace Group with Role in admin (Roles and Permissions section)
admin.site.unregister(Group)


@admin.register(Role)
class RoleAdmin(BaseGroupAdmin, UnfoldModelAdmin):
    pass


class SMTPSettingsForm(forms.ModelForm):
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={"autocomplete": "new-password"}),
        required=False,
        help_text="Leave blank to keep current password.",
    )

    class Meta:
        model = SMTPSettings
        fields = [
            "backend",
            "host",
            "port",
            "use_tls",
            "use_ssl",
            "username",
        "password",
        "from_email",
        "fail_silently",
        "otp_required_for_all_logins",
    ]

    def save(self, commit=True):
        instance = super().save(commit=False)
        if not self.cleaned_data.get("password") and instance.pk:
            # Keep existing password when field left blank
            instance.password = SMTPSettings.objects.get(pk=instance.pk).password
        if commit:
            instance.save()
        return instance


@admin.register(SMTPSettings)
class SMTPSettingsAdmin(UnfoldModelAdmin):
    form = SMTPSettingsForm
    list_display = ["backend", "host", "port", "otp_required_for_all_logins", "from_email"]
    fieldsets = (
        (None, {"fields": ("backend",)}),
        (
            "Login security",
            {
                "fields": ("otp_required_for_all_logins",),
                "description": "When enabled, every login requires a 6-digit code sent to email. When disabled, users can optionally enable 2FA in their profile.",
            },
        ),
        ("SMTP Server", {"fields": ("host", "port", "use_tls", "use_ssl")}),
        ("Authentication", {"fields": ("username", "password")}),
        ("Sender", {"fields": ("from_email",)}),
        ("Advanced", {"fields": ("fail_silently",)}),
    )

    def has_add_permission(self, request):
        return not SMTPSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        obj = SMTPSettings.get_solo()
        return redirect(reverse("admin:users_smtpsettings_change", args=[obj.pk]))
