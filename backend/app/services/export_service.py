import io
import logging
from datetime import datetime
from typing import Dict, Any

import pandas as pd
from sqlalchemy.orm import Session

from app.db.models import Order, Upload
from app.services.analytics_service import get_dashboard_overview, get_profit_overview

logger = logging.getLogger(__name__)


def generate_csv_export(db: Session, upload_id: str) -> str:
    """Generates a CSV string containing all processed orders for an upload."""
    orders = db.query(Order).filter(Order.upload_id == upload_id).all()
    if not orders:
        return "Order ID,Date,Status,Fulfilment,Category,SKU,Qty,Amount,Ship State,Ship City,B2B,COGS,Platform Fee,Shipping Cost,GST,Return Loss,Estimated Profit,Risk Probability,Used Fallback\n"

    data = []
    for o in orders:
        data.append({
            "Order ID": o.order_id,
            "Date": str(o.date) if o.date else "",
            "Status": o.status,
            "Fulfilment": o.fulfilment,
            "Ship Service Level": o.ship_service_level,
            "Category": o.category,
            "SKU": o.sku,
            "Qty": o.qty,
            "Amount (INR)": o.amount,
            "Ship State": o.ship_state,
            "Ship City": o.ship_city,
            "B2B": o.b2b,
            "Estimated COGS (INR)": o.estimated_cogs,
            "Platform Fee (INR)": o.platform_fee,
            "Shipping Cost (INR)": o.shipping_cost,
            "GST (INR)": o.gst,
            "Return Loss (INR)": o.return_loss,
            "Estimated Profit (INR)": o.estimated_profit,
            "Return Risk Probability": o.risk_probability if o.risk_probability is not None else "N/A (Amazon)",
            "Used Fallback": o.used_fallback if o.used_fallback is not None else "",
        })

    df = pd.DataFrame(data)
    return df.to_csv(index=False)


def generate_excel_export(db: Session, upload_id: str) -> bytes:
    """Generates an Excel workbook (.xlsx) with Executive Summary, Category Performance, and Orders sheets."""
    overview = get_dashboard_overview(db, upload_id)
    profit_overview = get_profit_overview(db, upload_id)
    orders = db.query(Order).filter(Order.upload_id == upload_id).all()

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        # Sheet 1: Executive Summary
        kpis = overview.get("kpis", {})
        summary_rows = [
            {"Metric": "Total Revenue (₹)", "Value": kpis.get("revenue", {}).get("value")},
            {"Metric": "Estimated Profit (₹)", "Value": kpis.get("estimatedProfit", {}).get("value")},
            {"Metric": "Profit Margin (%)", "Value": kpis.get("profitMargin", {}).get("value")},
            {"Metric": "Total Orders", "Value": kpis.get("orders", {}).get("value")},
            {"Metric": "Average Order Value (₹)", "Value": kpis.get("averageOrderValue", {}).get("value")},
            {"Metric": "Merchant Return Rate (%)", "Value": kpis.get("returnRate", {}).get("value")},
            {"Metric": "Top Category by Profit", "Value": overview.get("topCategory", {}).get("name")},
            {"Metric": "Top State by Revenue", "Value": overview.get("topState", {}).get("name")},
        ]
        df_summary = pd.DataFrame(summary_rows)
        df_summary.to_excel(writer, sheet_name="Executive Summary", index=False)

        # Sheet 2: Category Performance
        cat_data = profit_overview.get("categoryPerformance", [])
        df_cat = pd.DataFrame(cat_data)
        if not df_cat.empty:
            df_cat.rename(columns={
                "category": "Category",
                "revenue": "Revenue (INR)",
                "profit": "Estimated Profit (INR)",
                "marginPercent": "Profit Margin (%)",
                "orders": "Orders",
            }, inplace=True)
            df_cat.to_excel(writer, sheet_name="Category Performance", index=False)

        # Sheet 3: Orders Detail
        order_list = []
        for o in orders:
            order_list.append({
                "Order ID": o.order_id,
                "Date": str(o.date) if o.date else "",
                "Status": o.status,
                "Fulfilment": o.fulfilment,
                "Category": o.category,
                "SKU": o.sku,
                "Qty": o.qty,
                "Amount": o.amount,
                "Ship State": o.ship_state,
                "COGS": o.estimated_cogs,
                "Platform Fee": o.platform_fee,
                "Shipping Cost": o.shipping_cost,
                "GST": o.gst,
                "Return Loss": o.return_loss,
                "Estimated Profit": o.estimated_profit,
                "Risk Probability": o.risk_probability,
            })
        df_orders = pd.DataFrame(order_list)
        df_orders.to_excel(writer, sheet_name="Orders Detail", index=False)

    return output.getvalue()


