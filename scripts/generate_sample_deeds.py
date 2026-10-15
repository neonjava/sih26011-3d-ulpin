#!/usr/bin/env python3
"""
generate_sample_deeds.py
------------------------
Generates authentic, realistic Indian Sale Deed & Index-II PDFs using ReportLab
for the SIH26011 3D-ULPIN Cadastral and Vertical Property Mapping System.

Generated Deeds:
1. deed_sbi_registered_flat402.pdf
   - Legitimate registered sale deed on Flat 402, Wing A, Sagar View Towers, Bandra West.
   - Registered with SRO Bandra-3 and pledged to State Bank of India (CERSAI ID: CERSAI-SBI-2024-88912).
2. deed_hdfc_duplicate_flat402.pdf
   - Counterfeit / duplicate deed targeting the exact same 3D voxel (Flat 402 Wing A) for HDFC Bank loan.
   - Illustrates double mortgage fraud caught by 3D-ULPIN collision detection.
3. deed_phantom_floor14_penthouse.pdf
   - Unauthorized 14th floor penthouse deed violating municipal sanction (MCGM max 12 floors).
   - Illustrates vertical phantom floor fraud caught by 3D-ULPIN spatial limit checking.
"""

import os
import sys
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm, inch, cm
pt = 1
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Group, Circle
from reportlab.graphics.barcode import qr, code128

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIRS = [ROOT / 'backend/app/data', ROOT / 'backend/app/data/deeds', ROOT / 'scripts']

for d in OUTPUT_DIRS:
    os.makedirs(d, exist_ok=True)


