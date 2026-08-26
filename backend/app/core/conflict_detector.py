"""
Real-Time 3D Spatial Conflict & Anti-Fraud Engine.
Detects:
1. Duplicate Mortgage Collisions (Double Financing across different banks)
2. Phantom Floor Violations (Floors constructed above municipal sanctioned limit)
3. Carpet Area Inflation Frauds (Sum of flat carpet areas exceeding sanctioned floor plate)
4. Subsurface Utility & Underground Metro Easement Encroachments
"""

from typing import List, Dict, Any, Optional, Tuple
from app.models.ladm_models import (
    LA_SpatialUnit,
    BuildingSanctionPlan,
    RiskLevel,
    CadastralStatus,
    LA_RRRType,
    Mesh3DData,
)
from app.models.schemas import ClashDetail
from app.core.spatial_engine import compute_volumetric_overlap, extrude_footprint_to_mesh


def check_duplicate_mortgage(
    candidate_unit: LA_SpatialUnit,
    existing_units: List[LA_SpatialUnit],
    overlap_threshold_percent: float = 0.01,
) -> List[ClashDetail]:
    """
    Computes volumetric overlap between candidate unit and existing mortgaged / encumbered units.
    If overlap > threshold, triggers DUPLICATE_MORTGAGE clash.
    """
    clashes: List[ClashDetail] = []

    for existing in existing_units:
        # Ignore comparing with itself if same ID
        if existing.spatial_unit_id == candidate_unit.spatial_unit_id:
            continue

        # Check if existing unit is mortgaged or has active RRR
        is_mortgaged = False
        mortgage_rrr = None
        if existing.baunit and existing.baunit.rrr_records:
            for rrr in existing.baunit.rrr_records:
                if rrr.is_active and rrr.rrr_type == LA_RRRType.RESTRICTION_MORTGAGE:
                    is_mortgaged = True
                    mortgage_rrr = rrr
                    break
        
        # If not mortgaged or not marked in cadastre, skip unless it's an existing registered unit
        # Note: Any physical volumetric overlap with a registered unit is a title clash,
        # but if existing is mortgaged, it's a critical financial fraud (double mortgage).
        overlap_vol, overlap_pct, clash_mesh = compute_volumetric_overlap(
            footprint_a=candidate_unit.footprint_2d,
            z_min_a=candidate_unit.elevation_base_m,
            z_max_a=candidate_unit.elevation_top_m,
            footprint_b=existing.footprint_2d,
            z_min_b=existing.elevation_base_m,
            z_max_b=existing.elevation_top_m,
        )

        if overlap_pct >= overlap_threshold_percent or overlap_vol > 0.05:
            borrower_name = existing.baunit.parties[0].name if (existing.baunit and existing.baunit.parties) else "Unknown"
            bank_name = mortgage_rrr.bank_name if mortgage_rrr else (existing.baunit.rrr_records[0].bank_name if (existing.baunit and existing.baunit.rrr_records) else "Existing Registered Owner")
            cersai_id = mortgage_rrr.cersai_security_interest_id if mortgage_rrr else "N/A"
            loan_amount = mortgage_rrr.loan_amount_inr if mortgage_rrr else None
            sanction_dt = mortgage_rrr.sanction_date if mortgage_rrr else None

            severity = "HIGH" if is_mortgaged else "MEDIUM"
            clash_type = "DUPLICATE_MORTGAGE" if is_mortgaged else "SPATIAL_TITLE_OVERLAP"

            msg = (
                f"Volumetric collision of {overlap_pct:.1f}% ({overlap_vol:.2f} m³) detected with Unit '{existing.unit_number}' "
                f"({existing.ulpin_3d}). "
            )
            if is_mortgaged:
                msg += f"Already mortgaged to {bank_name} (CERSAI ID: {cersai_id}, Borrower: {borrower_name})."
            else:
                msg += f"Registered to {borrower_name}."

            clashes.append(
                ClashDetail(
                    clash_type=clash_type,
                    severity=severity,
                    conflicting_ulpin_3d=existing.ulpin_3d,
                    conflicting_unit_number=existing.unit_number,
                    conflicting_bank=bank_name,
                    conflicting_cersai_id=cersai_id,
                    conflicting_borrower=borrower_name,
                    sanction_date=sanction_dt,
                    loan_amount_inr=loan_amount,
                    overlap_volume_cum=overlap_vol,
                    overlap_percentage=overlap_pct,
                    clash_mesh=clash_mesh,
                    message=msg,
                )
            )

    return clashes


