"""
Two-factor authentication: email OTP and TOTP (Microsoft Authenticator).
"""
import base64
import logging
import os
import random
import string
from django.conf import settings
from django.core.cache import cache
from django.core.mail import get_connection, send_mail
from django.core.signing import BadSignature, TimestampSigner
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from django_otp.plugins.otp_totp.models import TOTPDevice
import pyotp
import qrcode
import qrcode.image.svg
import io

from .models import User, MFA_EMAIL, MFA_TOTP, SMTPSettings
from .serializers import UserSerializer

TEMP_TOKEN_MAX_AGE = 300  # 5 minutes
OTP_CACHE_PREFIX = "mfa_otp:"
TOTP_SETUP_PREFIX = "totp_setup:"
OTP_CACHE_TTL = 300  # 5 minutes
TOTP_SETUP_TTL = 600  # 10 minutes for setup
OTP_LENGTH = 6

logger = logging.getLogger(__name__)


def _generate_temp_token(user_id: str) -> str:
    signer = TimestampSigner()
    return signer.sign(str(user_id))


def _verify_temp_token(token: str) -> User | None:
    try:
        signer = TimestampSigner()
        user_id = signer.unsign(token, max_age=TEMP_TOKEN_MAX_AGE)
        return User.objects.get(pk=user_id)
    except (BadSignature, User.DoesNotExist):
        return None


def _generate_email_otp() -> str:
    return "".join(random.choices(string.digits, k=OTP_LENGTH))


def _get_email_connection():
    """Return an email connection from admin-configured SMTPSettings or Django defaults."""
    smtp = SMTPSettings.get_solo()
    if smtp.backend == "console":
        return get_connection("django.core.mail.backends.console.EmailBackend")
    if smtp.backend == "django_default":
        return get_connection()
    return get_connection(
        backend="django.core.mail.backends.smtp.EmailBackend",
        host=smtp.host,
        port=smtp.port,
        username=smtp.username or None,
        password=smtp.password or None,
        use_tls=smtp.use_tls,
        use_ssl=smtp.use_ssl,
        fail_silently=smtp.fail_silently,
    )


def _send_email_otp(user: User, code: str) -> None:
    subject = "Your DRMIS verification code"
    message = f"Your verification code is: {code}\n\nThis code expires in 5 minutes. Do not share it."
    smtp = SMTPSettings.get_solo()
    from_email = (
        getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@example.com")
        if smtp.backend == "django_default"
        else smtp.from_email
    )
    connection = _get_email_connection()
    fail_silently = smtp.fail_silently if smtp.backend == "smtp" else False
    send_mail(
        subject,
        message,
        from_email,
        [user.email],
        connection=connection,
        fail_silently=fail_silently,
    )


def _store_email_otp(user_id: str, code: str) -> None:
    cache.set(f"{OTP_CACHE_PREFIX}{user_id}", code, OTP_CACHE_TTL)


def _verify_email_otp(user_id: str, code: str) -> bool:
    key = f"{OTP_CACHE_PREFIX}{user_id}"
    stored = cache.get(key)
    if stored and stored == code:
        cache.delete(key)
        return True
    return False


def _otp_required_for_login(user: User) -> bool:
    """True if this login must go through email OTP verification."""
    # DISABLE_2FA_GLOBALLY env can force off (e.g. for recovery)
    if os.getenv("DISABLE_2FA_GLOBALLY", "").lower() in ("true", "1", "yes"):
        return False
    smtp = SMTPSettings.get_solo()
    if getattr(smtp, "otp_required_for_all_logins", True):
        return bool(user.email)
    return user.mfa_enabled and user.mfa_method == MFA_EMAIL


