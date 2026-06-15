from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from .models import Tenant
from .context import set_current_tenant, clear_current_tenant

class ResolveTenantFromSubdomainMiddleware(MiddlewareMixin):
    """
    Espera hosts tipo:
      tenant1.localhost:8000
      tenant2.tudominio.com
    Extrae 'tenant1' y lo usa como slug.
    """

    def process_request(self, request):
        clear_current_tenant()

        # Rutas globales: no requieren tenant
        global_paths = (
            "/health/",
            "/admin/",
            "/static/",
            "/api/auth/login/",
            "/api/auth/refresh/",
            "/api/auth/me/",
            "/api/auth/tenants/",
            "/api/auth/invitations/accept/",
        )

        if any(request.path.startswith(path) for path in global_paths):
            request.tenant = None
            set_current_tenant(None)
            return None

        host = request.get_host().split(":")[0]  # sin puerto
        parts = host.split(".")

        # Casos base que no son tenant (ej: localhost, api.localhost)
        if host in ("localhost", "127.0.0.1") or host.startswith("api."):
            request.tenant = None
            set_current_tenant(None)
            return None

        # Para *.localhost => tenant1.localhost
        if host.endswith(".localhost") and len(parts) >= 2:
            subdomain = parts[0]
        # Para tenant.tudominio.com => tenant
        elif len(parts) >= 3:
            subdomain = parts[0]
        else:
            request.tenant = None
            set_current_tenant(None)
            return None

        tenant = Tenant.objects.filter(slug=subdomain, is_active=True).first()
        if not tenant:
            return JsonResponse({"detail": "Tenant not found or inactive."}, status=404)

        request.tenant = tenant
        set_current_tenant(tenant)
        return None
        
    
    def process_response(self, request, response):
        clear_current_tenant()
        return response