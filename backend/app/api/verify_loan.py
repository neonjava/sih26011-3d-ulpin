"""
Loan Underwriting & 3D Anti-Fraud Verification API.
Instant volumetric title & mortgage clash detection for banks (SBI, HDFC, ICICI, etc.).
"""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from app.db.mock_db import cadastre_db
from app.models.schemas import LoanVerificationRequest, LoanVerificationResponse
from app.models.ladm_models import LA_SpatialUnit, LA_UnitType, CadastralStatus
from app.core.ulpin_generator import generate_3d_ulpin
from app.core.spatial_engine import extrude_footprint_to_mesh, subdivide_floor_plate
from app.core.conflict_detector import run_comprehensive_audit

router = APIRouter(tags=["Bank Loan Verification & Anti-Fraud"])


@router.post("/verify-loan", response_model=LoanVerificationResponse)
def verify_loan_application(req: LoanVerificationRequest):
    """
    Real-Time 3D Spatial Collision and Multi-Bank Mortgage Verification Endpoint.
    
    Verifies:
    1. If the flat / unit volume is already mortgaged to another bank (Double Financing).
    2. If the floor is an illegal phantom floor violating municipal sanctions.
    3. If carpet area claimed is inflated beyond sanctioned floor plate.
    4. If basement unit collides with metro tunnels / utility easements.
    """
    building = cadastre_db.get_building(req.building_id)
    if not building:
        # Try matching by first available building
        all_buildings = cadastre_db.get_all_buildings()
        building = all_buildings[0] if all_buildings else None

    existing_units = cadastre_db.get_units_by_building(req.building_id) if req.building_id else cadastre_db.get_all_units()

    # Determine 2D footprint for candidate unit
    if req.custom_footprint and len(req.custom_footprint) >= 3:
        footprint = req.custom_footprint
    else:
        # Match unit footprint from existing layout or construct standard quadrant
        matched_existing = next((u for u in existing_units if u.unit_number == req.unit_number and u.floor_number == req.floor_number), None)
        if matched_existing:
            footprint = matched_existing.footprint_2d
        else:
            base_floor_poly = [(0.0, 0.0), (20.0, 0.0), (20.0, 18.0), (0.0, 18.0), (0.0, 0.0)]
            subs = subdivide_floor_plate(base_floor_poly, num_units=4)
            # Default to second quadrant for 02 suffix or first for others
            footprint = subs[1]["footprint"] if req.unit_number.endswith("02") or req.unit_number.endswith("2") else subs[0]["footprint"]

    floor_height = building.floor_height_m if building else 3.0
    z_min = (req.floor_number - 1) * floor_height if req.floor_number > 0 else req.floor_number * floor_height
    z_max = z_min + floor_height

    # Extrude candidate unit to 3D
    _, unit_mesh, metrics = extrude_footprint_to_mesh(
        footprint_coords=footprint,
        z_min=z_min,
        z_max=z_max,
        color="#3B82F6",
        opacity=0.85,
    )

    # Generate Candidate 3D-ULPIN
    state_code = req.ulpin_2d.split("-")[0] if "-" in req.ulpin_2d else "MH27"
    dist_code = req.ulpin_2d.split("-")[1] if "-" in req.ulpin_2d and len(req.ulpin_2d.split("-")) > 1 else "045"
    cadastral_pin = req.ulpin_2d.split("-")[2] if "-" in req.ulpin_2d and len(req.ulpin_2d.split("-")) > 2 else "8912345"

    ulpin_3d = generate_3d_ulpin(
        state_code=state_code,
        dist_code=dist_code,
        cadastral_pin=cadastral_pin,
        unit_type=LA_UnitType.APARTMENT if req.floor_number >= 0 else LA_UnitType.BASEMENT,
        wing=req.wing,
        floor_number=req.floor_number,
        unit_number=req.unit_number,
        bbox_3d=metrics["bbox_3d"],
    )

    candidate_sp_unit = LA_SpatialUnit(
        spatial_unit_id=f"SPU-VERIFY-{ulpin_3d}",
        ulpin_2d=req.ulpin_2d,
        ulpin_3d=ulpin_3d,
        unit_type=LA_UnitType.APARTMENT if req.floor_number >= 0 else LA_UnitType.BASEMENT,
        building_id=req.building_id,
        wing=req.wing,
        floor_number=req.floor_number,
        unit_number=req.unit_number,
        carpet_area_sqm=req.carpet_area_sqm,
        carpet_area_sqft=round(req.carpet_area_sqm * 10.7639, 2),
        floor_height_m=floor_height,
        elevation_base_m=z_min,
        elevation_top_m=z_max,
        footprint_2d=footprint,
        bbox_3d=metrics["bbox_3d"],
        volume_cum=metrics["volume_cum"],
        centroid_3d=metrics["centroid_3d"],
        mesh_3d=unit_mesh,
        status=CadastralStatus.CLEAR,
    )

    # Run Comprehensive 3D Audit
    risk_level, risk_score, decision, clashes = run_comprehensive_audit(
        candidate_unit=candidate_sp_unit,
        existing_building_units=existing_units,
        sanction_plan=building,
        utility_layers=cadastre_db.utility_layers,
    )

    # Extract clash geometry if available
    clash_geom = next((c.clash_mesh for c in clashes if c.clash_mesh is not None), None)

    return LoanVerificationResponse(
        ulpin_3d=ulpin_3d,
        target_unit_number=req.unit_number,
        risk_level=risk_level,
        risk_score=risk_score,
        decision=decision,
        has_conflict=(len(clashes) > 0),
        clashes=clashes,
        unit_3d_preview=unit_mesh,
        clash_geometry=clash_geom,
        cadastral_metadata={
            "building_name": building.building_name if building else "N/A",
            "municipal_authority": building.municipal_authority if building else "N/A",
            "sanctioned_floors": building.sanctioned_floors if building else "N/A",
            "requesting_bank": req.bank_name,
            "applicant_name": req.applicant_name,
            "loan_amount_inr": req.loan_amount_inr,
        },
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
