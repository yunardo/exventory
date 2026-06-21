import logging
from io import BytesIO

from openpyxl.drawing.image import Image
from openpyxl.styles import Font

logger = logging.getLogger(__name__)


def add_tenant_report_header(ws, tenant):
    row_offset = 1

    if tenant.company_logo:
        try:
            with tenant.company_logo.open("rb") as logo_file:
                image_bytes = BytesIO(logo_file.read())
                img = Image(image_bytes)

                img.height = 60
                img.width = 160

                ws.add_image(img, "A1")

            row_offset = 5

        except Exception as exc:
            logger.exception("Could not add tenant logo to Excel: %s", exc)

    for _ in range(row_offset - 1):
        ws.append([])

    ws.append([tenant.company_name or tenant.name])
    ws.append([f"NIT: {tenant.tax_id}" if tenant.tax_id else ""])
    ws.append([f"Address: {tenant.address}" if tenant.address else ""])
    ws.append([f"Phone: {tenant.phone}" if tenant.phone else ""])
    ws.append([])

    company_row = ws.max_row - 4
    ws[f"A{company_row}"].font = Font(bold=True, size=14)
