import time
import uuid
import json
import logging

from django.utils.deprecation import MiddlewareMixin
from django.http import HttpRequest, HttpResponse

from apps.core.request_context import set_request_id, clear_request_id
from apps.tenancy.context import get_current_tenant

logger = logging.getLogger("app.request")

SENSITIVE_HEADERS = {"authorization", "cookie"}

class RequestIdAndLoggingMiddleware(MiddlewareMixin):
    """
    - Lee X-Request-ID si viene (útil con ALB, CloudFront, o frontend)
    - Si no viene, genera UUID4
    - Lo expone en response header X-Request-ID
    - Loguea request/response con duración
    """

    def process_request(self, request: HttpRequest):
        rid = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        set_request_id(rid)
        request.request_id = rid
        request._start_time = time.perf_counter()

    def process_response(self, request: HttpRequest, response: HttpResponse):
        rid = getattr(request, "request_id", None)
        if rid:
            response["X-Request-ID"] = rid

        duration_ms = None
        if hasattr(request, "_start_time"):
            duration_ms = round((time.perf_counter() - request._start_time) * 1000, 2)

        # Tenant desde el request (más fiable) o desde contexto
        tenant = getattr(request, "tenant", None) or get_current_tenant()
        tenant_slug = getattr(tenant, "slug", None) if tenant else None

        user = getattr(request, "user", None)
        user_id = getattr(user, "id", None) if user and getattr(user, "is_authenticated", False) else None

        path = getattr(request, "path", "")
        method = getattr(request, "method", "")
        status = getattr(response, "status_code", None)

        # Log estructurado (JSON)
        payload = {
            "event": "request",
            "request_id": rid,
            "tenant": tenant_slug,
            "user_id": user_id,
            "method": method,
            "path": path,
            "status": status,
            "duration_ms": duration_ms,
        }
        logger.info(json.dumps(payload, ensure_ascii=False))

        clear_request_id()
        return response

    def process_exception(self, request, exception):
        rid = getattr(request, "request_id", None)
        tenant = getattr(request, "tenant", None)
        tenant_slug = getattr(tenant, "slug", None) if tenant else None
        user = getattr(request, "user", None)
        user_id = getattr(user, "id", None) if user and getattr(user, "is_authenticated", False) else None

        payload = {
            "event": "exception",
            "request_id": rid,
            "tenant": tenant_slug,
            "user_id": user_id,
            "error": type(exception).__name__,
            "message": str(exception),
        }
        logger.exception(json.dumps(payload, ensure_ascii=False))
        # no limpiar aquí; se limpia en process_response si aplica