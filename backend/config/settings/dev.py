from .base import *

DEBUG = True

# En DEV: permitir cualquier origen localhost en cualquier puerto
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http:\/\/localhost:\d+$",
    r"^http:\/\/127\.0\.0\.1:\d+$",
    r"^http:\/\/.*\.localhost:\d+$",
]

# Como usas Bearer tokens (Authorization header)
CORS_ALLOW_HEADERS = list(globals().get("CORS_ALLOW_HEADERS", [])) + [
    "authorization",
    "content-type",
]