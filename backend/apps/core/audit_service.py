from typing import Any, Dict, Optional
from django.utils.timezone import now

from apps.core.request_context import get_request_id
from apps.tenancy.context import get_current_tenant
from apps.core.audit_models import AuditLog

SENSITIVE_KEYS = {"password", "token", "access", "refresh", "secret", "authorization"}

def _sanitize(data: Any) -> Any:
    if isinstance(data, dict):
        out = {}
        for k, v in data.items():
            if str(k).lower() in SENSITIVE_KEYS:
                out[k] = "***"
            else:
                out[k] = _sanitize(v)
        return out
    if isinstance(data, list):
        return [_sanitize(x) for x in data]
    return data

def write_audit_log(
    *,
    action: str,
    request=None,
    user=None,
    entity: str = "",
    entity_id: str = "",
    status_code: Optional[int] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> Optional[AuditLog]:
    tenant = get_current_tenant() or getattr(request, "tenant", None)
    if tenant is None:
        return None  # sin tenant no auditamos (o podrías auditar global)

    rid = get_request_id() or getattr(request, "request_id", "")

    path = getattr(request, "path", "") if request else ""
    method = getattr(request, "method", "") if request else ""
    ip = ""
    ua = ""
    if request:
        ip = request.META.get("REMOTE_ADDR", "")
        ua = request.META.get("HTTP_USER_AGENT", "")[:300]

    payload = _sanitize(meta or {})

    return AuditLog.objects.all_with_tenants().create(
        tenant=tenant,
        action=action,
        entity=entity or "",
        entity_id=str(entity_id or ""),
        path=path,
        method=method,
        status_code=status_code,
        user=user,
        request_id=rid or "",
        ip_address=ip,
        user_agent=ua,
        meta=payload,
    )