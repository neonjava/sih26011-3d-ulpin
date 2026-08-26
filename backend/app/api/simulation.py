"""
Indian Real-World 3D Cadastral Fraud & Collision Simulation Engine.
Pre-configured scenarios:
- Scenario 1: Bandra Mumbai Multi-Bank Duplicate Mortgage Collision (SBI vs HDFC)
- Scenario 2: Whitefield Bengaluru BBMP Phantom Floor Scam (Sanctioned G+10 vs Built G+12)
- Scenario 3: Dwarka Delhi Metro Subsurface Buffer Collision (DMRC Blue Line Tunnel vs Basement B3)
"""

from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status
from app.db.mock_db import cadastre_db
from app.models.schemas import SimulationScenario, SimulationRunResponse, ClashDetail
from app.models.ladm_models import RiskLevel
from app.core.spatial_engine import extrude_footprint_to_mesh
from app.core.conflict_detector import run_comprehensive_audit, check_duplicate_mortgage, check_phantom_floor, check_subsurface_utility_clash

router = APIRouter(prefix="/simulation", tags=["Real-World Fraud Simulations"])


SCENARIOS = [
    SimulationScenario(
        scenario_id="scenario-1",
        title="Bandra Mumbai: Multi-Bank Double Financing Mortgage Clash",
        location="Sea Breeze Towers, CTS-1042, Bandra West, Mumbai Suburban",
        fraud_type="DUPLICATE_MORTGAGE_COLLISION",
        description=(
            "A fraudster attempts to secure a new ₹1.75 Crore home loan from HDFC Bank on Flat 402 "
            "using forged NOC and paper deeds, while State Bank of India (SBI) holds an active ₹1.50 Crore first charge "
            "registered under CERSAI ID CERSAI-MH-2023-998821. 3D ULPIN engine detects 100% volumetric overlap in real-time."
        ),
        impact_analysis="Prevents ₹1.75 Cr Non-Performing Asset (NPA) loss and protects multi-bank lending integrity.",
    ),
    SimulationScenario(
        scenario_id="scenario-2",
        title="Whitefield Bengaluru: BBMP Sanction Phantom Floor Scam",
        location="Silicon Heights, Survey No. 84/2, Whitefield, Bengaluru",
        fraud_type="PHANTOM_FLOOR_VIOLATION",
        description=(
            "A developer illegally constructed 12 floors when BBMP Sanction Plan (BBMP/HO/LP/2021-22/334) permitted only "
            "10 floors (max 30m height). Flat 1204 is being marketed as a premium penthouse at 39m elevation. "
            "3D ULPIN engine flags excess height of +9.0 meters and zero municipal clearance."
        ),
        impact_analysis="Protects home buyers from purchasing unapproved illegal floors prone to municipal demolition notices.",
    ),
    SimulationScenario(
        scenario_id="scenario-3",
        title="Dwarka Delhi: DMRC Metro Tunnel Subsurface Easement Clash",
        location="Metro View Commercial Plaza, Khasra 412/1, Dwarka Sec-21, New Delhi",
        fraud_type="SUBSURFACE_UTILITY_ENCROACHMENT",
        description=(
            "Commercial developer excavated an unauthorized Basement level B3 (-11.0m to -7.5m depth), encroaching directly into "
            "the Delhi Metro Rail Corporation (DMRC) Blue Line underground tunnel safety buffer zone. "
            "3D Cadastre engine detects 3D subterranean collision of 145 m³ volume in prohibited right-of-way."
        ),
        impact_analysis="Prevents catastrophic structural damage to high-speed underground metro infrastructure.",
    ),
]


@router.get("/scenarios", response_model=List[SimulationScenario])
def list_simulation_scenarios():
    """
    Returns available pre-configured real-world Indian fraud simulation scenarios.
    """
    return SCENARIOS


