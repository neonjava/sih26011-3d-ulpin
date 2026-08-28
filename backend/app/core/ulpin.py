"""
3D ULPIN (Unique Land Parcel Identification Number) Generator & Parser.

Format: [STATE]-[DISTRICT]-[PARCEL_ID]-[BUILDING_ID]-[FLOOR_NO]-[UNIT_NO]-[Z_RANGE]

Examples:
    MH-MUM-P001-B001-F03-U02-9.0_12.0     (3rd floor, unit 2)
    MH-MUM-P001-B001-BF01-U01-n3.0_0.0    (basement floor 1)
    MH-MUM-P001-B001-GF-U01-0.0_3.0       (ground floor)

For 2D parcel-only ULPINs (no building/floor/unit):
    MH-MUM-P001
"""

import re
from typing import Any

__all__ = ["generate_ulpin", "parse_ulpin", "validate_ulpin"]

# Valid Indian state codes
VALID_STATE_CODES = {
    "MH": "Maharashtra", "KA": "Karnataka", "DL": "Delhi",
    "TN": "Tamil Nadu", "UP": "Uttar Pradesh", "GJ": "Gujarat",
    "RJ": "Rajasthan", "WB": "West Bengal", "AP": "Andhra Pradesh",
    "TS": "Telangana",
}

# Regex patterns for each field
_PATTERNS = {
    "state": r"^[A-Z]{2}$",
    "district": r"^[A-Z]{2,5}$",
    "parcel_id": r"^P\d{3,4}$",
    "building_id": r"^B\d{3,4}$",
    "floor_no": r"^(GF|F\d{2}|BF\d{2})$",
    "unit_no": r"^U\d{2,3}$",
    "z_range": r"^(n?\d+\.\d+)_(n?\d+\.\d+)$",
}


def _encode_floor(floor_no: int) -> str:
    """Encode floor number to string: 0->GF, +N->FNN, -N->BFNN."""
    if floor_no == 0:
        return "GF"
    elif floor_no > 0:
        return f"F{floor_no:02d}"
    else:
        return f"BF{abs(floor_no):02d}"


def _decode_floor(floor_str: str) -> int:
    """Decode floor string to integer: GF->0, FNN->+N, BFNN->-N."""
    if floor_str == "GF":
        return 0
    elif floor_str.startswith("BF"):
        return -int(floor_str[2:])
    elif floor_str.startswith("F"):
        return int(floor_str[1:])
    raise ValueError(f"Invalid floor string: {floor_str}")


def _encode_z(z: float) -> str:
    """Encode Z value: negative uses 'n' prefix. e.g., -3.0 -> 'n3.0'."""
    if z < 0:
        return f"n{abs(z):.1f}"
    return f"{z:.1f}"


def _decode_z(z_str: str) -> float:
    """Decode Z string: 'n3.0' -> -3.0, '9.0' -> 9.0."""
    if z_str.startswith("n"):
        return -float(z_str[1:])
    return float(z_str)


