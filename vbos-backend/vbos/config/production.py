import os
from .common import Common


class Production(Common):
    DEBUG = False
    INSTALLED_APPS = Common.INSTALLED_APPS
    SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
    # Site
    # https://docs.djangoproject.com/en/2.0/ref/settings/#allowed-hosts
    ALLOWED_HOSTS = ["*"]
    CSRF_TRUSTED_ORIGINS = [
        "https://vcdmis.com",
        "https://www.vcdmis.com",
        "https://api.vcdmis.com",
        "https://*.ds.io",
    ]
    INSTALLED_APPS += ("gunicorn",)

    # Static files (CSS, JavaScript, Images)
    # https://docs.djangoproject.com/en/2.0/howto/static-files/
    # http://django-storages.readthedocs.org/en/latest/index.html
    INSTALLED_APPS += ("storages",)
    STORAGES = {
        "default": {"BACKEND": "storages.backends.s3.S3Storage"},
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
        },
    }
    AWS_S3_OBJECT_PARAMETERS = {
        "CacheControl": "max-age=2592000",
    }
    AWS_S3_ENDPOINT_URL = os.getenv(
        "DJANGO_AWS_S3_ENDPOINT_URL", "https://syd1.digitaloceanspaces.com"
    )
    AWS_ACCESS_KEY_ID = os.getenv("DJANGO_AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.getenv("DJANGO_AWS_SECRET_ACCESS_KEY")
    AWS_STORAGE_BUCKET_NAME = os.getenv("DJANGO_AWS_STORAGE_BUCKET_NAME")
    AWS_DEFAULT_ACL = "public-read"
    AWS_AUTO_CREATE_BUCKET = True
    AWS_QUERYSTRING_AUTH = False
    MEDIA_URL = f"https://{AWS_STORAGE_BUCKET_NAME}.syd1.digitaloceanspaces.com/"

    # https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/http-caching#cache-control
    # Response can be cached by browser and any intermediary caches (i.e. it is "public") for up to 1 day
    # 86400 = (60 seconds x 60 minutes x 24 hours)
    AWS_HEADERS = {
        "Cache-Control": "max-age=86400, s-maxage=86400, must-revalidate",
    }

    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://localhost:4173",
        "https://vcdmis.com",
        "https://www.vcdmis.com",
        "https://vbos.ds.io",
        "https://28c1de977ab0e5742601b8e5a775e5e0.cloudfront.net",
        "https://d3t1f2htm7mtkw.cloudfront.net",
        "https://vbos-frontend-xp8cg.ondigitalocean.app",
    ]
