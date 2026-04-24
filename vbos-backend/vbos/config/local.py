import os
from .common import Common

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Local(Common):
    DEBUG = True

    # Allow cookies over HTTP for local development
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

    # Allow frontend origin for local dev (Vite default: 5173)
    CSRF_TRUSTED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
    ]

    # Testing
    INSTALLED_APPS = Common.INSTALLED_APPS

    # Mail
    EMAIL_HOST = "localhost"
    EMAIL_PORT = 1025
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

    # CORS
    CORS_ALLOW_ALL_ORIGINS = True
