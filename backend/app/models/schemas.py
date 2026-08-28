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
    area_sqm: Optional[float] = 78.5
    status: Optional[str] = "Clear Title"

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

# ── Drone Simulation Schemas ───────────────────────────────────────────

class DroneExtrusionRequest(BaseModel):
    geometry: dict = Field(..., description="2D GeoJSON Polygon of raw drone/LiDAR building footprint")
    floor_count: int = Field(default=5, ge=1, le=100, description="Number of above-ground floors detected")
    building_id: str = Field(default="B101", description="Building identifier")
    state: str = Field(default="MH", min_length=2, max_length=2, description="2-letter Indian state code")
    district: str = Field(default="MUM", min_length=2, max_length=5, description="District code")
    parcel_id: str = Field(default="P101", description="Cadastral Parcel ID")
    floor_height: float = Field(default=3.0, gt=0, description="Floor-to-floor height in meters")
    base_elevation: float = Field(default=0.0, description="Ground plinth datum elevation in meters")
    units_per_floor: int = Field(default=3, ge=1, le=8, description="Number of unit parcels to subdivide per floor plate")
    include_basement: bool = Field(default=False, description="Whether subsurface basement levels were detected")

class DroneUnitResult(BaseModel):
    ulpin: str
    floor: int
    unit: str
    owner: str
    type: UnitType
    z_min: float
    z_max: float
    area_sqm: float
    volume_cum: float
    status: str = "Clear Title"
    geometry: dict

class DroneExtrusionResponse(BaseModel):
    success: bool
    building_id: str
    ulpin_prefix: str
    total_floors: int
    total_units: int
    total_height_m: float
    total_built_up_area_sqm: float
    total_volume_cum: float
    units: List[DroneUnitResult]
    summary: str
