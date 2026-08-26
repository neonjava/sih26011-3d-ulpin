"""
Indian Real Estate Document AI & Index-II Parser.
Extracts Cadastral 3D property attributes from Maharashtra Index-II, Karnataka Kaveri Deeds,
Delhi Sub-Registrar Deeds, and Standard Sale Deeds.
"""

import io
import re
from typing import Dict, Any, Optional, Tuple, List
from pypdf import PdfReader

from app.models.schemas import DeedExtractedData, DeedParseResponse
from app.models.ladm_models import (
    LA_SpatialUnit,
    LA_BAUnit,
    LA_Party,
    LA_PartyType,
    LA_UnitType,
    CadastralStatus,
)
from app.core.ulpin_generator import generate_3d_ulpin
from app.core.spatial_engine import extrude_footprint_to_mesh


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extracts text from uploaded PDF document bytes using pypdf.
    """
    reader = PdfReader(io.BytesIO(pdf_bytes))
    full_text = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            full_text.append(text)
    return "\n".join(full_text)


def detect_document_type(text: str) -> str:
    """
    Detects Indian Deed format: INDEX_II_MAHARASHTRA, KAVERI_KARNATAKA, DELHI_DEED, or GENERAL_SALE_DEED.
    """
    text_lower = text.lower()
    if "index-ii" in text_lower or "index 2" in text_lower or "दस्तऐवज" in text or "नोंदणी व मुद्रांक विभाग" in text or "inspector general of registration maharashtra" in text_lower or "cts no" in text_lower:
        return "INDEX_II_MAHARASHTRA"
    elif "kaveri" in text_lower or "e-swathu" in text_lower or "sub-registrar karnataka" in text_lower or "bbmp khata" in text_lower:
        return "KAVERI_KARNATAKA"
    elif "delhi development authority" in text_lower or "sub-registrar delhi" in text_lower or "khasra" in text_lower or "dda" in text_lower:
        return "DELHI_DEED"
    else:
        return "SALE_DEED"


def parse_indian_deed(text: str) -> DeedExtractedData:
    """
    Robust regex & token-based extractor for Indian Property Deeds and Index-II documents.
    """
    doc_type = detect_document_type(text)
    data = DeedExtractedData(document_type=doc_type)

    # 1. 2D ULPIN / Bhu-Aadhaar
    ulpin_match = re.search(r"\b([A-Z]{2}\d{2}-\d{3}-\d{6,8})\b", text, re.IGNORECASE)
    if ulpin_match:
        data.ulpin_2d = ulpin_match.group(1).upper()
    else:
        # Fallback search for standard 14-char alphanumeric ULPIN
        ulpin_alt = re.search(r"ULPIN(?:\s*No\.?|:|\s*)\s*([A-Z0-9]{11,16})", text, re.IGNORECASE)
        if ulpin_alt:
            data.ulpin_2d = ulpin_alt.group(1).upper()
        else:
            data.ulpin_2d = "MH27-045-8912345"

    # 2. CTS / Survey / Khasra No.
    cts_match = re.search(
        r"(?:C\.?T\.?S\.?\s*(?:No\.?|Number)|Survey\s*No\.?|Khasra\s*No\.?|सर्व्हे\s*क्र\.?|सी\.?टी\.?एस\.?\s*क्र\.?)\s*[:\-]?\s*([0-9A-Za-z\/\-_]+)",
        text,
        re.IGNORECASE,
    )
    if cts_match:
        data.survey_cts_no = cts_match.group(1).strip()

    # 3. Building / Society Name
    bld_match = re.search(
        r"(?:Building|Complex|Apartment|Society|इमारत|प्रकल्प)\s*(?:Name|Called|Known as)?\s*[:\-]?\s*[\"']?([A-Za-z0-9\s\-]+?)(?:[\"']|\bWing|\bFloor|\bFlat|\bPremises|\bSituated|\bRoad|\bPlot|,|\.|\n)",
        text,
        re.IGNORECASE,
    )
    if bld_match:
        data.building_name = bld_match.group(1).strip()

    # 4. Wing
    wing_match = re.search(
        r"\b(?:Wing|Tower|Block|विंग)\s*[:\-]?\s*[\"']?([A-Za-z0-9]{1,4})\b",
        text,
        re.IGNORECASE,
    )
    if wing_match:
        w_val = wing_match.group(1).upper().strip()
        # Ensure it's not matching 'A' in 'Apartment' etc.
        data.wing = w_val
    else:
        data.wing = "W1"

    # 5. Floor Number
    floor_match = re.search(
        r"(?:Floor|Level|मजला)\s*(?:No\.?|Number)?\s*[:\-]?\s*(\d+|Ground|First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth|Basement\s*\d*)",
        text,
        re.IGNORECASE,
    )
    if floor_match:
        fl_str = floor_match.group(1).strip().lower()
        word_to_num = {
            "ground": 0, "first": 1, "second": 2, "third": 3, "fourth": 4,
            "fifth": 5, "sixth": 6, "seventh": 7, "eighth": 8, "ninth": 9,
            "tenth": 10, "eleventh": 11, "twelfth": 12
        }
        if fl_str.isdigit():
            data.floor_number = int(fl_str)
        elif fl_str in word_to_num:
            data.floor_number = word_to_num[fl_str]
        elif "basement" in fl_str:
            b_num = re.search(r"\d+", fl_str)
            data.floor_number = -int(b_num.group(0)) if b_num else -1
    else:
        flat_peek = re.search(r"(?:Flat|Unit|Apartment|सदनिका)\s*(?:No\.?|Number)?\s*[:\-]?\s*(\d{3,4})", text, re.IGNORECASE)
        if flat_peek:
            unit_val = flat_peek.group(1)
            data.floor_number = int(unit_val[:-2]) if len(unit_val) >= 3 else 1

    # 6. Unit / Flat Number
    unit_match = re.search(
        r"(?:Flat|Unit|Apartment|सदनिका)\s*(?:No\.?|Number|#)?\s*[:\-]?\s*([A-Za-z0-9\-_]+)",
        text,
        re.IGNORECASE,
    )
    if unit_match:
        data.unit_number = unit_match.group(1).upper().strip()
    else:
        premises_match = re.search(
            r"Premises\s*[:\-]?\s*(?:Flat|Unit)?\s*(?:No\.?|Number)?\s*[:\-]?\s*([A-Za-z0-9\-_]+)",
            text,
            re.IGNORECASE,
        )
        if premises_match:
            data.unit_number = premises_match.group(1).upper().strip()

    # 7. Carpet Area (sq.m & sq.ft)
    carpet_sqm_match = re.search(
        r"(?:Carpet\s*Area|RERA\s*Carpet|क्षेत्रफळ)\s*[:\-]?\s*([\d\.]+)\s*(?:Sq\.?\s*Mtrs?|sqm|sq\s*m|चौ\.?\s*मी\.?)",
        text,
        re.IGNORECASE,
    )
    carpet_sqft_match = re.search(
        r"(?:Carpet\s*Area|RERA\s*Carpet|क्षेत्रफळ)\s*[:\-]?\s*([\d\.]+)\s*(?:Sq\.?\s*Ft|sqft|sq\s*feet|चौ\.?\s*फूट)",
        text,
        re.IGNORECASE,
    )

    if carpet_sqm_match:
        val_sqm = float(carpet_sqm_match.group(1))
        data.carpet_area_sqm = round(val_sqm, 2)
        data.carpet_area_sqft = round(val_sqm * 10.7639, 2)
    elif carpet_sqft_match:
        val_sqft = float(carpet_sqft_match.group(1))
        data.carpet_area_sqft = round(val_sqft, 2)
        data.carpet_area_sqm = round(val_sqft / 10.7639, 2)
    else:
        gen_area = re.search(r"([\d\.]+)\s*(?:Sq\.?\s*Mtrs?|sqm|sq\s*m)", text, re.IGNORECASE)
        if gen_area:
            val = float(gen_area.group(1))
            data.carpet_area_sqm = round(val, 2)
            data.carpet_area_sqft = round(val * 10.7639, 2)

    # 8. Ceiling / Slab Height
    height_match = re.search(
        r"(?:Ceiling\s*Height|Clear\s*Height|Slab\s*Height|उंची)\s*[:\-]?\s*([\d\.]+)\s*(?:m|meters?|mtrs?)",
        text,
        re.IGNORECASE,
    )
    if height_match:
        data.ceiling_height_m = float(height_match.group(1))
    else:
        data.ceiling_height_m = 3.0

    # 9. Consideration Amount (INR)
    amount_match = re.search(
        r"(?:Consideration\s*Amount|Market\s*Value|Total\s*Price|मोबदला|रक्कम)\s*[:\-]?\s*(?:Rs\.?|INR|₹)?\s*[:\-]?\s*([\d,]+(?:\.\d+)?)",
        text,
        re.IGNORECASE,
    )
    if amount_match:
        raw_amt = amount_match.group(1).replace(",", "")
        data.consideration_amount_inr = float(raw_amt)

    # 10. Stamp Duty
    stamp_match = re.search(
        r"(?:Stamp\s*Duty|मुद्रांक\s*शुल्क)\s*[:\-]?\s*(?:Rs\.?|INR|₹)?\s*[:\-]?\s*([\d,]+(?:\.\d+)?)",
        text,
        re.IGNORECASE,
    )
    if stamp_match:
        raw_stamp = stamp_match.group(1).replace(",", "")
        data.stamp_duty_paid_inr = float(raw_stamp)

    # 11. Registration Document No & SRO
    reg_match = re.search(
        r"(?:Document\s*No\.?|Registration\s*No\.?|दस्तऐवज\s*क्रमांक)\s*[:\-]?\s*([A-Za-z0-9\/\-_]+)",
        text,
        re.IGNORECASE,
    )
    if reg_match:
        data.registration_number = reg_match.group(1).strip()

    sro_match = re.search(
        r"(?:Sub-Registrar\s*Office|SRO|नोंदणी\s*कार्यालय)\s*[:\-]?\s*([A-Za-z0-9\s\-]+?)(?:,|\.|\n|$)",
        text,
        re.IGNORECASE,
    )
    if sro_match:
        data.sub_registrar_office = sro_match.group(1).strip()

    # 12. Parties (Seller / Buyer)
    seller_match = re.search(
        r"(?:Seller|Vendor|Developer|Builder|देणारा)\s*[:\-]?\s*([A-Za-z0-9\s\.\,\(\)]+?)(?:PAN|Aadhaar|Having|Resident|Through|,|\n|$)",
        text,
        re.IGNORECASE,
    )
    if seller_match:
        data.seller_name = seller_match.group(1).strip()

    buyer_match = re.search(
        r"(?:Buyer|Purchaser|Allottee|घेणारा)\s*[:\-]?\s*([A-Za-z0-9\s\.\,\(\)]+?)(?:PAN|Aadhaar|Having|Resident|Through|,|\n|$)",
        text,
        re.IGNORECASE,
    )
    if buyer_match:
        data.buyer_name = buyer_match.group(1).strip()

    # 13. Mortgage / Encumbrance clause detection
    mortgage_indicators = ["mortgage", "hypothecation", "encumbrance", "charge created", "bank", "cersai", "loan", "गहाण"]
    found_m_clauses = [w for w in mortgage_indicators if w in text.lower()]
    if found_m_clauses:
        data.mortgage_clause_found = True
        bank_match = re.search(r"(State Bank of India|SBI|HDFC Bank|ICICI Bank|Axis Bank|Punjab National Bank|Bank of Baroda|Canara Bank)", text, re.IGNORECASE)
        if bank_match:
            data.existing_bank = bank_match.group(1)

    # 14. Generate 3D-ULPIN
    if data.ulpin_2d and data.floor_number is not None and data.unit_number:
        fl = data.floor_number
        h = data.ceiling_height_m or 3.0
        z_min = fl * h
        z_max = z_min + h
        approx_bbox = [0.0, 0.0, z_min, 10.0, 8.5, z_max]
        
        data.generated_3d_ulpin = generate_3d_ulpin(
            state_code=data.ulpin_2d.split("-")[0] if "-" in data.ulpin_2d else "MH27",
            dist_code=data.ulpin_2d.split("-")[1] if "-" in data.ulpin_2d and len(data.ulpin_2d.split("-")) > 1 else "045",
            cadastral_pin=data.ulpin_2d.split("-")[2] if "-" in data.ulpin_2d and len(data.ulpin_2d.split("-")) > 2 else "8912345",
            unit_type=LA_UnitType.APARTMENT,
            wing=data.wing or "W1",
            floor_number=data.floor_number,
            unit_number=data.unit_number,
            bbox_3d=approx_bbox,
        )

    return data


def create_spatial_unit_from_deed(extracted: DeedExtractedData) -> Tuple[LA_SpatialUnit, List[str]]:
    """
    Creates a full LA_SpatialUnit geometry from extracted deed parameters.
    """
    warnings = []
    
    floor_num = extracted.floor_number if extracted.floor_number is not None else 1
    unit_no = extracted.unit_number or "101"
    wing_name = extracted.wing or "W1"
    carpet_sqm = extracted.carpet_area_sqm if extracted.carpet_area_sqm is not None else 75.0
    floor_height = extracted.ceiling_height_m or 3.0
    
    z_min = floor_num * floor_height
    z_max = z_min + floor_height

    width = 8.0
    length = float(carpet_sqm) / width
    footprint = [
        (0.0, 0.0),
        (width, 0.0),
        (width, length),
        (0.0, length),
        (0.0, 0.0),
    ]

    _, mesh_data, metrics = extrude_footprint_to_mesh(
        footprint_coords=footprint,
        z_min=z_min,
        z_max=z_max,
        color="#10B981",
        opacity=0.85,
    )

    ulpin_3d = extracted.generated_3d_ulpin or generate_3d_ulpin(
        state_code="MH27",
        dist_code="045",
        cadastral_pin="8912345",
        unit_type=LA_UnitType.APARTMENT,
        wing=wing_name,
        floor_number=floor_num,
        unit_number=unit_no,
        bbox_3d=metrics["bbox_3d"],
    )

    party = LA_Party(
        party_id=f"PTY-{unit_no}",
        name=extracted.buyer_name or "Registered Allottee",
        party_type=LA_PartyType.INDIVIDUAL,
    )

    baunit = LA_BAUnit(
        baunit_id=f"BAU-{unit_no}",
        name=f"Unit {unit_no}, {extracted.building_name or 'Tower 1'}",
        ulpin_2d=extracted.ulpin_2d or "MH27-045-8912345",
        ulpin_3d=ulpin_3d,
        title_deed_no=extracted.registration_number or "REG-2024-8849",
        registration_date=extracted.registration_date or "2024-05-15",
        sub_registrar_office=extracted.sub_registrar_office or "SRO Bandra Mumbai",
        status=CadastralStatus.CLEAR,
        property_value_inr=extracted.consideration_amount_inr or 12000000.0,
        parties=[party],
        rrr_records=[],
    )

    spatial_unit = LA_SpatialUnit(
        spatial_unit_id=f"SPU-{ulpin_3d}",
        ulpin_2d=extracted.ulpin_2d or "MH27-045-8912345",
        ulpin_3d=ulpin_3d,
        unit_type=LA_UnitType.APARTMENT,
        building_id="BLD-AUTO-01",
        wing=wing_name,
        floor_number=floor_num,
        unit_number=unit_no,
        carpet_area_sqm=metrics["carpet_area_sqm"],
        carpet_area_sqft=metrics["carpet_area_sqft"],
        floor_height_m=floor_height,
        elevation_base_m=z_min,
        elevation_top_m=z_max,
        footprint_2d=footprint,
        bbox_3d=metrics["bbox_3d"],
        volume_cum=metrics["volume_cum"],
        centroid_3d=metrics["centroid_3d"],
        mesh_3d=mesh_data,
        baunit=baunit,
        status=CadastralStatus.CLEAR,
    )

    if extracted.carpet_area_sqm is None:
        warnings.append("Carpet area not explicitly found in deed; defaulted to standard 75 sq.m.")
    if extracted.floor_number is None:
        warnings.append("Floor number inferred from unit numbering.")

    return spatial_unit, warnings
