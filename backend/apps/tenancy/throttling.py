from rest_framework.throttling import SimpleRateThrottle


class TenantRateThrottle(SimpleRateThrottle):
    """
    Limita por tenant (slug/id) + tipo de scope.
    Aplica incluso si el usuario no está autenticado (si hay tenant).
    """
    scope = "tenant"

    def get_cache_key(self, request, view):
        tenant = getattr(request, "tenant", None)
        if tenant is None:
            return None  # sin tenant, no aplicamos este throttle

        ident = f"tenant:{tenant.id}"
        return self.cache_format % {"scope": self.scope, "ident": ident}


class TenantUserRateThrottle(SimpleRateThrottle):
    """
    Limita por tenant + usuario autenticado.
    Si no está autenticado, no aplica (para anon usaremos AnonRateThrottle si quieres).
    """
    scope = "tenant_user"

    def get_cache_key(self, request, view):
        tenant = getattr(request, "tenant", None)
        user = getattr(request, "user", None)

        if tenant is None or not user or not user.is_authenticated:
            return None

        ident = f"tenant:{tenant.id}:user:{user.id}"
        return self.cache_format % {"scope": self.scope, "ident": ident}

class TenantAnonRateThrottle(SimpleRateThrottle):
    """
    Límite por tenant + IP para requests no autenticados.
    Útil para proteger endpoints públicos y sobre todo /login/.
    """
    scope = "tenant_anon"

    def get_cache_key(self, request, view):
        tenant = getattr(request, "tenant", None)
        if tenant is None:
            return None
        ip = self.get_ident(request)
        ident = f"tenant:{tenant.id}:ip:{ip}"
        return self.cache_format % {"scope": self.scope, "ident": ident}


class LoginTenantIPRateThrottle(SimpleRateThrottle):
    """
    Anti brute-force: límite MUY estricto por tenant + IP.
    Usar SOLO en /auth/login/.
    """
    scope = "login_tenant_ip"

    def get_cache_key(self, request, view):
        tenant = getattr(request, "tenant", None)
        if tenant is None:
            return None
        ip = self.get_ident(request)
        ident = f"login:tenant:{tenant.id}:ip:{ip}"
        return self.cache_format % {"scope": self.scope, "ident": ident}


class LoginTenantUserRateThrottle(SimpleRateThrottle):
    """
    Anti brute-force: límite por tenant + username (aunque aún no autenticado).
    Usar SOLO en /auth/login/.
    """
    scope = "login_tenant_user"

    def get_cache_key(self, request, view):
        tenant = getattr(request, "tenant", None)
        if tenant is None:
            return None

        # SimpleJWT usa username/password en el body
        username = None
        try:
            username = (request.data or {}).get("username")
        except Exception:
            username = None

        if not username:
            return None

        ident = f"login:tenant:{tenant.id}:username:{username.lower().strip()}"
        return self.cache_format % {"scope": self.scope, "ident": ident}


class ExpensiveEndpointTenantThrottle(SimpleRateThrottle):
    """
    Límite por tenant para endpoints caros: reportes/export/cierres/etc.
    """
    scope = "tenant_expensive"

    def get_cache_key(self, request, view):
        tenant = getattr(request, "tenant", None)
        if tenant is None:
            return None
        ident = f"tenant:{tenant.id}"
        return self.cache_format % {"scope": self.scope, "ident": ident}


class ExpensiveEndpointTenantUserThrottle(SimpleRateThrottle):
    """
    Límite por tenant+user para endpoints caros.
    """
    scope = "tenant_user_expensive"

    def get_cache_key(self, request, view):
        tenant = getattr(request, "tenant", None)
        user = getattr(request, "user", None)
        if tenant is None or not user or not user.is_authenticated:
            return None
        ident = f"tenant:{tenant.id}:user:{user.id}"
        return self.cache_format % {"scope": self.scope, "ident": ident}