def generate_ulpin(
    state: str,
    district: str,
    parcel_id: str,
    building_id: str | None = None,
    floor_no: int | None = None,
    unit_no: str | None = None,
    z_min: float | None = None,
    z_max: float | None = None,
) -> str:
    """
    Generate a valid ULPIN string.

    For a 2D parcel-only ULPIN, pass only state, district, parcel_id.
    For a full 3D unit ULPIN, pass all parameters.

    Args:
        state: 2-letter state code (e.g., 'MH')
        district: 2-5 letter district code (e.g., 'MUM')
        parcel_id: Parcel ID (e.g., 'P001')
        building_id: Building ID (e.g., 'B001'), optional for 2D ULPIN
        floor_no: Floor number (0=ground, +N=upper, -N=basement), optional
        unit_no: Unit number (e.g., 'U01'), optional
        z_min: Minimum Z elevation in meters, optional
        z_max: Maximum Z elevation in meters, optional

    Returns:
        ULPIN string

    Raises:
        ValueError: If inputs are invalid
    """
    state = state.upper().strip()
    if state not in VALID_STATE_CODES:
        raise ValueError(f"Invalid state code: {state}. Valid: {list(VALID_STATE_CODES.keys())}")

    district = district.upper().strip()
    if not re.match(_PATTERNS["district"], district):
        raise ValueError(f"Invalid district code: {district}. Must be 2-5 uppercase letters.")

    parcel_id = parcel_id.upper().strip()
    if not re.match(_PATTERNS["parcel_id"], parcel_id):
        raise ValueError(f"Invalid parcel ID: {parcel_id}. Must match P followed by 3-4 digits.")

    # 2D parcel-only ULPIN
    if building_id is None:
        return f"{state}-{district}-{parcel_id}"

    # Full 3D ULPIN — all remaining params required
    building_id = building_id.upper().strip()
    if not re.match(_PATTERNS["building_id"], building_id):
        raise ValueError(f"Invalid building ID: {building_id}. Must match B followed by 3-4 digits.")

    if floor_no is None or unit_no is None or z_min is None or z_max is None:
        raise ValueError("For a 3D ULPIN, building_id, floor_no, unit_no, z_min, z_max are all required.")

    unit_no = unit_no.upper().strip()
    if not re.match(_PATTERNS["unit_no"], unit_no):
        raise ValueError(f"Invalid unit number: {unit_no}. Must match U followed by 2-3 digits.")

    if z_min >= z_max:
        raise ValueError(f"z_min ({z_min}) must be less than z_max ({z_max})")

    if floor_no < -10 or floor_no > 99:
        raise ValueError(f"Floor number {floor_no} out of range [-10, 99]")

    floor_str = _encode_floor(floor_no)
    z_range = f"{_encode_z(z_min)}_{_encode_z(z_max)}"

    return f"{state}-{district}-{parcel_id}-{building_id}-{floor_str}-{unit_no}-{z_range}"


def parse_ulpin(ulpin: str) -> dict[str, Any]:
    """
    Parse a ULPIN string into its component parts.

    Args:
        ulpin: ULPIN string (3-part for 2D, 7-part for 3D)

    Returns:
        Dict with keys: state, district, parcel_id, and optionally
        building_id, floor_no (int), unit_no, z_min (float), z_max (float),
        raw_floor, raw_z_range

    Raises:
        ValueError: If the ULPIN format is invalid
    """
    parts = ulpin.strip().split("-")

    if len(parts) == 3:
        # 2D parcel ULPIN
        state, district, parcel_id = parts
        if state not in VALID_STATE_CODES:
            raise ValueError(f"Invalid state code: {state}")
        return {
            "state": state,
            "district": district,
            "parcel_id": parcel_id,
            "is_3d": False,
        }

    if len(parts) == 7:
        state, district, parcel_id, building_id, floor_str, unit_no, z_range = parts

        if state not in VALID_STATE_CODES:
            raise ValueError(f"Invalid state code: {state}")

        if not re.match(_PATTERNS["floor_no"], floor_str):
            raise ValueError(f"Invalid floor code: {floor_str}")

        z_parts = z_range.split("_")
        if len(z_parts) != 2:
            raise ValueError(f"Invalid Z range format: {z_range}")

        z_min = _decode_z(z_parts[0])
        z_max = _decode_z(z_parts[1])

        if z_min >= z_max:
            raise ValueError(f"z_min ({z_min}) must be less than z_max ({z_max})")

        return {
            "state": state,
            "district": district,
            "parcel_id": parcel_id,
            "building_id": building_id,
            "floor_no": _decode_floor(floor_str),
            "unit_no": unit_no,
            "z_min": z_min,
            "z_max": z_max,
            "raw_floor": floor_str,
            "raw_z_range": z_range,
            "is_3d": True,
        }

    raise ValueError(
        f"Invalid ULPIN format: expected 3 parts (2D) or 7 parts (3D), got {len(parts)}"
    )


def validate_ulpin(ulpin: str) -> tuple[bool, str | None]:
    """
    Validate a ULPIN string.

    Returns:
        (True, None) if valid, (False, error_description) if invalid
    """
    try:
        parse_ulpin(ulpin)
        return True, None
    except ValueError as e:
        return False, str(e)
