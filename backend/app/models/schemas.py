from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class UnitType(str, Enum):
    RESIDENTIAL = 'residential'
    PARKING = 'parking'
    UTILITY = 'utility'
    COMMERCIAL = 'commercial'

class ParcelCreate(BaseModel):
    state: str = Field(..., min_length=2, max_length=2, description='State code e.g. MH')
    district: str = Field(..., min_length=2, max_length=5, description='District code e.g. MUM')
    parcel_id: str = Field(..., description='Parcel ID e.g. P001')
    geometry: dict = Field(..., description='GeoJSON geometry object')
    owner_name: str = 'Mock Owner'
    land_use: str = 'mixed'
    address: str = ''

class ParcelResponse(BaseModel):
    ulpin: str
    geometry: dict
    owner: str
    land_use: str
    area_sqm: float
    address: str

class UnitResponse(BaseModel):
    """JSON response shape matching frontend contract"""
    ulpin: str
    geometry: dict  # GeoJSON geometry
    floor: int
    unit: str  # Unit label like 'A', 'B', 'C'
    owner: str
    type: UnitType
    z_min: float
    z_max: float

class BuildingResponse(BaseModel):
    id: str
    ulpin_prefix: str
    total_height: float
    num_floors: int
    num_basements: int
    building_type: str
    geometry: dict
    ground_elevation: float

class TopologyViolation(BaseModel):
    ulpin1: str
    ulpin2: Optional[str] = None
    reason: str
    overlap_volume: float = 0.0

class TopologyCheckResult(BaseModel):
    valid: bool
    summary: str
    violations: List[TopologyViolation] = []
