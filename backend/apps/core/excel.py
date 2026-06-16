from openpyxl.styles import Font


def add_tenant_report_header(ws, tenant):
    ws.append([tenant.company_name or tenant.name])
    ws.append([f"NIT: {tenant.tax_id}" if tenant.tax_id else ""])
    ws.append([f"Address: {tenant.address}" if tenant.address else ""])
    ws.append([f"Phone: {tenant.phone}" if tenant.phone else ""])
    ws.append([])

    ws["A1"].font = Font(bold=True, size=14)
