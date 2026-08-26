"""
Standardized 3D ULPIN (Unique Land Parcel Identification Number) Generation Engine.
Implements India's Bhu-Aadhaar 3D Cadastre Standard:
Format: {STATE_CODE}{DIST_CODE}{CADASTRAL_PIN}-{TYPE}-{WING}-{FLOOR_Z}-{UNIT_ID}-{VOLUMETRIC_HASH}
Example: MH27-045-8912345-APT-W1-F04-U402-A7C9
"""

import hashlib
import re
from typing import List, Optional, Dict, Any, Tuple
from app.models.ladm_models import LA_UnitType


UNIT_TYPE_MAPPING = {
    LA_UnitType.APARTMENT: "APT",
    LA_UnitType.COMMERCIAL: "COM",
    LA_UnitType.BASEMENT: "BSM",
    LA_UnitType.PARKING: "PRK",
    LA_UnitType.AIR_RIGHTS: "AIR",
    LA_UnitType.UTILITY_EASEMENT: "UTL",
    LA_UnitType.SURFACE: "SUR",
    LA_UnitType.COMMON_AREA: "COMN",
    LA_UnitType.TERRACE: "TER",
}

REVERSE_TYPE_MAPPING = {v: k for k, v in UNIT_TYPE_MAPPING.items()}


def format_floor_code(floor_number: int) -> str:
    """
    Encodes floor integer to standardized 3D cadastre floor code:
    - 0 -> G00 (Ground)
    - 4 -> F04 (4th Floor)
    - 12 -> F12
    - -1 -> B01 (Basement 1)
    - -2 -> B02 (Basement 2)
    """
    if floor_number == 0:
        return "G00"
    elif floor_number > 0:
        return f"F{floor_number:02d}"
    else:
        return f"B{abs(floor_number):02d}"


def parse_floor_code(floor_code: str) -> int:
    """
    Decodes floor code string back to signed integer.
    """
    code = floor_code.upper().strip()
    if code in ("G00", "G", "GR", "GF"):
        return 0
    elif code.startswith("F"):
        return int(code[1:])
    elif code.startswith("B"):
        return -int(code[1:])
    else:
        # Fallback numeric parse
        clean_num = re.sub(r"[^\d-]", "", code)
        return int(clean_num) if clean_num else 0


def compute_volumetric_hash(bbox_3d: List[float], precision: int = 2) -> str:
    """
    Computes a deterministic 4-character volumetric spatial hash from 3D bounding box
    [min_x, min_y, min_z, max_x, max_y, max_z].
    """
    if not bbox_3d or len(bbox_3d) < 6:
        bbox_3d = [0.0, 0.0, 0.0, 10.0, 10.0, 3.0]
    
    rounded_bbox = [round(float(c), precision) for c in bbox_3d[:6]]
    raw_str = ",".join(f"{c:.2f}" for c in rounded_bbox)
    sha = hashlib.sha256(raw_str.encode("utf-8")).hexdigest().upper()
    return sha[:4]


def generate_3d_ulpin(
    state_code: str,
    dist_code: str,
    cadastral_pin: str,
    unit_type: LA_UnitType,
    wing: str,
    floor_number: int,
    unit_number: str,
    bbox_3d: Optional[List[float]] = None,
) -> str:
    """
    Generates fully compliant Indian 3D-ULPIN string:
    e.g. MH27-045-8912345-APT-W1-F04-U402-A7C9
    """
    state_clean = state_code.strip().upper()[:4]
    dist_clean = dist_code.strip()
    pin_clean = cadastral_pin.strip().replace(" ", "")
    
    # If 2D ULPIN was already provided as MH27-045-8912345, normalize
    if "-" in state_clean and not dist_clean:
        base_prefix = state_clean
    else:
        base_prefix = f"{state_clean}-{dist_clean}-{pin_clean}" if dist_clean else f"{state_clean}-{pin_clean}"

    type_code = UNIT_TYPE_MAPPING.get(unit_type, "APT")
    wing_code = wing.strip().upper()
    if not wing_code.startswith("W") and not wing_code.startswith("T"):
        wing_code = f"W{wing_code}"
    
    floor_code = format_floor_code(floor_number)
    
    # Normalize unit number (e.g. 402 -> U402)
    clean_unit = unit_number.strip().upper()
    if not clean_unit.startswith("U") and clean_unit.isalnum():
        unit_code = f"U{clean_unit}"
    else:
        unit_code = clean_unit

    vol_hash = compute_volumetric_hash(bbox_3d) if bbox_3d else "A001"
    
    return f"{base_prefix}-{type_code}-{wing_code}-{floor_code}-{unit_code}-{vol_hash}"


def parse_3d_ulpin(ulpin_3d: str) -> Dict[str, Any]:
    """
    Parses a 3D-ULPIN string into its constituent components.
    """
    pattern = r"^(?P<base_2d>[A-Z0-9]+(?:-[A-Z0-9]+)+)-(?P<type>[A-Z]{3,4})-(?P<wing>[A-Z0-9]+)-(?P<floor>[A-Z0-9]+)-(?P<unit>[A-Z0-9]+)-(?P<hash>[A-Z0-9]{4})$"
    match = re.match(pattern, ulpin_3d.strip())
    
    if not match:
        # Fallback split
        parts = ulpin_3d.strip().split("-")
        if len(parts) >= 6:
            base_2d = "-".join(parts[:-5])
            type_str = parts[-5]
            wing_str = parts[-4]
            floor_str = parts[-3]
            unit_str = parts[-2]
            hash_str = parts[-1]
        else:
            raise ValueError(f"Invalid 3D-ULPIN format: {ulpin_3d}")
    else:
        data = match.groupdict()
        base_2d = data["base_2d"]
        type_str = data["type"]
        wing_str = data["wing"]
        floor_str = data["floor"]
        unit_str = data["unit"]
        hash_str = data["hash"]

    unit_type = REVERSE_TYPE_MAPPING.get(type_str, LA_UnitType.APARTMENT)
    floor_int = parse_floor_code(floor_str)
    
    # Extract unit number stripping leading 'U'
    unit_clean = unit_str[1:] if unit_str.startswith("U") and len(unit_str) > 1 else unit_str

    return {
        "ulpin_3d": ulpin_3d,
        "base_2d": base_2d,
        "unit_type": unit_type,
        "type_code": type_str,
        "wing": wing_str,
        "floor_code": floor_str,
        "floor_number": floor_int,
        "unit_number": unit_clean,
        "volumetric_hash": hash_str,
    }


def verify_3d_ulpin(ulpin_3d: str, bbox_3d: List[float]) -> bool:
    """
    Validates whether the volumetric hash in the 3D-ULPIN matches the actual bounding box geometry.
    """
    try:
        parsed = parse_3d_ulpin(ulpin_3d)
        expected_hash = compute_volumetric_hash(bbox_3d)
        return parsed["volumetric_hash"] == expected_hash
    except Exception:
        return False
