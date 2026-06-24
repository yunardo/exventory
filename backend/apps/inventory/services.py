from django.db import transaction

from .models import DocumentSequence


@transaction.atomic
def generate_document_number(*, tenant, code, date):
    sequence, _ = (
        DocumentSequence.objects
        .select_for_update()
        .get_or_create(
            tenant=tenant,
            code=code,
            year=date.year,
            defaults={"last_number": 0},
        )
    )

    sequence.last_number += 1
    sequence.save(update_fields=["last_number"])

    return f"{code}-{date.year}-{sequence.last_number:06d}"
