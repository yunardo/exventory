from tempfile import NamedTemporaryFile

from openpyxl.drawing.image import Image
from openpyxl.styles import Font


def add_tenant_report_header(ws, tenant):
    if tenant.company_logo:
        try:
            with tenant.company_logo.open("rb") as logo_file:
                with NamedTemporaryFile(suffix=".png") as tmp:
                    tmp.write(logo_file.read())
                    tmp.flush()

                    img = Image(tmp.name)
                    img.height = 60
                    img.width = 160
                    ws.add_image(img, "A1")
        except Exception:
            pass

        ws.append([])
        ws.append([])
        ws.append([])
        ws.append([])

    ws.append([tenant.company_name or tenant.name])
    ws.append([f"NIT: {tenant.tax_id}" if tenant.tax_id else ""])
    ws.append([f"Address: {tenant.address}" if tenant.address else ""])
    ws.append([f"Phone: {tenant.phone}" if tenant.phone else ""])
    ws.append([])

    current_row = ws.max_row - 4
    ws[f"A{current_row}"].font = Font(bold=True, size=14)