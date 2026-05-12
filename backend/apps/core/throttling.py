from apps.tenancy.throttling import (
    ExpensiveEndpointTenantThrottle,
    ExpensiveEndpointTenantUserThrottle,
)

class ExpensiveEndpointThrottleMixin:
    throttle_classes = [ExpensiveEndpointTenantThrottle, ExpensiveEndpointTenantUserThrottle]


'''
Luego, cuando crees endpoints caros (ejemplos):
/api/reports/...
/api/exports/...
/api/management-year/close/
/api/fuel-repricing/ufv/close/

Simplemente haces:

class ReportsView(ExpensiveEndpointThrottleMixin, APIView):
    ...

o en ViewSet:

class ReportsViewSet(ExpensiveEndpointThrottleMixin, ModelViewSet):
    ...

------------

Por defecto ya quedan cubiertos por:

tenant (600/min)
tenant_user (180/min)
tenant_anon (60/min)

Si en el futuro quieres que algunos sean más permisivos (por ejemplo /api/me/), podemos crear throttles “light”, pero con tu carga inicial no es necesario.
'''