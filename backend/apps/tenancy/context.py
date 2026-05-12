import threading
from typing import Optional

_thread_local = threading.local()

def set_current_tenant(tenant) -> None:
    _thread_local.tenant = tenant

def get_current_tenant():
    return getattr(_thread_local, "tenant", None)

def clear_current_tenant() -> None:
    if hasattr(_thread_local, "tenant"):
        delattr(_thread_local, "tenant")