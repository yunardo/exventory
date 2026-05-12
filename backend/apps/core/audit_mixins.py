from apps.core.audit_service import write_audit_log
from apps.core.audit import AuditActions

class AuditCrudMixin:
    """
    Audita create/update/delete.
    - No guarda payload completo; solo cambios relevantes.
    - Usa request_id/tenant/user automáticamente.
    """

    audit_entity_name = None  # opcional; si no, usa model.__name__

    def _entity_name(self):
        if self.audit_entity_name:
            return self.audit_entity_name
        model = getattr(getattr(self, "queryset", None), "model", None)
        if model:
            return model.__name__
        # fallback
        return self.__class__.__name__

    def perform_create(self, serializer):
        instance = serializer.save(tenant=self.get_tenant())
        write_audit_log(
            action=AuditActions.CREATE,
            request=self.request,
            user=self.request.user if self.request.user.is_authenticated else None,
            entity=self._entity_name(),
            entity_id=str(getattr(instance, "id", "")),
            status_code=201,
            meta={"data": serializer.data},
        )
        return instance

    def perform_update(self, serializer):
        instance = serializer.save()
        write_audit_log(
            action=AuditActions.UPDATE,
            request=self.request,
            user=self.request.user if self.request.user.is_authenticated else None,
            entity=self._entity_name(),
            entity_id=str(getattr(instance, "id", "")),
            status_code=200,
            meta={"data": serializer.data},
        )
        return instance

    def perform_destroy(self, instance):
        entity_id = str(getattr(instance, "id", ""))
        write_audit_log(
            action=AuditActions.DELETE,
            request=self.request,
            user=self.request.user if self.request.user.is_authenticated else None,
            entity=self._entity_name(),
            entity_id=entity_id,
            status_code=204,
            meta={"data": {"id": entity_id}},
        )
        instance.delete()