def check_phantom_floor(
    unit: LA_SpatialUnit,
    sanction_plan: Optional[BuildingSanctionPlan],
) -> Optional[ClashDetail]:
    """
    Validates if unit elevation or floor number exceeds municipal sanctioned height limit.
    """
    if not sanction_plan:
        return None

    max_allowed_height = sanction_plan.sanctioned_height_m + sanction_plan.plinth_elevation_m
    max_allowed_floors = sanction_plan.sanctioned_floors

    violations = []
    excess_height = 0.0

    # Check top elevation violation
    if unit.elevation_top_m > (max_allowed_height + 0.05):
        excess_height = round(unit.elevation_top_m - max_allowed_height, 2)
        violations.append(
            f"Unit top elevation ({unit.elevation_top_m:.2f}m) exceeds municipal sanctioned maximum height ({max_allowed_height:.2f}m) by {excess_height:.2f}m."
        )

    # Check floor count violation
    if unit.floor_number > max_allowed_floors:
        violations.append(
            f"Unit is on Floor {unit.floor_number}, but municipal authority ({sanction_plan.municipal_authority}) approved only {max_allowed_floors} floors (Sanction No: {sanction_plan.approval_number})."
        )
    elif unit.floor_number < 0 and abs(unit.floor_number) > sanction_plan.sanctioned_basements:
        violations.append(
            f"Basement level B{abs(unit.floor_number)} is unapproved. Municipal sanction permits only {sanction_plan.sanctioned_basements} basement level(s)."
        )

    if violations:
        # Create 3D clash mesh for the phantom unit
        _, clash_mesh, _ = extrude_footprint_to_mesh(
            footprint_coords=unit.footprint_2d,
            z_min=unit.elevation_base_m,
            z_max=unit.elevation_top_m,
            color="#DC2626",  # Red
            opacity=0.9,
        )

        return ClashDetail(
            clash_type="PHANTOM_FLOOR",
            severity="HIGH",
            conflicting_ulpin_3d=unit.ulpin_3d,
            conflicting_unit_number=unit.unit_number,
            excess_height_m=excess_height,
            sanctioned_limit=f"Max {max_allowed_floors} Floors / {max_allowed_height}m Height ({sanction_plan.approval_number})",
            actual_value=f"Floor {unit.floor_number} / {unit.elevation_top_m}m Top Elevation",
            clash_mesh=clash_mesh,
            message=" ".join(violations),
        )

    return None


def check_carpet_inflation(
    units_on_floor: List[LA_SpatialUnit],
    sanction_plan: Optional[BuildingSanctionPlan],
    tolerance_percent: float = 2.0,
) -> Optional[ClashDetail]:
    """
    Validates if total carpet area of all units on a floor exceeds municipal sanctioned floor plate area.
    """
    if not sanction_plan:
        return None

    sanctioned_floor_area = sanction_plan.sanctioned_carpet_area_per_floor_sqm
    total_actual_carpet = sum(u.carpet_area_sqm for u in units_on_floor)
    
    max_permissible = sanctioned_floor_area * (1.0 + (tolerance_percent / 100.0))

    if total_actual_carpet > max_permissible:
        excess_sqm = round(total_actual_carpet - sanctioned_floor_area, 2)
        inflation_pct = round(((total_actual_carpet - sanctioned_floor_area) / sanctioned_floor_area) * 100.0, 1)

        return ClashDetail(
            clash_type="CARPET_INFLATION",
            severity="HIGH" if inflation_pct > 10.0 else "MEDIUM",
            sanctioned_limit=f"{sanctioned_floor_area:.2f} sq.m",
            actual_value=f"{total_actual_carpet:.2f} sq.m ({inflation_pct}% excess)",
            message=(
                f"Floor carpet area inflation detected: Sum of units on Floor is {total_actual_carpet:.2f} sq.m, "
                f"exceeding sanctioned floor plate of {sanctioned_floor_area:.2f} sq.m by {excess_sqm:.2f} sq.m ({inflation_pct}% inflation)."
            ),
        )

    return None


