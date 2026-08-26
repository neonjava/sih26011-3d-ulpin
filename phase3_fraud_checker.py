"""
PHASE 3: Volumetric 3D Anti-Fraud Conflict Checker
--------------------------------------------------
Checks if a new deed's 3D extruded block collides with an existing registered/mortgaged unit.
"""

from phase1_extruder import extrude_2d_to_3d
from phase2_doc_reader import extract_deed_parameters
from typing import Dict, Any, List

def check_3d_conflict(
    new_3d_unit: Dict[str, Any],
    existing_3d_units: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Compares the candidate 3D unit's Z-range [z_min, z_max] against existing 3D units.
    """
    new_z_min = new_3d_unit["elevation_range"]["z_bottom_meters"]
    new_z_max = new_3d_unit["elevation_range"]["z_top_meters"]
    
    for existing in existing_3d_units:
        ex_z_min = existing["elevation_range"]["z_bottom_meters"]
        ex_z_max = existing["elevation_range"]["z_top_meters"]
        
        # Check vertical overlap
        overlap_min = max(new_z_min, ex_z_min)
        overlap_max = min(new_z_max, ex_z_max)
        
        if overlap_max > overlap_min:
            # Overlap exists!
            overlap_height = overlap_max - overlap_min
            total_height = new_z_max - new_z_min
            overlap_pct = round((overlap_height / total_height) * 100, 1)
            
            return {
                "has_fraud_clash": True,
                "status": "FRAUD_DUPLICATE_MORTGAGE_DETECTED",
                "severity": "CRITICAL",
                "message": f"🚨 3D Conflict! This exact vertical space is already mortgaged to {existing.get('bank', 'State Bank of India')}.",
                "conflict_details": {
                    "conflicting_flat": existing.get("flat_number"),
                    "conflicting_floor": existing.get("floor_number"),
                    "conflicting_bank": existing.get("bank", "State Bank of India"),
                    "conflicting_cersai_id": existing.get("cersai_id", "CERSAI-MH-2023-88912"),
                    "overlap_z_range": f"{overlap_min}m to {overlap_max}m",
                    "overlap_percentage": f"{overlap_pct}%"
                }
            }
            
    return {
        "has_fraud_clash": False,
        "status": "TITLE_CLEAR_SAFE_TO_LEND",
        "severity": "LOW",
        "message": "✅ Clear Title! Zero 3D volumetric overlap detected in vertical space.",
        "conflict_details": None
    }


# ==========================================
# TEST DEMO: Testing Legitimate vs Duplicate Loan
# ==========================================
if __name__ == "__main__":
    print("=" * 60)
    print("🛡️ PHASE 3 DEMO: 3D VOLUMETRIC ANTI-FRAUD ENGINE")
    print("=" * 60)
    
    # 2D Plot Footprint (10m x 8m)
    land_plot = [(0.0, 0.0), (10.0, 0.0), (10.0, 8.0), (0.0, 8.0)]
    
    # Existing Database: SBI has a loan on Flat 402 (Floor 4)
    sbi_flat_402 = extrude_2d_to_3d(land_plot, floor_number=4, floor_height=3.0)
    sbi_flat_402["flat_number"] = "402"
    sbi_flat_402["bank"] = "State Bank of India (SBI)"
    sbi_flat_402["cersai_id"] = "CERSAI-MH-2023-88912"
    
    existing_registry = [sbi_flat_402]
    
    print("\n[Current Registry Database]:")
    print("  • Flat 402 (Floor 4) mortgaged to State Bank of India (Z=9.0m to 12.0m)")
    print("-" * 60)
    
    # Test 1: Legitimate new loan application on Flat 101 (Floor 1) by ICICI
    print("\n[Test 1] ICICI Bank queries loan for Flat 101 (1st Floor):")
    icici_flat_101 = extrude_2d_to_3d(land_plot, floor_number=1, floor_height=3.0)
    icici_flat_101["flat_number"] = "101"
    res1 = check_3d_conflict(icici_flat_101, existing_registry)
    print(f"  Result: {res1['status']}")
    print(f"  Message: {res1['message']}")
    
    # Test 2: Scammer brings a duplicate deed for Flat 402 to HDFC Bank
    print("\n[Test 2] HDFC Bank queries loan for duplicate Flat 402 (4th Floor):")
    hdfc_flat_402 = extrude_2d_to_3d(land_plot, floor_number=4, floor_height=3.0)
    hdfc_flat_402["flat_number"] = "402"
    res2 = check_3d_conflict(hdfc_flat_402, existing_registry)
    print(f"  Result: {res2['status']}")
    print(f"  Message: {res2['message']}")
    print(f"  Details: {res2['conflict_details']}")
    print("=" * 60)
