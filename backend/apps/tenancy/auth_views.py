from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from rest_framework import status

from apps.tenancy.throttling import LoginTenantIPRateThrottle, LoginTenantUserRateThrottle
from apps.core.audit_service import write_audit_log
from apps.core.audit import AuditActions

class TenantTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [LoginTenantIPRateThrottle, LoginTenantUserRateThrottle]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        # Si login OK, SimpleJWT devuelve access/refresh
        if response.status_code == status.HTTP_200_OK:
            # El user ya está autenticado? En este view, no necesariamente.
            # Pero podemos registrar username como meta.
            username = None
            try:
                username = (request.data or {}).get("username")
            except Exception:
                username = None

            write_audit_log(
                action=AuditActions.LOGIN,
                request=request,
                user=None,
                entity="Auth",
                entity_id="",
                status_code=200,
                meta={"username": username},
            )

        return response