"""
Indian Real Estate Deed & Index-II Parsing API.
Supports PDF uploads and raw text OCR processing.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.models.schemas import DeedParseRequest, DeedParseResponse, DeedExtractedData
from app.core.document_ai import (
    extract_text_from_pdf,
    parse_indian_deed,
    create_spatial_unit_from_deed,
)

router = APIRouter(tags=["Document AI & Deed Parsing"])


SAMPLE_DEEDS = {
    "index_ii_mumbai": """
GOVERNMENT OF MAHARASHTRA
DEPARTMENT OF REGISTRATION AND STAMPS
INDEX - II (दस्तऐवज क्रमांक: BND/4582/2024)
Sub-Registrar Office: SRO Bandra West (Mumbai Suburban)

1. 2D Bhu-Aadhaar ULPIN: MH27-045-8912345
2. CTS No: CTS-1042, Village: Bandra West, Taluka: Andheri
3. Property Description: Flat No. 402, 4th Floor, Wing A, Sea Breeze Towers
4. Carpet Area: 85.50 Sq. Mtrs (920.30 Sq. Ft), Slab Height: 3.0 meters
5. Consideration Amount: Rs. 2,25,00,000/- (Two Crore Twenty Five Lakh Only)
6. Stamp Duty Paid: Rs. 13,50,000/- | Registration Fee: Rs. 30,000/-
7. Developer / Vendor: Oberoi Horizon Developers LLP (PAN: AABCO1234K)
8. Purchaser / Allottee: Vikramaditya Roy (Aadhaar: XXXX-XXXX-9912)
9. Encumbrance / Mortgage Clause: Unit mortgaged to State Bank of India under Home Loan Account No 3991283921.
    """,
    "kaveri_bengaluru": """
GOVERNMENT OF KARNATAKA - DEPARTMENT OF STAMPS & REGISTRATION
KAVERI 2.0 REGISTERED SALE DEED (Doc No: BLR-KVR-2024-91823)
Sub-Registrar: Shivajinagar, Bengaluru Urban

Property Details:
Survey No: Sy-84/2, Whitefield Main Road, Bengaluru.
Building: Silicon Heights, Tower 1
Unit: Penthouse Flat 1204, Floor 12
Super Built-up Area: 1800 Sq Ft | Carpet Area: 142.50 Sq. Mtrs (1533.85 Sq. Ft)
Ceiling Height: 3.0 m
Consideration Value: Rs. 1,85,00,000/-
Stamp Duty: Rs. 10,36,000/-
Seller: M/s Silicon City Builders Ltd.
Purchaser: Anand Kulkarni
Remarks: Penthouse constructed on 12th Floor level.
    """,
    "delhi_dda_deed": """
DELHI DEVELOPMENT AUTHORITY (DDA)
SUB-REGISTRAR OFFICE - VII (KAPASHERA, NEW DELHI)
CONVEYANCE DEED FOR COMMERCIAL PREMISES (Reg No: DL-DDA-2024-00412)

1. Cadastral Identification: Khasra No. 412/1, Sector 21, Dwarka, South West Delhi
2. ULPIN: DL04-009-3319022
3. Complex: Metro View Commercial Plaza
4. Floor / Unit: Basement Floor B3, Unit B301 (Commercial Logistics / Cold Storage)
5. Carpet Area: 220.00 Sq. Mtrs (2368.06 Sq. Ft), Clear Height: 3.50 m
6. Market Consideration: Rs. 3,50,000,000/-
7. Allottee: Apex Retail Ventures Pvt Ltd
    """,
}


@router.post("/parse-deed", response_model=DeedParseResponse)
async def parse_deed(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
):
    """
    Parses an Indian property deed or Maharashtra Index-II document.
    Accepts PDF upload or raw text/OCR payload.
    Extracts 2D/3D cadastral metadata and generates 3D Spatial Unit bounding volume.
    """
    text_content = ""

    if file:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are supported for document upload",
            )
        file_bytes = await file.read()
        try:
            text_content = extract_text_from_pdf(file_bytes)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to extract text from PDF: {str(e)}",
            )
    elif raw_text:
        text_content = raw_text
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either a PDF file or 'raw_text' form field must be provided",
        )

    if not text_content.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Extracted document text is empty",
        )

    extracted_data = parse_indian_deed(text_content)
    spatial_unit, warnings = create_spatial_unit_from_deed(extracted_data)

    return DeedParseResponse(
        success=True,
        extracted_data=extracted_data,
        spatial_unit_preview=spatial_unit,
        validation_warnings=warnings,
    )


@router.post("/parse-deed/json", response_model=DeedParseResponse)
def parse_deed_json(req: DeedParseRequest):
    """
    JSON endpoint to parse deed text string directly.
    """
    if not req.raw_text or not req.raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="'raw_text' cannot be empty",
        )

    extracted_data = parse_indian_deed(req.raw_text)
    spatial_unit, warnings = create_spatial_unit_from_deed(extracted_data)

    return DeedParseResponse(
        success=True,
        extracted_data=extracted_data,
        spatial_unit_preview=spatial_unit,
        validation_warnings=warnings,
    )


@router.get("/sample-deeds", response_model=Dict[str, str])
def get_sample_deeds():
    """
    Returns pre-configured sample deed templates for instant testing in UI.
    """
    return SAMPLE_DEEDS
