from django.db import models
from apps.tenancy.context import get_current_tenant

class TenantAwareQuerySet(models.QuerySet):
    def for_current_tenant(self):
        tenant = get_current_tenant()
        if tenant is None:
            # Sin tenant: por defecto NO devolvemos nada (seguro)
            return self.none()
        return self.filter(tenant=tenant)

    def _filter_or_none(self, *args, **kwargs):
        tenant = get_current_tenant()
        if tenant is None:
            return self.none()
        return self.filter(tenant=tenant, *args, **kwargs)

class TenantAwareManager(models.Manager):
    def get_queryset(self):
        # Filtrado automático SIEMPRE
        return TenantAwareQuerySet(self.model, using=self._db).for_current_tenant()

    # Opcional: para casos administrativos donde quieras saltarte tenant
    def all_with_tenants(self):
        return TenantAwareQuerySet(self.model, using=self._db).all()