def generate_pdf_export(db: Session, upload_id: str) -> bytes:
    """Generates a formatted PDF executive summary report."""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    overview = get_dashboard_overview(db, upload_id)
    profit_overview = get_profit_overview(db, upload_id)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#3F6B4F'), # Valley Green
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        'ReportSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#6B7280'),
        spaceAfter=14,
    )
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#3F6B4F'),
        spaceBefore=12,
        spaceAfter=8,
    )
    body_style = ParagraphStyle(
        'ReportBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1F2937'),
    )

    # Title & Metadata
    story.append(Paragraph("ProfitLens — Executive Profitability Report", title_style))
    filename = upload.original_filename if upload else "Sales Report"
    gen_time = datetime.now().strftime("%B %d, %Y at %H:%M")
    story.append(Paragraph(f"Dataset: <b>{filename}</b> | Generated on: <b>{gen_time}</b>", subtitle_style))
    story.append(Spacer(1, 10))

    # KPI Table
    story.append(Paragraph("Executive Performance Summary", heading_style))
    kpis = overview.get("kpis", {})
    kpi_data = [
        ["Metric", "Value", "Metric", "Value"],
        [
            "Total Revenue", f"₹{kpis.get('revenue', {}).get('value', 0):,.2f}",
            "Estimated Profit", f"₹{kpis.get('estimatedProfit', {}).get('value', 0):,.2f}"
        ],
        [
            "Profit Margin", f"{kpis.get('profitMargin', {}).get('value', 0):.1f}%",
            "Total Orders", f"{kpis.get('orders', {}).get('value', 0):,}"
        ],
        [
            "Average Order Value", f"₹{kpis.get('averageOrderValue', {}).get('value', 0):,.2f}",
            "Merchant Return Rate", f"{kpis.get('returnRate', {}).get('value', 0):.1f}%"
        ],
    ]
    t_kpi = Table(kpi_data, colWidths=[130, 130, 130, 130])
    t_kpi.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3F6B4F')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#FAFAF8')]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_kpi)
    story.append(Spacer(1, 14))

    # Top Category Breakdown
    story.append(Paragraph("Category Performance Breakdown", heading_style))
    cat_perf = profit_overview.get("categoryPerformance", [])[:7] # Top 7
    cat_table_data = [["Category", "Revenue (₹)", "Estimated Profit (₹)", "Margin %", "Orders"]]
    for c in cat_perf:
        cat_table_data.append([
            c.get("category", "N/A"),
            f"₹{c.get('revenue', 0):,.2f}",
            f"₹{c.get('profit', 0):,.2f}",
            f"{c.get('marginPercent', 0):.1f}%",
            str(c.get("orders", 0)),
        ])

    if len(cat_table_data) > 1:
        t_cat = Table(cat_table_data, colWidths=[130, 110, 110, 80, 90])
        t_cat.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#00594C')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8.5),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#FAFAF8')]),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(t_cat)

    story.append(Spacer(1, 14))

    # Deterministic Insights
    story.append(Paragraph("Key Strategic Insights", heading_style))
    insights = overview.get("insights", [])
    for insight in insights:
        story.append(Paragraph(f"• {insight}", body_style))
        story.append(Spacer(1, 3))

    doc.build(story)
    return buffer.getvalue()
