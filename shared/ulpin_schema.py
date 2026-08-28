import json
from dataclasses import dataclass
from typing import Dict, Pattern
import re

@dataclass
class ULPINFieldSpec:
    name: str
    max_length: int
    pattern: str
    description: str

VALID_STATE_CODES = ["MH", "KA", "DL", "TN", "UP", "GJ", "RJ", "WB", "AP", "TS"]

ULPIN_FIELD_SPECS = {
    "state": ULPINFieldSpec(
        name="State",
        max_length=2,
        pattern=r"^[A-Z]{2}$",
        description="2-letter state code"
    ),
    "district": ULPINFieldSpec(
        name="District",
        max_length=3,
        pattern=r"^[A-Z]{3}$",
        description="3-letter district code"
    ),
    "parcel_id": ULPINFieldSpec(
        name="Parcel ID",
        max_length=4,
        pattern=r"^P\d{3}$",
        description="Parcel ID starting with P"
    ),
    "building_id": ULPINFieldSpec(
        name="Building ID",
        max_length=4,
        pattern=r"^B\d{3}$",
        description="Building ID starting with B"
    ),
    "floor_no": ULPINFieldSpec(
        name="Floor Number",
        max_length=4,
        pattern=r"^(GF|F\d{2}|BF\d{2})$",
        description="Floor encoding (GF, F01-F99, BF01-BF10)"
    ),
    "unit_no": ULPINFieldSpec(
        name="Unit Number",
        max_length=4,
        pattern=r"^U\d{2,3}$",
        description="Unit number starting with U"
    ),
    "z_range": ULPINFieldSpec(
        name="Z Range",
        max_length=20,
        pattern=r"^(n?\d+\.\d+)_(n?\d+\.\d+)$",
        description="Z-range in format min_max with 'n' for negative"
    )
}

ULPIN_SCHEMA = {
    "valid_state_codes": VALID_STATE_CODES,
    "fields": {k: {"name": v.name, "max_length": v.max_length, "pattern": v.pattern, "description": v.description} for k, v in ULPIN_FIELD_SPECS.items()}
}

if __name__ == "__main__":
    with open("ulpin_schema.json", "w") as f:
        json.dump(ULPIN_SCHEMA, f, indent=2)