def create_stamp_header(certificate_no, stamp_duty_inr, reg_fee_inr, ulpin_str, is_fraud=False, fraud_type=None):
    """Draws an authentic Indian e-Stamp / GRAS Stamp Paper header banner"""
    d = Drawing(520, 105)

    # Outer ornate frame
    frame_color = colors.HexColor("#7A1C1C") if not is_fraud else colors.HexColor("#900C3F")
    bg_color = colors.HexColor("#FFFDF7")
    d.add(Rect(0, 0, 520, 105, fillColor=bg_color, strokeColor=frame_color, strokeWidth=1.5, rx=4, ry=4))
    d.add(Rect(3, 3, 514, 99, fillColor=None, strokeColor=frame_color, strokeWidth=0.6, rx=3, ry=3))

    # Top banner bar
    d.add(Rect(4, 78, 512, 23, fillColor=frame_color, strokeColor=None))
    d.add(String(260, 89, "GOVERNMENT OF MAHARASHTRA", fontName="Helvetica-Bold", fontSize=10, fillColor=colors.white, textAnchor="middle"))
    d.add(String(260, 81, "DEPARTMENT OF REGISTRATION AND STAMPS - e-STAMP CERTIFICATE / GRAS", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#FFD700"), textAnchor="middle"))

    # Certificate details
    d.add(String(15, 65, f"Certificate No: {certificate_no}", fontName="Helvetica-Bold", fontSize=8, fillColor=colors.HexColor("#1A252C")))
    d.add(String(15, 52, f"Stamp Duty Paid: Rs. {stamp_duty_inr:,.2f}", fontName="Helvetica-Bold", fontSize=8, fillColor=colors.HexColor("#1B4D3E")))
    d.add(String(15, 40, f"Registration Fee: Rs. {reg_fee_inr:,.2f}", fontName="Helvetica", fontSize=7.5, fillColor=colors.HexColor("#333333")))
    d.add(String(15, 28, f"3D-ULPIN Cadastral Token: {ulpin_str}", fontName="Helvetica-Bold", fontSize=7, fillColor=colors.HexColor("#0D3B66")))
    d.add(String(15, 16, "Issued by: Stock Holding Corporation of India Ltd / SRO Bandra-3 (Andheri Taluka)", fontName="Helvetica-Oblique", fontSize=6.5, fillColor=colors.HexColor("#555555")))
    d.add(String(15, 6, "Verification Portal: https://gras.maharashtra.gov.in | Security Hash: SHA256-OK77192", fontName="Helvetica", fontSize=5.5, fillColor=colors.HexColor("#777777")))

    # Stamp duty round seal graphic
    d.add(Circle(370, 45, 25, fillColor=colors.HexColor("#FFF8DC"), strokeColor=frame_color, strokeWidth=1))
    d.add(Circle(370, 45, 22, fillColor=None, strokeColor=frame_color, strokeWidth=0.5))
    d.add(String(370, 49, "GOVT OF", fontName="Helvetica-Bold", fontSize=5.5, fillColor=frame_color, textAnchor="middle"))
    d.add(String(370, 43, "MAHARASHTRA", fontName="Helvetica-Bold", fontSize=5, fillColor=frame_color, textAnchor="middle"))
    d.add(String(370, 36, "IGR SEAL", fontName="Helvetica", fontSize=5, fillColor=frame_color, textAnchor="middle"))

    # Barcode
    try:
        bc = code128.Code128(certificate_no.replace("-", "")[:12], barHeight=22, barWidth=0.8, humanReadable=False)
        bc_drawing = Group(bc)
        bc_drawing.translate(415, 38)
        d.add(bc_drawing)
        d.add(String(460, 26, certificate_no[:14], fontName="Helvetica", fontSize=6, fillColor=colors.black, textAnchor="middle"))
    except Exception:
        pass

    # Fraud warning badge if fraudulent
    if is_fraud:
        d.add(Rect(130, 3, 260, 15, fillColor=colors.HexColor("#C0392B"), strokeColor=None, rx=2, ry=2))
        d.add(String(260, 7, f"ALERT: {fraud_type}", fontName="Helvetica-Bold", fontSize=6.5, fillColor=colors.white, textAnchor="middle"))

    return d


def create_qr_box(qr_text, caption):
    """Draws a QR code with cadastral metadata"""
    d = Drawing(105, 105)
    d.add(Rect(0, 0, 105, 105, fillColor=colors.HexColor("#F8F9FA"), strokeColor=colors.HexColor("#BDC3C7"), strokeWidth=0.8, rx=3, ry=3))
    try:
        qr_code = qr.QrCodeWidget(qr_text)
        qr_code.barWidth = 72
        qr_code.barHeight = 72
        qr_code.qrVersion = 2
        d.add(qr_code)
    except Exception:
        pass
    d.add(String(52, 7, caption, fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#2C3E50"), textAnchor="middle"))
    return d


def build_index_ii_table(doc_no, reg_date, cts_no, land_ulpin, unit_ulpin, flat_no, floor, wing,
                         carpet_area_sqm, carpet_area_sqft, z_min, z_max, consideration_inr,
                         market_val_inr, vendor_name, purchaser_name, styles):
    """Generates the official Index-II tabular extract mandated by Registration Act 1908"""
    th_style = ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, leading=9, textColor=colors.white, alignment=TA_CENTER)
    tb_key_style = ParagraphStyle('TBKey', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7, leading=8.5, textColor=colors.HexColor("#1A252C"))
    tb_val_style = ParagraphStyle('TBVal', parent=styles['Normal'], fontName='Helvetica', fontSize=7, leading=8.5, textColor=colors.HexColor("#222222"))

    table_data = [
        [
            Paragraph("INDEX-II EXTRACT (REGISTRATION ACT 1908 - SEC 55)<br/><font size=6>Inspector General of Registration & Controller of Stamps, Maharashtra</font>", th_style),
            ""
        ],
        [
            Paragraph("<b>1. SRO & Registration Details:</b>", tb_key_style),
            Paragraph(f"Office: SRO Bandra-3 (Andheri) | Doc Serial No: <b>{doc_no}</b> | Reg Date: <b>{reg_date}</b> | Book No: 1", tb_val_style)
        ],
        [
            Paragraph("<b>2. Cadastral Land Identifiers:</b>", tb_key_style),
            Paragraph(f"Village: Bandra West | Taluka: Andheri | Dist: Mumbai Suburban | <b>CTS No. {cts_no}</b> | Base Land 2D-ULPIN: <b>{land_ulpin}</b>", tb_val_style)
        ],
        [
            Paragraph("<b>3. 3D-ULPIN (Vertical Cadastre):</b>", tb_key_style),
            Paragraph(f"<b>{unit_ulpin}</b><br/>Volumetric Spatial Coordinate Envelope: <b>Z = +{z_min:.2f}m to +{z_max:.2f}m MSL</b> (Ground Datum: +6.00m MSL)", tb_val_style)
        ],
        [
            Paragraph("<b>4. Property Description:</b>", tb_key_style),
            Paragraph(f"Flat No: <b>{flat_no}</b> | Floor: <b>{floor}</b> | Wing: <b>{wing}</b> | Building: <b>Sagar View Towers</b><br/>RERA Carpet Area: <b>{carpet_area_sqm:.2f} sq.m ({carpet_area_sqft:.2f} sq.ft)</b> | Undivided Land Share: 2.15% | Car Parking: Stilt P-14", tb_val_style)
        ],
        [
            Paragraph("<b>5. Valuation & Consideration:</b>", tb_key_style),
            Paragraph(f"Consideration: <b>Rs. {consideration_inr:,.2f}</b> | Ready Reckoner Market Value: <b>Rs. {market_val_inr:,.2f}</b>", tb_val_style)
        ],
        [
            Paragraph("<b>6. Executant (Vendor):</b>", tb_key_style),
            Paragraph(vendor_name, tb_val_style)
        ],
        [
            Paragraph("<b>7. Claimant (Purchaser):</b>", tb_key_style),
            Paragraph(purchaser_name, tb_val_style)
        ]
    ]

    t = Table(table_data, colWidths=[140, 375])
    t.setStyle(TableStyle([
        ('SPAN', (0, 0), (1, 0)),
        ('BACKGROUND', (0, 0), (1, 0), colors.HexColor("#0D3B66")),
        ('ALIGN', (0, 0), (1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#BDC3C7")),
        ('BACKGROUND', (0, 1), (0, -1), colors.HexColor("#F4F6F7")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    return t


def generate_sbi_legitimate_deed():
    """Deed 1: Legitimate Registered Sale Deed & Mortgage for Flat 402 Wing A"""
    pdf_filename = "deed_sbi_registered_flat402.pdf"
    doc_paths = [os.path.join(d, pdf_filename) for d in OUTPUT_DIRS]

    doc = SimpleDocTemplate(
        doc_paths[0],
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=28,
        bottomMargin=28
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('DocTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=12, leading=15, alignment=TA_CENTER, textColor=colors.HexColor("#1A252C"))
    sub_title = ParagraphStyle('SubTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, alignment=TA_CENTER, textColor=colors.HexColor("#0D3B66"))
    body_style = ParagraphStyle('LegalBody', parent=styles['Normal'], fontName='Times-Roman', fontSize=8.5, leading=11.5, alignment=TA_JUSTIFY, textColor=colors.HexColor("#111111"))
    heading_sec = ParagraphStyle('SecHeading', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=colors.HexColor("#7A1C1C"))
    callout_box = ParagraphStyle('Callout', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=10.5, textColor=colors.HexColor("#0B5345"))

    elements = []

    # ==================== PAGE 1 ====================
    # 1. e-Stamp Header
    stamp_drawing = create_stamp_header(
        certificate_no="IN-MH91823741982001U",
        stamp_duty_inr=1050000.00,
        reg_fee_inr=30000.00,
        ulpin_str="MH27-045-8912345-WIGA-FL04-U402"
    )
    elements.append(stamp_drawing)
    elements.append(Spacer(1, 6))

    # 2. Document Title
    elements.append(Paragraph("DEED OF ABSOLUTE SALE & TRANSFER OF 3D PROPERTY RIGHTS", title_style))
    elements.append(Paragraph("(Under Maharashtra Ownership Flats Act 1963, RERA 2016 & Registration Act 1908)", sub_title))
    elements.append(Spacer(1, 6))

    # 3. Index-II Table
    index_table = build_index_ii_table(
        doc_no="BDR-3/12458/2024",
        reg_date="15/03/2024",
        cts_no="1245/8",
        land_ulpin="MH27-045-8912345",
        unit_ulpin="MH27-045-8912345-WIGA-FL04-U402",
        flat_no="Flat No. 402",
        floor="4th Floor",
        wing="Wing A",
        carpet_area_sqm=88.50,
        carpet_area_sqft=952.60,
        z_min=13.50,
        z_max=16.50,
        consideration_inr=17500000.00,
        market_val_inr=16800000.00,
        vendor_name="<b>M/s Sagar Promoters & Developers LLP</b> (Rep by Partner Mr. Suresh Mehta)",
        purchaser_name="<b>1. Mr. Rajesh Kumar Sharma</b> (PAN: ABCPS1234K)<br/><b>2. Mrs. Priya R. Sharma</b> (PAN: BDCPS5678M)",
        styles=styles
    )
    elements.append(index_table)
    elements.append(Spacer(1, 6))

    # 4. Bank Encumbrance Endorsement Box
    encumb_data = [
        [
            Paragraph("<b>STATE BANK OF INDIA - MORTGAGE ENDORSEMENT RECORD</b><br/>"
                      "This 3D-ULPIN Unit <b>MH27-045-8912345-WIGA-FL04-U402</b> is mortgaged via Equitable Mortgage to <b>State Bank of India (Bandra West SME Branch)</b> "
                      "against Housing Loan Account <b>SBI-HL-39811029481</b> (Sanctioned Limit: <b>Rs. 1,75,00,000/-</b>).<br/>"
                      "Central Registry CERSAI Security Interest ID: <b>CERSAI-SBI-2024-88912</b> | Registered on: <b>18/03/2024</b>.", callout_box)
        ]
    ]
    t_encumb = Table(encumb_data, colWidths=[515])
    t_encumb.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#E8F8F5")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#16A085")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t_encumb)
    elements.append(Spacer(1, 6))

    # 5. Preamble & Recitals on Page 1
    p1 = ("<b>THIS INDENTURE OF SALE</b> is made at Mumbai on this <b>15th day of March, 2024</b> between "
          "<b>M/s SAGAR PROMOTERS & DEVELOPERS LLP</b>, registered under LLP Act 2008 having office at 401, Nariman Point, Mumbai (hereinafter called the <b>'VENDOR'</b>) "
          "AND <b>(1) Mr. RAJESH KUMAR SHARMA</b>, aged 42 years, and <b>(2) Mrs. PRIYA R. SHARMA</b>, aged 39 years, residing at Bandra West, Mumbai (hereinafter jointly called the <b>'PURCHASERS'</b>).<br/>"
          "<b>WHEREAS</b> Vendor developed freehold land <b>CTS No. 1245/8</b> (Land ULPIN: <b>MH27-045-8912345</b>) admeasuring 2,450.00 sq.m pursuant to MCGM Sanction Plan No. <b>CE/4502/WS/AH</b> "
          "and Commencement Certificate No. <b>CC/2021/WS/3902</b> (MahaRERA Reg: <b>P51800001234</b>) constructing <b>'Sagar View Towers'</b>.<br/>"
          "<b>WHEREAS</b> Purchasers have paid full consideration of <b>Rs. 1,75,00,000/-</b> (funded partly via SBI Housing Loan) for acquisition of absolute 3D ownership rights.")
    elements.append(Paragraph(p1, body_style))

    # ==================== PAGE 2 ====================
    elements.append(PageBreak())

    elements.append(Paragraph("OPERATIVE CONVEYANCE TERMS & CONDITIONS:", heading_sec))
    cov_text = ("1. <b>Conveyance of Title:</b> The Vendor hereby conveys, transfers, and assigns absolutely unto the Purchasers all rights, title, interest, and 3D spatial ownership in the Unit described in Schedule 'B'.<br/>"
                "2. <b>Undivided Share in Land:</b> The Unit carries an undivided, indivisible 2.15% proportionate right in the common areas and land parcel described in Schedule 'A'.<br/>"
                "3. <b>Warranty of Title:</b> The Vendor warrants unencumbered marketable title, having cleared all municipal taxes, water charges, and statutory cess up to the date of execution.<br/>"
                "4. <b>CERSAI Registration:</b> The Purchasers have deposited the original registered deed with State Bank of India creating a first equitable charge recorded in CERSAI.")
    elements.append(Paragraph(cov_text, body_style))
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("SCHEDULE 'A' - LARGER LAND PARCEL (2D CADASTRE)", heading_sec))
    sch_a = ("Freehold non-agricultural land bearing <b>CTS No. 1245/8</b>, Survey No. 78/A, Hissa No. 8, Village Bandra, Taluka Andheri, Mumbai Suburban District, "
             "containing <b>2,450.00 sq. meters</b>, identified by <b>Land ULPIN: MH27-045-8912345</b>.<br/>"
             "<b>Boundaries:</b> North: CTS No. 1245/7 | South: 18.30m Wide Municipal Road | East: CTS No. 1245/9 | West: Bandra Bandstand Promenade.")
    elements.append(Paragraph(sch_a, body_style))
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("SCHEDULE 'B' - 3D VOLUMETRIC UNIT (VERTICAL CADASTRE)", heading_sec))
    sch_b = ("The specific 3D Stratified Property Unit identified as <b>Flat No. 402</b>, <b>4th Floor, Wing 'A'</b>, Sagar View Towers:<br/>"
             "• <b>Unique 3D-ULPIN:</b> <font color='#0D3B66'><b>MH27-045-8912345-WIGA-FL04-U402</b></font><br/>"
             "• <b>Volumetric Elevation Bounds:</b> Plinth Z-min = <b>+13.50m</b>, Ceiling Z-max = <b>+16.50m MSL</b> (Thickness: 3.00m).<br/>"
             "• <b>RERA Carpet Area:</b> <b>88.50 sq. meters (952.60 sq. feet)</b> | Built-up Area: 104.20 sq.m.<br/>"
             "• <b>Dedicated Parking:</b> Covered Stilt Car Parking Space No. <b>P-14</b> at ground level (Z: 0.00m to 2.50m).<br/>"
             "• <b>Unit Internal Boundaries:</b> North: Flat 401 | South: Outer Facade | East: Lift Lobby | West: Arabian Sea View.")
    elements.append(Paragraph(sch_b, body_style))
    elements.append(Spacer(1, 8))

    # Signatures, Witnesses and QR Code
    sig_data = [
        [
            Paragraph("<b>EXECUTED & SIGNED:</b><br/><br/><i>Sd/-</i><br/><b>Suresh Mehta (Vendor)</b><br/>For Sagar Promoters LLP", body_style),
            Paragraph("<b>WITNESSES:</b><br/><br/>1. <i>Sd/-</i> Arun Kulkarni (Bandra)<br/>2. <i>Sd/-</i> Neha Deshmukh (Khar)", body_style),
            Paragraph("<b>PURCHASERS:</b><br/><br/><i>Sd/-</i> <b>Rajesh K. Sharma</b><br/><i>Sd/-</i> <b>Priya R. Sharma</b>", body_style),
            create_qr_box("3D-ULPIN:MH27-045-8912345-WIGA-FL04-U402|SBI-CERSAI:88912|SRO:BDR-3/12458/2024", "VALID CADASTRAL UNIT")
        ]
    ]
    t_sig = Table(sig_data, colWidths=[120, 130, 130, 135])
    t_sig.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(t_sig)

    doc.build(elements)

    for dest in doc_paths[1:]:
        with open(doc_paths[0], 'rb') as src_f, open(dest, 'wb') as dst_f:
            dst_f.write(src_f.read())

    print(f"[OK] Generated Legitimate SBI Deed: {doc_paths[0]}")


def generate_hdfc_duplicate_deed():
    """Deed 2: Fraudulent Duplicate Deed targeting Flat 402 for HDFC Loan (Double Mortgage Attack)"""
    pdf_filename = "deed_hdfc_duplicate_flat402.pdf"
    doc_paths = [os.path.join(d, pdf_filename) for d in OUTPUT_DIRS]

    doc = SimpleDocTemplate(
        doc_paths[0],
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=28,
        bottomMargin=28
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('DocTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=12, leading=15, alignment=TA_CENTER, textColor=colors.HexColor("#78281F"))
    sub_title = ParagraphStyle('SubTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, alignment=TA_CENTER, textColor=colors.HexColor("#900C3F"))
    body_style = ParagraphStyle('LegalBody', parent=styles['Normal'], fontName='Times-Roman', fontSize=8.5, leading=11.5, alignment=TA_JUSTIFY, textColor=colors.HexColor("#111111"))
    heading_sec = ParagraphStyle('SecHeading', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=colors.HexColor("#900C3F"))
    alert_style = ParagraphStyle('AlertText', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, leading=10.5, textColor=colors.HexColor("#900C3F"))

    elements = []

    # ==================== PAGE 1 ====================
    # 1. Counterfeit e-Stamp Header with Fraud Warning
    stamp_drawing = create_stamp_header(
        certificate_no="COUNTERFEIT-MH2024-99120",
        stamp_duty_inr=1080000.00,
        reg_fee_inr=30000.00,
        ulpin_str="MH27-045-8912345-WIGA-FL04-U402",
        is_fraud=True,
        fraud_type="DUPLICATE MORTGAGE ATTEMPT DETECTED"
    )
    elements.append(stamp_drawing)
    elements.append(Spacer(1, 6))

    # 2. Fraud Warning Banner Box
    fraud_box_data = [
        [
            Paragraph("<b>CRITICAL FORENSIC AUDIT ALERT - 3D CADASTRAL COLLISION DETECTED</b><br/>"
                      "• <b>Collision Type:</b> DUPLICATE MORTGAGE / DOUBLE FINANCING CONVEYANCE FRAUD<br/>"
                      "• <b>Target 3D-ULPIN:</b> <b>MH27-045-8912345-WIGA-FL04-U402</b> (Flat 402, Wing A, Sagar View Towers)<br/>"
                      "• <b>Existing Encumbrance:</b> Already mortgaged to <b>State Bank of India</b> under CERSAI ID <b>CERSAI-SBI-2024-88912</b> on 18/03/2024.<br/>"
                      "• <b>Fraudulent Attempt:</b> Impostor 'Vikram Malhotra' presented forged title paper chain to <b>HDFC Bank (BKC Branch)</b> under Application No. <b>HDFC-APP-2024-88419</b> for Rs. 1,80,00,000/-.<br/>"
                      "• <b>Engine Status:</b> <b>TRANSACTION BLOCKED IN 3D CADASTRE. NO TITLE TRANSFER RECOGNIZED.</b>", alert_style)
        ]
    ]
    t_fraud = Table(fraud_box_data, colWidths=[515])
    t_fraud.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FDEDEC")),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor("#C0392B")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t_fraud)
    elements.append(Spacer(1, 6))

    # 3. Document Title
    elements.append(Paragraph("DEED OF ASSIGNMENT & RESALE (FRAUDULENT DUPLICATE TITLE)", title_style))
    elements.append(Paragraph("Purported Resale Deed Presented for HDFC Bank Housing Loan Application", sub_title))
    elements.append(Spacer(1, 6))

    # 4. Index-II Table for Fraudulent Deed
    index_table = build_index_ii_table(
        doc_no="FORGED-BDR-3/9912/2024",
        reg_date="10/08/2024 (COUNTERFEIT)",
        cts_no="1245/8",
        land_ulpin="MH27-045-8912345",
        unit_ulpin="MH27-045-8912345-WIGA-FL04-U402",
        flat_no="Flat No. 402",
        floor="4th Floor",
        wing="Wing A",
        carpet_area_sqm=88.50,
        carpet_area_sqft=952.60,
        z_min=13.50,
        z_max=16.50,
        consideration_inr=18000000.00,
        market_val_inr=17200000.00,
        vendor_name="<font color='#900C3F'><b>Vikram Malhotra (Impostor Seller / Shell Identity)</b></font>",
        purchaser_name="<b>HDFC Bank Loan Applicant Nominee</b>",
        styles=styles
    )
    elements.append(index_table)
    elements.append(Spacer(1, 6))

    # 5. Body Text Explaining Title Pretence on Page 1
    p1 = ("<b>THIS PURPORTED DEED</b> is made on <b>10th August 2024</b> wherein the alleged Vendor <b>VIKRAM MALHOTRA</b> falsely claims to hold unencumbered freehold title "
          "to the 3D unit Flat 402, Wing A, Sagar View Towers (3D-ULPIN: <b>MH27-045-8912345-WIGA-FL04-U402</b>) through forged prior agreements, attempting to create a second mortgage in favor of <b>HDFC Bank Ltd</b>.")
    elements.append(Paragraph(p1, body_style))

    # ==================== PAGE 2 ====================
    elements.append(PageBreak())

    elements.append(Paragraph("FORENSIC 3D-ULPIN COLLISION AUDIT REPORT:", heading_sec))
    audit_text = ("1. <b>Spatial Voxel Conflict:</b> The 3D bounding box [Z: 13.50m - 16.50m] on CTS 1245/8 is locked by active registered charge <b>CERSAI-SBI-2024-88912</b>.<br/>"
                  "2. <b>Title Chain Forgery:</b> Impostor Vikram Malhotra fabricated unregistered notarized agreements dated 2023 to simulate an authentic chain of title.<br/>"
                  "3. <b>Banking Risk Mitigation:</b> Automated 3D-ULPIN registry query intercepted HDFC Bank's pre-sanction legal check, blocking loan disbursement of Rs. 1.80 Cr.<br/>"
                  "4. <b>Statutory Prosecution:</b> Case registered under IPC 420/467/468 with Mumbai Cyber Police & Maharashtra IGR Vigilance Wing.")
    elements.append(Paragraph(audit_text, body_style))
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("SCHEDULE 'A' - TARGET LAND PARCEL (CTS NO. 1245/8)", heading_sec))
    sch_a = ("Cadastral Land Parcel <b>CTS No. 1245/8</b>, Village Bandra, Taluka Andheri, Land 2D-ULPIN: <b>MH27-045-8912345</b>, admeasuring 2,450.00 sq.m.")
    elements.append(Paragraph(sch_a, body_style))
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("SCHEDULE 'B' - DUPLICATE TARGETED 3D UNIT (SPATIAL VOXEL COLLISION)", heading_sec))
    sch_b = ("<b>Target 3D-ULPIN:</b> <font color='#900C3F'><b>MH27-045-8912345-WIGA-FL04-U402</b></font><br/>"
             "<b>Target Vertical Voxel:</b> Plinth Z = <b>+13.50m to +16.50m MSL</b>, Floor: 4th Floor, Wing A.<br/>"
             "<b>Cadastral Verification Failure:</b> 3D spatial indexing verified that this exact spatial volume is legally registered under <b>BDR-3/12458/2024</b> to Rajesh Kumar Sharma & Priya R. Sharma and actively mortgaged to SBI.<br/>"
             "<b>Action Taken:</b> Transaction suspended under Indian Penal Code Section 420/467/468 and forwarded to State Cadastral Vigilance Bureau.")
    elements.append(Paragraph(sch_b, body_style))
    elements.append(Spacer(1, 8))

    # Signatures
    sig_data = [
        [
            Paragraph("<b>FORGED SIGNATURE:</b><br/><br/><i>Sd/- (Fake)</i><br/><b>Vikram Malhotra</b><br/><font color='red'>[IMPOSTOR IDENTITY]</font>", body_style),
            Paragraph("<b>WITNESSES (FABRICATED):</b><br/><br/>1. <i>Sd/-</i> R. K. Saxena<br/>2. <i>Sd/-</i> D. P. Gupta", body_style),
            Paragraph("<b>BANK SCRUTINY STAMP:</b><br/><br/><b>HDFC Risk Dept</b><br/><font color='red'>REJECTED DUE TO 3D ULPIN CERSAI COLLISION</font>", body_style),
            create_qr_box("FRAUD_ALERT|ULPIN:MH27-045-8912345-WIGA-FL04-U402|SBI-COLLISION:88912", "FLAGGED DUPLICATE")
        ]
    ]
    t_sig = Table(sig_data, colWidths=[120, 130, 130, 135])
    t_sig.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(t_sig)

    doc.build(elements)

    for dest in doc_paths[1:]:
        with open(doc_paths[0], 'rb') as src_f, open(dest, 'wb') as dst_f:
            dst_f.write(src_f.read())

    print(f"[OK] Generated Fraudulent Duplicate HDFC Deed: {doc_paths[0]}")


def generate_phantom_floor_deed():
    """Deed 3: Unauthorized 14th Floor Penthouse Deed (Municipal Sanction Limit Violation)"""
    pdf_filename = "deed_phantom_floor14_penthouse.pdf"
    doc_paths = [os.path.join(d, pdf_filename) for d in OUTPUT_DIRS]

    doc = SimpleDocTemplate(
        doc_paths[0],
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=28,
        bottomMargin=28
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('DocTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=12, leading=15, alignment=TA_CENTER, textColor=colors.HexColor("#7D3C98"))
    sub_title = ParagraphStyle('SubTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, alignment=TA_CENTER, textColor=colors.HexColor("#4A235A"))
    body_style = ParagraphStyle('LegalBody', parent=styles['Normal'], fontName='Times-Roman', fontSize=8.5, leading=11.5, alignment=TA_JUSTIFY, textColor=colors.HexColor("#111111"))
    heading_sec = ParagraphStyle('SecHeading', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=colors.HexColor("#7D3C98"))
    alert_style = ParagraphStyle('AlertText', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, leading=10.5, textColor=colors.HexColor("#6C3483"))

    elements = []

    # ==================== PAGE 1 ====================
    # 1. Stamp Header with Phantom Floor Warning
    stamp_drawing = create_stamp_header(
        certificate_no="UNSANCTIONED-MH2024-FL14",
        stamp_duty_inr=1650000.00,
        reg_fee_inr=30000.00,
        ulpin_str="MH27-045-8912345-WIGA-FL14-U1401",
        is_fraud=True,
        fraud_type="PHANTOM FLOOR SANCTION VIOLATION"
    )
    elements.append(stamp_drawing)
    elements.append(Spacer(1, 6))

    # 2. Municipal Sanction Violation Banner Box
    violation_box_data = [
        [
            Paragraph("<b>MCGM MUNICIPAL SANCTION VIOLATION & PHANTOM FLOOR ALERT</b><br/>"
                      "• <b>Violation Type:</b> ILLEGAL VERTICAL EXTENSION / UNAUTHORIZED PHANTOM FLOOR<br/>"
                      "• <b>Approved Plan Sanction:</b> MCGM Plan No. <b>CE/4502/WS/AH</b> permits maximum <b>12 FLOORS (Height Cap: 42.00m)</b>.<br/>"
                      "• <b>Subject Unit Location:</b> <b>14th Floor (Penthouse 1401)</b> at Elevation <b>Z = +45.50m to +49.00m MSL</b> (+7.00m beyond legal ceiling).<br/>"
                      "• <b>FSI Status:</b> Permissible FSI 2.50 consumed. Floors 13 & 14 constitute 963.00 sq.m of unapproved FSI.<br/>"
                      "• <b>Notice Issued:</b> Stop-work / Demolition Notice under Section 53(1) of Maharashtra Regional and Town Planning (MRTP) Act, 1966.", alert_style)
        ]
    ]
    t_viol = Table(violation_box_data, colWidths=[515])
    t_viol.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F4ECF7")),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor("#7D3C98")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t_viol)
    elements.append(Spacer(1, 6))

    # 3. Document Title
    elements.append(Paragraph("PURPORTED SALE DEED OF 14TH FLOOR PENTHOUSE SUITE", title_style))
    elements.append(Paragraph("(Unauthorized Unit Constructed Outside Approved Municipal Plan)", sub_title))
    elements.append(Spacer(1, 6))

    # 4. Index-II Table for Phantom Unit
    index_table = build_index_ii_table(
        doc_no="REJECTED-MRTP-2024-FL14",
        reg_date="PENDING_LEGAL_ACTION",
        cts_no="1245/8",
        land_ulpin="MH27-045-8912345",
        unit_ulpin="MH27-045-8912345-WIGA-FL14-U1401",
        flat_no="Penthouse Flat 1401",
        floor="14th Floor (UNSANCTIONED)",
        wing="Wing A",
        carpet_area_sqm=125.40,
        carpet_area_sqft=1349.80,
        z_min=45.50,
        z_max=49.00,
        consideration_inr=27500000.00,
        market_val_inr=26000000.00,
        vendor_name="<font color='#7D3C98'><b>Defaulting Promoter / Unapproved Developer Stock</b></font>",
        purchaser_name="<b>Unsuspecting Homebuyer / High Net-Worth Investor</b>",
        styles=styles
    )
    elements.append(index_table)
    elements.append(Spacer(1, 6))

    # 5. Body Text Describing Municipal Discrepancy on Page 1
    p1 = ("<b>THIS INSTRUMENT</b> purports to convey title to a luxury duplex penthouse suite designated as <b>Flat No. 1401, 14th Floor, Wing A, Sagar View Towers</b>. "
          "Whereas the 3D-ULPIN Cadastral Engine performs automatic boundary verification against the municipal sanction envelope in <b>sanctioned_plans.json</b> and "
          "detected that this unit's vertical coordinate (Z = +45.50m to +49.00m) exceeds the building height envelope (Max 42.00m) and max floor limit (12 Floors).")
    elements.append(Paragraph(p1, body_style))

    # ==================== PAGE 2 ====================
    elements.append(PageBreak())

    elements.append(Paragraph("MUNICIPAL PLAN SANCTION DISCREPANCY AUDIT:", heading_sec))
    audit_text = ("1. <b>Building Sanction Cap:</b> MCGM Sanction Plan No. <b>CE/4502/WS/AH</b> explicitly capped Wing A at <b>Stilt + 12 Upper Floors (42.00 meters)</b>.<br/>"
                  "2. <b>Illegal Construction:</b> Promoter erected Floors 13 & 14 without obtaining amended IOD/CC or paying premium FSI charges.<br/>"
                  "3. <b>Automated Spatial Rejection:</b> The 3D-ULPIN GIS engine flagged Z-level (+45.50m to +49.00m) as outside the valid 3D polygon envelope.<br/>"
                  "4. <b>Consumer Protection Notice:</b> Homebuyers are cautioned that unauthorized floors cannot obtain Occupancy Certificate (OC) or legal electricity/water meters.")
    elements.append(Paragraph(audit_text, body_style))
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("SCHEDULE 'A' - SANCTIONED BASE LAND (CTS NO. 1245/8)", heading_sec))
    sch_a = ("Cadastral Land Parcel <b>CTS No. 1245/8</b>, Village Bandra, Taluka Andheri, Land 2D-ULPIN: <b>MH27-045-8912345</b>, admeasuring 2,450.00 sq.m.")
    elements.append(Paragraph(sch_a, body_style))
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("SCHEDULE 'B' - UNAUTHORIZED 3D PHANTOM UNIT", heading_sec))
    sch_b = ("<b>Unit Identifier:</b> <font color='#7D3C98'><b>MH27-045-8912345-WIGA-FL14-U1401</b></font><br/>"
             "<b>Volumetric Vertical Bounds:</b> Z-min = <b>+45.50m</b>, Z-max = <b>+49.00m</b> (Height Cap Breach: +7.00m).<br/>"
             "<b>Carpet Area Claimed:</b> 125.40 sq.m (1,349.80 sq.ft).<br/>"
             "<b>Cadastral Engine Action:</b> <b>REGISTRATION PROHIBITED</b>. Unit marked as <code>UNAUTHORIZED_VERTICAL_EXTENSION</code> in National 3D Cadastre Registry.")
    elements.append(Paragraph(sch_b, body_style))
    elements.append(Spacer(1, 8))

    # Signatures
    sig_data = [
        [
            Paragraph("<b>PROMOTER SIGNATURE:</b><br/><br/><i>Sd/-</i><br/><b>Developer (Under Notice)</b><br/><font color='purple'>[SANCTION BREACH]</font>", body_style),
            Paragraph("<b>WITNESSES:</b><br/><br/>1. <i>Sd/-</i> K. S. Iyengar<br/>2. <i>Sd/-</i> M. V. Joshi", body_style),
            Paragraph("<b>MUNICIPAL AUDIT STAMP:</b><br/><br/><b>MCGM Building Proposal</b><br/><font color='purple'>ILLEGAL FLOOR - DEMOLITION NOTICE ISSUED</font>", body_style),
            create_qr_box("PHANTOM_VIOLATION|ULPIN:MH27-045-8912345-WIGA-FL14-U1401|MCGM:CE/4502/WS/AH", "UNAUTHORIZED FLOOR")
        ]
    ]
    t_sig = Table(sig_data, colWidths=[120, 130, 130, 135])
    t_sig.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(t_sig)

    doc.build(elements)

    for dest in doc_paths[1:]:
        with open(doc_paths[0], 'rb') as src_f, open(dest, 'wb') as dst_f:
            dst_f.write(src_f.read())

    print(f"[OK] Generated Phantom Floor Deed: {doc_paths[0]}")


def generate_all():
    print("Generating authentic Indian Sale Deeds & Index-II PDFs with ReportLab...")
    generate_sbi_legitimate_deed()
    generate_hdfc_duplicate_deed()
    generate_phantom_floor_deed()
    print("All sample deed PDFs generated successfully.")


if __name__ == "__main__":
    generate_all()
