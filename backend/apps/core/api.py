from rest_framework.exceptions import NotFound

class TenantRequiredMixin:
    """
    Exige que request.tenant exista (subdominio válido).
    """
    def get_tenant(self):
        tenant = getattr(self.request, "tenant", None)
        if tenant is None:
            raise NotFound(detail="Tenant context is required.")
        return tenant

    def perform_create(self, serializer):
        # Ignora tenant del payload y fuerza el tenant actual
        serializer.save(tenant=self.get_tenant())