@api_view(["POST"])
@permission_classes([AllowAny])
def obtain_auth_token(request):
    """
    Login: username + password. If OTP required (global or per-user 2FA), sends code to email
    and returns requires_2fa + temp_token. Otherwise returns token.
    """
    from rest_framework.authtoken.serializers import AuthTokenSerializer

    serializer = AuthTokenSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]

    if _otp_required_for_login(user):
        if not user.email:
            return Response(
                {"non_field_errors": ["No email on file. Contact your administrator."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        code = _generate_email_otp()
        _store_email_otp(str(user.pk), code)
        try:
            _send_email_otp(user, code)
        except Exception:
            logger.exception("OTP email send failed for user_id=%s", user.pk)
            return Response(
                {
                    "non_field_errors": [
                        "Could not send verification email. From Docker, set Admin → SMTP settings "
                        "host to mailhog (port 1025, no TLS), or set DISABLE_2FA_GLOBALLY=true for local dev."
                    ],
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        temp_token = _generate_temp_token(str(user.pk))
        return Response({
            "requires_2fa": True,
            "temp_token": temp_token,
            "mfa_method": "email",
        })

    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key})


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_2fa(request):
    """
    Verify 2FA code and return auth token.
    Body: { temp_token, code }
    """
    temp_token = request.data.get("temp_token")
    code = request.data.get("code", "").strip().replace(" ", "")

    if not temp_token or not code:
        return Response(
            {"non_field_errors": ["temp_token and code are required"]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = _verify_temp_token(temp_token)
    if not user:
        return Response(
            {"non_field_errors": ["Invalid or expired verification link. Please sign in again."]},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Email OTP: mandatory for all logins or per-user 2FA
    if user.mfa_method == MFA_EMAIL or _otp_required_for_login(user):
        if not _verify_email_otp(str(user.pk), code):
            return Response(
                {"non_field_errors": ["Invalid or expired code. Please try again or request a new code."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
    elif user.mfa_method == MFA_TOTP:
        device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
        if not device or not device.verify_token(code):
            return Response(
                {"non_field_errors": ["Invalid code. Please try again."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
    else:
        return Response(
            {"non_field_errors": ["2FA method not configured."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key})


@api_view(["POST"])
@permission_classes([AllowAny])
def resend_email_otp(request):
    """
    Resend email OTP. Body: { temp_token }
    """
    temp_token = request.data.get("temp_token")
    if not temp_token:
        return Response(
            {"non_field_errors": ["temp_token is required"]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = _verify_temp_token(temp_token)
    if not user or not _otp_required_for_login(user):
        return Response(
            {"non_field_errors": ["Invalid or expired. Please sign in again."]},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.email:
        return Response(
            {"non_field_errors": ["No email address on file. Contact your administrator."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    code = _generate_email_otp()
    _store_email_otp(str(user.pk), code)
    try:
        _send_email_otp(user, code)
    except Exception:
        logger.exception("OTP resend email failed for user_id=%s", user.pk)
        return Response(
            {
                "non_field_errors": [
                    "Could not send verification email. Check SMTP settings (from Docker use host mailhog, port 1025)."
                ],
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response({"detail": "Verification code sent to your email."})


# --- Setup endpoints (require auth) ---

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def setup_totp_request(request):
    """
    Start TOTP setup: generate secret, return QR code and secret for manual entry.
    """
    user = request.user
    if user.mfa_enabled:
        return Response(
            {"non_field_errors": ["Disable 2FA first to change method."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Remove any existing unconfirmed TOTP device
    TOTPDevice.objects.filter(user=user, confirmed=False).delete()

    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=user.email or user.username,
        issuer_name=getattr(settings, "OTP_TOTP_ISSUER", "DRMIS"),
    )

    # Generate QR as SVG
    factory = qrcode.image.svg.SvgPathImage
    img = qrcode.make(provisioning_uri, image_factory=factory)
    buf = io.BytesIO()
    img.save(buf)
    qr_svg = buf.getvalue().decode("utf-8")

    # Store secret in cache until verified (API uses Token auth, not sessions)
    cache.set(f"{TOTP_SETUP_PREFIX}{user.pk}", secret, TOTP_SETUP_TTL)

    return Response({
        "secret": secret,
        "qr_svg": qr_svg,
        "provisioning_uri": provisioning_uri,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def setup_totp_verify(request):
    """
    Verify TOTP setup with a code from the app, then enable 2FA.
    Body: { code }
    """
    user = request.user
    code = request.data.get("code", "").strip().replace(" ", "")

    secret = cache.get(f"{TOTP_SETUP_PREFIX}{user.pk}")
    if not secret:
        return Response(
            {"non_field_errors": ["TOTP setup expired. Please start again."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    totp = pyotp.TOTP(secret)
    if not totp.verify(code, valid_window=1):
        return Response(
            {"non_field_errors": ["Invalid code. Please try again."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Create and confirm device
    # django-otp TOTPDevice expects hex-encoded key; pyotp uses base32 for the app
    hex_key = base64.b32decode(secret).hex()
    TOTPDevice.objects.filter(user=user).delete()
    TOTPDevice.objects.create(
        user=user,
        name="default",
        confirmed=True,
        key=hex_key,
        tolerance=2,  # Allow ±2 steps (~2 min) for clock drift between server and phone
    )

    cache.delete(f"{TOTP_SETUP_PREFIX}{user.pk}")

    user.mfa_enabled = True
    user.mfa_method = MFA_TOTP
    user.save(update_fields=["mfa_enabled", "mfa_method"])

    return Response({
        "detail": "Authenticator app enabled.",
        "mfa_enabled": True,
        "mfa_method": MFA_TOTP,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def setup_email_otp(request):
    """
    Enable email OTP. User must have email set.
    """
    user = request.user
    if user.mfa_enabled:
        return Response(
            {"non_field_errors": ["Disable 2FA first to change method."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not user.email:
        return Response(
            {"non_field_errors": ["Add an email address in your profile first."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.mfa_enabled = True
    user.mfa_method = MFA_EMAIL
    user.save(update_fields=["mfa_enabled", "mfa_method"])

    return Response({
        "detail": "Email verification enabled.",
        "mfa_enabled": True,
        "mfa_method": MFA_EMAIL,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def disable_2fa(request):
    """
    Disable 2FA. Requires current password for security.
    Body: { password }
    """
    user = request.user
    password = request.data.get("password", "")

    if not user.check_password(password):
        return Response(
            {"non_field_errors": ["Incorrect password."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.mfa_enabled = False
    user.mfa_method = ""
    user.save(update_fields=["mfa_enabled", "mfa_method"])

    TOTPDevice.objects.filter(user=user).delete()

    return Response({
        "detail": "Two-factor authentication disabled.",
        "mfa_enabled": False,
        "mfa_method": None,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def auth_me(request):
    """Return authenticated user with canonical role and permissions."""
    return Response(UserSerializer(request.user).data)
