from .base import *

DEBUG = False

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True  # lo activaremos en AWS con HTTPS real
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# CSRF_TRUSTED_ORIGINS = [
#     "http://*.elb.amazonaws.com",
# ]

# this line is causing 404 issues with DNS
# ALLOWED_HOSTS = [".localhost"]  # en AWS será ".tudominio.com"

STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "bucket_name": AWS_STORAGE_BUCKET_NAME,
            "region_name": AWS_S3_REGION_NAME,
            "file_overwrite": False,
            "default_acl": None,
            "querystring_auth": True,
        },
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
