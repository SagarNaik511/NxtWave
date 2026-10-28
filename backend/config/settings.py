import os
from datetime import date
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def env_bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: str = "") -> list[str]:
    return split_list(os.getenv(name, default))


def split_list(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def env_int(name: str, default: int, minimum: int = 0) -> int:
    try:
        return max(minimum, int(os.getenv(name, str(default))))
    except ValueError:
        return default


def env_date(name: str) -> date | None:
    value = os.getenv(name, "").strip()
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


DEPLOYMENT_ENV = os.getenv("DJANGO_ENV", "development").strip().lower()
DEBUG = env_bool("DJANGO_DEBUG", True)
if DEPLOYMENT_ENV in {"production", "prod"} and DEBUG:
    raise ImproperlyConfigured("DJANGO_DEBUG must be False when DJANGO_ENV is production.")
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "").strip()
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = "local-development-only-change-me"
    else:
        raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set when DJANGO_DEBUG is False.")
if not DEBUG and SECRET_KEY.startswith("replace-with-"):
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must not use the example placeholder in production.")

allowed_hosts_value = os.getenv("DJANGO_ALLOWED_HOSTS", "").strip()
render_external_hostname = os.getenv("RENDER_EXTERNAL_HOSTNAME", "").strip()
configured_allowed_hosts = split_list(allowed_hosts_value)
if render_external_hostname and render_external_hostname not in configured_allowed_hosts:
    configured_allowed_hosts.append(render_external_hostname)
if not DEBUG and not configured_allowed_hosts:
    raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS must list the backend host when DJANGO_DEBUG is False.")
ALLOWED_HOSTS = configured_allowed_hosts or (["127.0.0.1", "localhost"] if DEBUG else [])
TIME_ZONE = os.getenv("DJANGO_TIME_ZONE", "Asia/Kolkata")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "apps.registrations",
    "apps.referrals",
    "apps.analytics",
    "apps.campaigns",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
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
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///db.sqlite3")
if not DEBUG and not (DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")):
    raise ImproperlyConfigured("A PostgreSQL DATABASE_URL is required when DJANGO_DEBUG is False.")
if DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://"):
    database_url = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    from urllib.parse import parse_qs, urlparse

    parsed_database_url = urlparse(database_url)
    database_options = {
        key: values[0]
        for key, values in parse_qs(parsed_database_url.query).items()
        if values
    }
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": parsed_database_url.path.lstrip("/"),
            "USER": parsed_database_url.username or "",
            "PASSWORD": parsed_database_url.password or "",
            "HOST": parsed_database_url.hostname or "127.0.0.1",
            "PORT": str(parsed_database_url.port or 5432),
            "OPTIONS": database_options,
        }
    }
else:
    sqlite_name = DATABASE_URL.removeprefix("sqlite:///")
    DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / sqlite_name}}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

cors_origins_value = os.getenv("DJANGO_CORS_ALLOWED_ORIGINS", "").strip()
if not DEBUG and not cors_origins_value:
    raise ImproperlyConfigured("DJANGO_CORS_ALLOWED_ORIGINS must list the deployed frontend origin when DJANGO_DEBUG is False.")
CORS_ALLOWED_ORIGINS = split_list(cors_origins_value or ("http://localhost:5173,http://127.0.0.1:5173" if DEBUG else ""))
CORS_ALLOW_CREDENTIALS = False
CSRF_TRUSTED_ORIGINS = env_list("DJANGO_CSRF_TRUSTED_ORIGINS", ",".join(CORS_ALLOWED_ORIGINS))

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https") if env_bool("DJANGO_BEHIND_PROXY", False) else None
SECURE_SSL_REDIRECT = env_bool("DJANGO_SECURE_SSL_REDIRECT", not DEBUG)
SESSION_COOKIE_SECURE = env_bool("DJANGO_SESSION_COOKIE_SECURE", not DEBUG)
CSRF_COOKIE_SECURE = env_bool("DJANGO_CSRF_COOKIE_SECURE", not DEBUG)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"
SECURE_HSTS_SECONDS = env_int("DJANGO_SECURE_HSTS_SECONDS", 31536000 if not DEBUG else 0)
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
DATA_UPLOAD_MAX_MEMORY_SIZE = env_int("DJANGO_MAX_REQUEST_BYTES", 1_048_576, minimum=1024)
FILE_UPLOAD_MAX_MEMORY_SIZE = DATA_UPLOAD_MAX_MEMORY_SIZE

CAMPAIGN_TARGET = env_int("CAMPAIGN_TARGET", 500)
CAMPAIGN_DURATION_DAYS = env_int("CAMPAIGN_DURATION_DAYS", 7, minimum=1)
CAMPAIGN_BUDGET_INR = env_int("CAMPAIGN_BUDGET_INR", 2000)
CAMPAIGN_START_DATE = env_date("CAMPAIGN_START_DATE")
CAMPAIGN_NAME = os.getenv("CAMPAIGN_NAME", "AI Sprint — Build Your First AI Project in 60 Minutes").strip()
CAMPAIGN_TIME_ZONE = os.getenv("CAMPAIGN_TIME_ZONE", TIME_ZONE).strip() or TIME_ZONE

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "120/minute",
        "user": "600/minute",
        "admin_login": "5/minute",
    },
}

