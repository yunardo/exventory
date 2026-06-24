from io import BytesIO
from decimal import Decimal

from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from apps.core.pdf import build_logo_image

import qrcode


def make_document_watermark(status_label):
    def watermark(canvas, doc):
        canvas.saveState()

        canvas.setFont("Helvetica-Bold", 70)
        canvas.setFillColor(Color(0.7, 0.7, 0.7, alpha=0.18))

        canvas.translate(doc.pagesize[0] / 2, doc.pagesize[1] / 2)
        canvas.rotate(35)

        canvas.drawCentredString(0, 0, status_label.upper())

        canvas.restoreState()

    return watermark


def build_qr_image(value, width=2.2 * cm, height=2.2 * cm):
    qr = qrcode.make(value)

    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    buffer.seek(0)

    return Image(buffer, width=width, height=height)


def build_stock_entry_document_pdf(document):
    buffer = BytesIO()

    qr = build_qr_image(
        f"ENTRY_DOCUMENT:{document.tenant.slug}:{document.id}"
    )

    pdf = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )

    styles = getSampleStyleSheet()
    elements = []


    logo = build_logo_image(
        document.tenant.company_logo,
        width=2.5 * cm,
        height=2.5 * cm,
    )

    title = Paragraph(
        "<b>DOCUMENTO DE INGRESO DE INVENTARIO</b>",
        styles["Title"],
    )

    header_data = [
        [
            logo if logo else "",
            title,
        ]
    ]

    header = Table(
        [[logo if logo else "", title, qr]],
        colWidths=[3 * cm, 10 * cm, 3 * cm],
    )

    elements.append(header)
    elements.append(Spacer(1, 0.5 * cm))

    info_data = [
        ["Tipo Documento", document.document_type],
        ["Nro Documento", document.document_number],
        ["Fecha", document.entry_date.strftime("%d/%m/%Y")],
        ["Proveedor", document.supplier_name],
        ["NIT", document.supplier_tax_id or "-"],
        ["Estado", document.get_status_display()],
    ]

    info_table = Table(
        info_data,
        colWidths=[4 * cm, 12 * cm],
    )

    info_table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.3, colors.lightgrey),
                ("BACKGROUND", (0, 0), (0, -1), colors.whitesmoke),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ]
        )
    )

    elements.append(info_table)
    elements.append(Spacer(1, 0.5 * cm))   

    rows = [
        [
            "Código",
            "Descripción",
            "Cantidad",
            "P. Unitario",
            "Total",
        ]
    ]

    for line in document.lines.select_related("item").all():
        rows.append(
            [
                line.item.code,
                line.item.name,
                f"{line.quantity:.2f}",
                f"{line.unit_cost:.2f}",
                f"{line.total_cost:.2f}",
            ]
        )

    table = Table(
        rows,
        colWidths=[
            2.5 * cm,
            6 * cm,
            2.5 * cm,
            2.5 * cm,
            2.5 * cm,
        ],
        repeatRows=1,
    )

    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
                ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [
                    colors.white,
                    colors.whitesmoke,
                ]),
            ]
        )
    )

    elements.append(table)
    elements.append(Spacer(1, 0.5 * cm))

    total_table = Table(
        [
            [
                "TOTAL Bs.",
                f"{Decimal(document.total_amount):,.2f}",
            ]
        ],
        colWidths=[12 * cm, 4 * cm],
    )

    total_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.whitesmoke),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ]
        )
    )

    elements.append(total_table)
    elements.append(Spacer(1, 0.7 * cm))

    elements.append(
        Paragraph(
            f"<b>Motivo:</b> {document.reason or '-'}",
            styles["BodyText"],
        )
    )

    elements.append(Spacer(1, 0.2 * cm))

    elements.append(
        Paragraph(
            f"<b>Observaciones:</b> {document.notes or '-'}",
            styles["BodyText"],
        )
    )

    elements.append(Spacer(1, 1.5 * cm))

    signature = Table(
        [
            [
                "____________________",
                "____________________",
            ],
            [
                "Entregado por",
                "Recibido por",
            ],
        ],
        colWidths=[8 * cm, 8 * cm],
    )

    signature.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ]
        )
    )

    elements.append(signature)

    watermark = make_document_watermark(document.get_status_display())

    pdf.build(
        elements,
        onFirstPage=watermark,
        onLaterPages=watermark,
    )

    buffer.seek(0)
    return buffer


def build_stock_exit_document_pdf(document):
    buffer = BytesIO()

    qr = build_qr_image(
        f"EXIT_DOCUMENT:{document.tenant.slug}:{document.id}"
    )

    pdf = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )

    styles = getSampleStyleSheet()
    elements = []

    logo = build_logo_image(
        document.tenant.company_logo,
        width=2.5 * cm,
        height=2.5 * cm,
    )

    title = Paragraph(
        "<b>DOCUMENTO DE SALIDA DE INVENTARIO</b>",
        styles["Title"],
    )

    header = Table(
        [[logo if logo else "", title, qr]],
        colWidths=[3 * cm, 10 * cm, 3 * cm],
    )
    elements.append(header)
    elements.append(Spacer(1, 0.5 * cm))

    info_data = [
        ["Tipo Documento", document.document_type],
        ["Nro Documento", document.document_number],
        ["Fecha", document.exit_date.strftime("%d/%m/%Y")],
        ["Solicitante", document.requester_name],
        ["Unidad Solicitante", document.requesting_unit],
        ["Responsable", document.responsible_name or "-"],
        ["Estado", document.get_status_display()],
    ]

    info_table = Table(info_data, colWidths=[4 * cm, 12 * cm])
    info_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.3, colors.lightgrey),
        ("BACKGROUND", (0, 0), (0, -1), colors.whitesmoke),
    ]))

    elements.append(info_table)
    elements.append(Spacer(1, 0.5 * cm))

    rows = [["Código", "Descripción", "Cantidad", "Costo Total"]]

    for line in document.lines.select_related("item").all():
        rows.append([
            line.item.code,
            line.item.name,
            f"{line.quantity:.2f}",
            f"{line.total_cost:.2f}",
        ])

    table = Table(
        rows,
        colWidths=[3 * cm, 8 * cm, 3 * cm, 3 * cm],
        repeatRows=1,
    )

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
        ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.whitesmoke]),
    ]))

    elements.append(table)
    elements.append(Spacer(1, 0.5 * cm))

    total_table = Table(
        [["TOTAL Bs.", f"{Decimal(document.total_amount):,.2f}"]],
        colWidths=[12 * cm, 4 * cm],
    )

    total_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.whitesmoke),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
    ]))

    elements.append(total_table)
    elements.append(Spacer(1, 0.7 * cm))

    elements.append(Paragraph(f"<b>Motivo:</b> {document.reason or '-'}", styles["BodyText"]))
    elements.append(Spacer(1, 0.2 * cm))
    elements.append(Paragraph(f"<b>Observaciones:</b> {document.notes or '-'}", styles["BodyText"]))
    elements.append(Spacer(1, 1.5 * cm))

    signature = Table(
        [
            ["____________________", "____________________"],
            ["Entregado por", "Recibido por"],
        ],
        colWidths=[8 * cm, 8 * cm],
    )

    signature.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))

    elements.append(signature)

    watermark = make_document_watermark(document.get_status_display())

    pdf.build(
        elements,
        onFirstPage=watermark,
        onLaterPages=watermark,
    )

    buffer.seek(0)
    return buffer
