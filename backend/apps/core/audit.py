from dataclasses import dataclass
from apps.core.audit_models import AuditLog
from apps.core.audit import log_audit_event

@dataclass(frozen=True)
class AuditActions:
    LOGIN = "login"
    LOGOUT = "logout"
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    EXPORT = "export"
    CLOSE_PERIOD = "close_period"
    CLOSE_YEAR = "close_year"
    UFV_REPRICE = "ufv_reprice"


def log_audit_event(
    *,
    request,
    action,
    entity,
    entity_id=None,
    status_code=200,
    meta=None,
):
    AuditLog.objects.create(
        tenant=getattr(request, "tenant", None),
        user=request.user if request.user.is_authenticated else None,
        action=action,
        entity=entity,
        entity_id=str(entity_id) if entity_id is not None else "",
        path=request.path,
        method=request.method,
        status_code=status_code,
        request_id=getattr(request, "request_id", ""),
        meta=meta or {},
    )