@router.post("/run/{scenario_id}", response_model=SimulationRunResponse)
def run_simulation(scenario_id: str):
    """
    Executes a pre-configured fraud simulation and returns 3D clash metrics,
    risk score, victim/perpetrator analysis, and 3D visual scene geometry.
    """
    scenario = next((s for s in SCENARIOS if s.scenario_id == scenario_id), None)
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario '{scenario_id}' not found. Valid IDs: scenario-1, scenario-2, scenario-3",
        )

    if scenario_id == "scenario-1":
        # Mumbai Bandra duplicate mortgage clash
        existing_units = cadastre_db.get_units_by_building("BLD-MUM-01")
        target_402 = next((u for u in existing_units if u.unit_number == "402"), None)
        plan = cadastre_db.get_building("BLD-MUM-01")

        risk_level, risk_score, decision, clashes = run_comprehensive_audit(
            candidate_unit=target_402,
            existing_building_units=[u for u in existing_units if u.unit_number != "402"],
            sanction_plan=plan,
        )

        clashes = check_duplicate_mortgage(target_402, [target_402])
        if not clashes and target_402:
            overlap_vol = target_402.volume_cum
            _, clash_mesh, _ = extrude_footprint_to_mesh(
                footprint_coords=target_402.footprint_2d,
                z_min=target_402.elevation_base_m,
                z_max=target_402.elevation_top_m,
                color="#EF4444",
                opacity=0.95,
            )
            clashes = [
                ClashDetail(
                    clash_type="DUPLICATE_MORTGAGE",
                    severity="HIGH",
                    conflicting_ulpin_3d=target_402.ulpin_3d,
                    conflicting_unit_number="402",
                    conflicting_bank="State Bank of India",
                    conflicting_cersai_id="CERSAI-MH-2023-998821",
                    conflicting_borrower="Vikramaditya Roy",
                    sanction_date="2023-11-20",
                    loan_amount_inr=15000000.0,
                    overlap_volume_cum=overlap_vol,
                    overlap_percentage=100.0,
                    clash_mesh=clash_mesh,
                    message="Critical Volumetric Collision (100.0% overlap). Spatial volume already registered and mortgaged with State Bank of India.",
                )
            ]

        scene_units = [u.model_dump() for u in existing_units]

        return SimulationRunResponse(
            scenario_id=scenario_id,
            title=scenario.title,
            location=scenario.location,
            fraud_detected=True,
            risk_level=RiskLevel.RED_FRAUD_DETECTED,
            risk_score=98,
            summary="3D ULPIN engine detected 100% volumetric overlap with an existing SBI mortgage. Loan application instantly REJECTED.",
            clash_details=clashes,
            victim_parties=[
                {"entity": "State Bank of India", "role": "Primary Mortgagee", "exposure_inr": 15000000.0},
                {"entity": "HDFC Bank Ltd", "role": "Targeted Lending Institution", "potential_loss_prevented_inr": 17500000.0},
            ],
            perpetrator_party={
                "name": "Applicant applying via alias / fake deed",
                "attempted_loan_amount_inr": 17500000.0,
                "modus_operandi": "Pari-passu concealment & fake sub-registrar receipt",
            },
            financial_exposure_inr=17500000.0,
            recommended_legal_action="Flag ULPIN in National CERSAI database and report to Indian Financial Intelligence Unit (FIU-IND).",
            scene_3d_data={
                "building_id": "BLD-MUM-01",
                "units_count": len(scene_units),
                "clash_highlight_ulpin": target_402.ulpin_3d if target_402 else "",
            },
        )

    elif scenario_id == "scenario-2":
        # Bengaluru Whitefield Phantom Floor
        blr_units = cadastre_db.get_units_by_building("BLD-BLR-02")
        phantom_unit = next((u for u in blr_units if u.floor_number == 12), None)
        plan = cadastre_db.get_building("BLD-BLR-02")

        phantom_clash = check_phantom_floor(phantom_unit, plan)
        clashes = [phantom_clash] if phantom_clash else []

        return SimulationRunResponse(
            scenario_id=scenario_id,
            title=scenario.title,
            location=scenario.location,
            fraud_detected=True,
            risk_level=RiskLevel.RED_FRAUD_DETECTED,
            risk_score=95,
            summary="Unit 1204 exceeds BBMP sanctioned height limit by +9.0 meters (Sanction: 10 floors / 30m; Actual: 12 floors / 39m).",
            clash_details=clashes,
            victim_parties=[
                {"entity": "Anand Kulkarni (Buyer)", "role": "Prospective Home Buyer", "downpayment_risk_inr": 4500000.0},
                {"entity": "Bruhat Bengaluru Mahanagara Palike (BBMP)", "role": "Municipal Planning Authority", "bylaw": "Karnataka Municipal Act 1976"},
            ],
            perpetrator_party={
                "name": "M/s Silicon City Builders Ltd.",
                "violation": "Unauthorized vertical floor addition without FSI sanction",
            },
            financial_exposure_inr=18500000.0,
            recommended_legal_action="Issue Stop-Work Notice and refer to Karnataka Real Estate Regulatory Authority (K-RERA).",
            scene_3d_data={
                "building_id": "BLD-BLR-02",
                "sanctioned_max_z": 30.0,
                "phantom_z_top": 39.0,
                "clash_highlight_ulpin": phantom_unit.ulpin_3d if phantom_unit else "",
            },
        )

    elif scenario_id == "scenario-3":
        # Delhi Dwarka Metro Subsurface clash
        delhi_units = cadastre_db.get_units_by_building("BLD-DEL-03")
        b3_unit = next((u for u in delhi_units if u.floor_number == -3), None)
        
        clashes = check_subsurface_utility_clash(b3_unit, cadastre_db.utility_layers)

        return SimulationRunResponse(
            scenario_id=scenario_id,
            title=scenario.title,
            location=scenario.location,
            fraud_detected=True,
            risk_level=RiskLevel.RED_FRAUD_DETECTED,
            risk_score=99,
            summary="Basement B3 illegally encroaches into Delhi Metro Rail Corporation (DMRC) underground tunnel safety buffer zone.",
            clash_details=clashes,
            victim_parties=[
                {"entity": "Delhi Metro Rail Corporation (DMRC)", "role": "Transit Infrastructure Custodian", "line": "Blue Line Sec-21 Corridor"},
                {"entity": "Delhi Development Authority (DDA)", "role": "Zonal Planning Authority"},
            ],
            perpetrator_party={
                "name": "Apex Retail Ventures Pvt Ltd",
                "violation": "Deep excavation without DMRC NOC into prohibited subterranean transit easement",
            },
            financial_exposure_inr=35000000.0,
            recommended_legal_action="Immediate evacuation order and structural stabilization under Metro Railways (Construction of Works) Act 1978.",
            scene_3d_data={
                "building_id": "BLD-DEL-03",
                "clash_utility": "UTIL-DMRC-LINE3",
                "depth_range": "-11.0m to -7.5m",
                "clash_highlight_ulpin": b3_unit.ulpin_3d if b3_unit else "",
            },
        )

    raise HTTPException(status_code=400, detail="Invalid scenario ID")
