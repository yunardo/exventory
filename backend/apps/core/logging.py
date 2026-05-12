import json
import logging

from apps.core.request_context import get_request_id
from apps.tenancy.context import get_current_tenant

class ContextFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        rid = get_request_id()
        tenant = get_current_tenant()
        record.request_id = rid
        record.tenant = getattr(tenant, "slug", None) if tenant else None
        return True


class JsonFormatter(logging.Formatter):
    """
    Convierte cualquier log a JSON con campos comunes.
    Si el mensaje ya es JSON (lo mandamos como string), lo empaqueta igual.
    """
    def format(self, record: logging.LogRecord) -> str:
        base = {
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", None),
            "tenant": getattr(record, "tenant", None),
        }
        # Puedes agregar: filename, line, etc.
        if record.exc_info:
            base["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(base, ensure_ascii=False)