def check_subsurface_utility_clash(
    unit: LA_SpatialUnit,
    utility_layers: List[Dict[str, Any]],
) -> List[ClashDetail]:
    """
    Checks if a basement or underground unit collides with underground Metro tunnels,
    stormwater drainage conduits, or high-voltage utility easements.
    """
    clashes: List[ClashDetail] = []

    # Only subterranean / basement units can clash with subsurface utilities
    if unit.elevation_base_m >= 0:
        return clashes

    for util in utility_layers:
        util_name = util.get("name", "Underground Infrastructure")
        util_type = util.get("type", "METRO_TUNNEL")
        util_footprint = util.get("footprint", [])
        util_z_min = util.get("z_min", -15.0)
        util_z_max = util.get("z_max", -5.0)
        buffer_zone_m = util.get("buffer_zone_m", 2.0)

        overlap_vol, overlap_pct, clash_mesh = compute_volumetric_overlap(
            footprint_a=unit.footprint_2d,
            z_min_a=unit.elevation_base_m,
            z_max_a=unit.elevation_top_m,
            footprint_b=util_footprint,
            z_min_b=util_z_min - buffer_zone_m,
            z_max_b=util_z_max + buffer_zone_m,
        )

        if overlap_vol > 0.01:
            clashes.append(
                ClashDetail(
                    clash_type="SUBSURFACE_UTILITY",
                    severity="HIGH",
                    conflicting_ulpin_3d=util.get("id", "UTIL-METRO-01"),
                    conflicting_unit_number=util_name,
                    conflicting_bank=util.get("authority", "DMRC / Municipal Corp"),
                    overlap_volume_cum=overlap_vol,
                    overlap_percentage=overlap_pct,
                    clash_mesh=clash_mesh,
                    message=(
                        f"Underground basement structure directly collides with {util_name} ({util_type}). "
                        f"Intersecting volume: {overlap_vol:.2f} m³ in prohibited buffer zone."
                    ),
                )
            )

    return clashes


def run_comprehensive_audit(
    candidate_unit: LA_SpatialUnit,
    existing_building_units: List[LA_SpatialUnit],
    sanction_plan: Optional[BuildingSanctionPlan],
    utility_layers: Optional[List[Dict[str, Any]]] = None,
) -> Tuple[RiskLevel, int, str, List[ClashDetail]]:
    """
    Executes full 3D Cadastral Audit across all 4 anti-fraud engines:
    Returns (RiskLevel, risk_score [0-100], decision, clash_details).
    """
    all_clashes: List[ClashDetail] = []

    # 1. Duplicate Mortgage / Spatial Collision Check
    mortgage_clashes = check_duplicate_mortgage(candidate_unit, existing_building_units)
    all_clashes.extend(mortgage_clashes)

    # 2. Phantom Floor Check
    phantom_clash = check_phantom_floor(candidate_unit, sanction_plan)
    if phantom_clash:
        all_clashes.append(phantom_clash)

    # 3. Carpet Area Inflation Check
    floor_units = [u for u in existing_building_units if u.floor_number == candidate_unit.floor_number]
    if candidate_unit not in floor_units:
        floor_units.append(candidate_unit)
    carpet_clash = check_carpet_inflation(floor_units, sanction_plan)
    if carpet_clash:
        all_clashes.append(carpet_clash)

    # 4. Subsurface Utility Clash Check
    if utility_layers:
        utility_clashes = check_subsurface_utility_clash(candidate_unit, utility_layers)
        all_clashes.extend(utility_clashes)

    # Calculate Risk Score & Decision
    if not all_clashes:
        return RiskLevel.GREEN_CLEAR, 0, "APPROVED", []

    # High severity check
    has_high_severity = any(c.severity == "HIGH" for c in all_clashes)
    
    if has_high_severity:
        risk_score = 95
        risk_level = RiskLevel.RED_FRAUD_DETECTED
        decision = "REJECTED_COLLISION_DETECTED"
    else:
        risk_score = 55
        risk_level = RiskLevel.AMBER_REVIEW
        decision = "FLAGGED_FOR_MANUAL_REVIEW"

    return risk_level, risk_score, decision, all_clashes
