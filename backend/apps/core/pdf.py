from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
import logging
from tempfile import NamedTemporaryFile

from reportlab.platypus import Image

logger = logging.getLogger(__name__)


def build_inventory_valuation_pdf(tenant, data):
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    elements = []

    company_name = tenant.company_name or tenant.name

    if tenant.company_logo:
        try:
            with tenant.company_logo.open("rb") as logo_file:
                with NamedTemporaryFile(suffix=".png") as tmp:
                    tmp.write(logo_file.read())
                    tmp.flush()

                    logo = Image(tmp.name, width=140, height=55)
                    elements.append(logo)
                    elements.append(Spacer(1, 8))

        except Exception as exc:
            logger.exception("Could not add tenant logo to PDF: %s", exc)
    elements.append(Paragraph(company_name, styles["Title"]))

    if tenant.tax_id:
        elements.append(Paragraph(f"NIT: {tenant.tax_id}", styles["Normal"]))

    if tenant.address:
        elements.append(Paragraph(f"Address: {tenant.address}", styles["Normal"]))

    if tenant.phone:
        elements.append(Paragraph(f"Phone: {tenant.phone}", styles["Normal"]))

    elements.append(Spacer(1, 18))
    elements.append(Paragraph("Inventory Valuation Report", styles["Heading2"]))
    elements.append(Spacer(1, 12))

    table_data = [["Warehouse", "Inventory Value"]]

    for warehouse in data["warehouses"]:
        table_data.append([
            warehouse["warehouse_name"],
            warehouse["inventory_value"],
        ])

    table_data.append(["TOTAL", data["total_inventory_value"]])

    table = Table(table_data, colWidths=[330, 150])

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (1, 1), (1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#F1F5F9")),
    ]))

    elements.append(table)

    doc.build(elements)

    buffer.seek(0)
    return buffer
