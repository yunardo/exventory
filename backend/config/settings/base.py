from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "0") == "1"
ALLOWED_HOSTS = [h.strip() for h in os.getenv("DJANGO_ALLOWED_HOSTS", "").split(",") if h.strip()]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "storages",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",

    "apps.core.middleware.RequestIdAndLoggingMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",
    "apps.tenancy.middleware.ResolveTenantFromSubdomainMiddleware",

    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": [
            "django.template.context_processors.request",
            "django.contrib.auth.context_processors.auth",
            "django.contrib.messages.context_processors.messages",
        ]},
    }
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB", "saas"),
        "USER": os.getenv("POSTGRES_USER", "saas"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", "saas"),
        "HOST": os.getenv("POSTGRES_HOST", "db"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "es"
TIME_ZONE = "America/La_Paz"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

INSTALLED_APPS += [
    "apps.tenancy",
    "apps.core",
    "apps.inventory",
    "corsheaders",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    # Throttling global (aplica a todos los endpoints)
    "DEFAULT_THROTTLE_CLASSES": (
        "apps.tenancy.throttling.TenantRateThrottle",
        "apps.tenancy.throttling.TenantUserRateThrottle",
        "apps.tenancy.throttling.TenantAnonRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        # Ajusta estos valores según tu necesidad
        # Estos números son razonables para tu carga inicial (5–10 tenants). Luego los afinamos.
        # Globales
        "tenant": "600/min",            # total por tenant
        "tenant_user": "180/min",       # por usuario por tenant
        "tenant_anon": "60/min",        # anon por tenant+ip

        # Login (más estricto)
        "login_tenant_ip": "10/min",    # por tenant+ip
        "login_tenant_user": "10/min",  # por tenant+username

        # Endpoints caros (más estricto)
        "tenant_expensive": "60/min",           # total por tenant
        "tenant_user_expensive": "20/min",      # por user por tenant
    },
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 25,
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {
        "context": {
            "()": "apps.core.logging.ContextFilter",
        }
    },
    "formatters": {
        "json": {
            "()": "apps.core.logging.JsonFormatter",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "filters": ["context"],
            "formatter": "json",
        }
    },
    "loggers": {
        # Logs de tus requests
        "app.request": {"handlers": ["console"], "level": "INFO", "propagate": False},

        # Logs de tu app
        "app": {"handlers": ["console"], "level": "INFO", "propagate": False},

        # Django (opcional: baja ruido)
        "django": {"handlers": ["console"], "level": "WARNING", "propagate": False},
    },
}

CSRF_TRUSTED_ORIGINS = [
    h.strip() for h in os.getenv("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",") if h.strip()
]

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("DJANGO_CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

CORS_ALLOW_CREDENTIALS = True
EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.smtp.EmailBackend",
)

EMAIL_HOST = os.getenv("EMAIL_HOST", default="")
EMAIL_PORT = os.getenv("EMAIL_PORT", default=587)
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", default=True)
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", default="noreply@exventory.com")

FRONTEND_APP_URL = os.getenv("FRONTEND_APP_URL", default="https://app.exventory.com")

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME", default="")
AWS_S3_REGION_NAME = os.getenv("AWS_S3_REGION_NAME", default="us-east-1")
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None
AWS_QUERYSTRING_AUTH = True

STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3.S3Storage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}
