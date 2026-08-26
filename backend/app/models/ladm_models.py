"""
ISO 19152 Land Administration Domain Model (LADM) Compliant 3D Cadastre Data Models.
Extends LADM core packages: Spatial Unit Package, Administrative Package, Party Package,
and Rights, Restrictions, Responsibilities (RRR) for Indian Vertical Property Registration.
"""

from enum import Enum
from typing import List, Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field
from datetime import datetime


class LA_UnitType(str, Enum):
    SURFACE = "SURFACE"
    APARTMENT = "APARTMENT"
    COMMERCIAL = "COMMERCIAL"
    BASEMENT = "BASEMENT"
    PARKING = "PARKING"
    AIR_RIGHTS = "AIR_RIGHTS"
    UTILITY_EASEMENT = "UTILITY_EASEMENT"
    COMMON_AREA = "COMMON_AREA"
    TERRACE = "TERRACE"


class LA_PartyType(str, Enum):
    INDIVIDUAL = "INDIVIDUAL"
    BUILDER = "BUILDER"
    BANK = "BANK"
    FINANCIAL_INSTITUTION = "FINANCIAL_INSTITUTION"
    GOVERNMENT = "GOVERNMENT"
    SOCIETY = "SOCIETY"
    METRO_RAIL_CORP = "METRO_RAIL_CORP"


class LA_RRRType(str, Enum):
    RIGHT_OWNERSHIP = "RIGHT_OWNERSHIP"
    RIGHT_LEASE = "RIGHT_LEASE"
    RIGHT_AIR = "RIGHT_AIR"
    RESTRICTION_MORTGAGE = "RESTRICTION_MORTGAGE"
    RESTRICTION_EASEMENT = "RESTRICTION_EASEMENT"
    RESTRICTION_COURT_INJUNCTION = "RESTRICTION_COURT_INJUNCTION"
    RESTRICTION_MUNICIPAL_VIOLATION = "RESTRICTION_MUNICIPAL_VIOLATION"
    RESPONSIBILITY_MAINTENANCE = "RESPONSIBILITY_MAINTENANCE"


class CadastralStatus(str, Enum):
    CLEAR = "CLEAR"
    MORTGAGED = "MORTGAGED"
    DISPUTED = "DISPUTED"
    VIOLATION_PHANTOM = "VIOLATION_PHANTOM"
    VIOLATION_EASEMENT = "VIOLATION_EASEMENT"
    CLASH_DETECTED = "CLASH_DETECTED"


class RiskLevel(str, Enum):
    GREEN_CLEAR = "GREEN_CLEAR"
    AMBER_REVIEW = "AMBER_REVIEW"
    RED_FRAUD_DETECTED = "RED_FRAUD_DETECTED"


class LA_Party(BaseModel):
    """
    ISO 19152 LA_Party: Represents natural/non-natural persons (Owners, Banks, Builders, Regulators).
    """
    party_id: str = Field(..., description="Unique party identifier")
    name: str = Field(..., description="Full legal name or entity name")
    party_type: LA_PartyType = Field(default=LA_PartyType.INDIVIDUAL)
    aadhaar_hash: Optional[str] = Field(None, description="SHA-256 hash of Aadhaar or PAN/CIN")
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    share_percentage: float = Field(default=100.0, description="Ownership share percentage")


class LA_RRR(BaseModel):
    """
    ISO 19152 LA_RRR: Rights, Restrictions, and Responsibilities on the Property.
    Encapsulates CERSAI security interests, mortgages, easements, and litigation tags.
    """
    rrr_id: str = Field(..., description="Unique RRR identifier")
    baunit_id: str = Field(..., description="Associated Basic Administrative Unit ID")
    rrr_type: LA_RRRType = Field(..., description="Type of right, restriction or responsibility")
    party_id: Optional[str] = Field(None, description="Beneficiary or Holder Party ID")
    bank_name: Optional[str] = Field(None, description="Mortgagee bank name if encumbered")
    cersai_security_interest_id: Optional[str] = Field(None, description="National CERSAI loan registry ID")
    loan_amount_inr: Optional[float] = Field(None, description="Sanctioned loan amount in INR")
    sanction_date: Optional[str] = Field(None, description="Mortgage creation / sanction timestamp")
    is_active: bool = Field(default=True, description="Whether RRR is active")
    court_case_no: Optional[str] = Field(None, description="Litigation suit number if disputed")
    description: Optional[str] = None


class LA_BAUnit(BaseModel):
    """
    ISO 19152 LA_BAUnit (Basic Administrative Unit):
    Represents the property's legal administrative identity in Indian Land Registration.
    """
    baunit_id: str = Field(..., description="Unique BAUnit identifier")
    name: str = Field(..., description="Property unit label / legal description")
    ulpin_2d: str = Field(..., description="Parent 2D parcel Bhu-Aadhaar ULPIN")
    ulpin_3d: str = Field(..., description="Standardized 3D-ULPIN identifier")
    title_deed_no: Optional[str] = Field(None, description="Sub-Registrar Registered Document No")
    registration_date: Optional[str] = Field(None, description="Registration date in SRO")
    sub_registrar_office: Optional[str] = Field(None, description="SRO Jurisdiction name")
    status: CadastralStatus = Field(default=CadastralStatus.CLEAR)
    property_value_inr: Optional[float] = Field(None, description="Declared market / consideration value")
    parties: List[LA_Party] = Field(default_factory=list)
    rrr_records: List[LA_RRR] = Field(default_factory=list)


class BuildingSanctionPlan(BaseModel):
    """
    Municipal Building Approval Sanction Plan (MCGM / BBMP / DDA / DTCP approved).
    Defines 3D spatial height envelope, maximum permissible FSI, and floor counts.
    """
    plan_id: str
    approval_number: str = Field(..., description="Municipal Sanction Order / IOD No.")
    municipal_authority: str = Field(..., description="MCGM, BBMP, DDA, HMDA, etc.")
    approval_date: str
    building_name: str
    survey_cts_no: str
    district: str
    state: str
    sanctioned_floors: int = Field(..., description="Approved above-ground floor count")
    sanctioned_basements: int = Field(default=0, description="Approved basement floor count")
    sanctioned_height_m: float = Field(..., description="Max permissible building height above plinth in meters")
    plinth_elevation_m: float = Field(default=0.0, description="Plinth level relative to MSL/ground (m)")
    floor_height_m: float = Field(default=3.0, description="Standard floor-to-floor height (m)")
    sanctioned_carpet_area_per_floor_sqm: float = Field(..., description="Approved carpet area per floor plate (sq.m)")
    sanctioned_total_fsi_sqm: float = Field(..., description="Total permissible Floor Space Index area")


class Mesh3DData(BaseModel):
    """
    3D Mesh Geometry data for Three.js rendering and WebGL visualization.
    """
    vertices: List[float] = Field(default_factory=list, description="Flat array [x1, y1, z1, x2, y2, z2, ...]")
    faces: List[int] = Field(default_factory=list, description="Flat triangle index array [0, 1, 2, 0, 2, 3, ...]")
    normals: Optional[List[float]] = Field(default_factory=list)
    bounds: Dict[str, float] = Field(default_factory=dict, description="minX, minY, minZ, maxX, maxY, maxZ")
    color: Optional[str] = Field(default="#3B82F6")
    opacity: Optional[float] = Field(default=0.85)


class LA_SpatialUnit(BaseModel):
    """
    ISO 19152 LA_SpatialUnit:
    The 3D Cadastral Unit holding exact geometric spatial boundaries, 3D volumetric extrusion,
    and associated legal BAUnit relationships.
    """
    spatial_unit_id: str
    ulpin_2d: str = Field(..., description="2D Parent ULPIN (e.g. MH27-045-8912345)")
    ulpin_3d: str = Field(..., description="Standardized 3D-ULPIN (e.g. MH27-045-8912345-APT-W1-F04-U402-A7C9)")
    unit_type: LA_UnitType = Field(default=LA_UnitType.APARTMENT)
    building_id: str
    wing: str = Field(default="W1", description="Building Wing / Tower")
    floor_number: int = Field(..., description="Floor integer: -2=B2, -1=B1, 0=Ground, 4=4th Floor")
    unit_number: str = Field(..., description="Flat / Unit No. (e.g. 402, B-101)")
    carpet_area_sqm: float = Field(..., description="Carpet area in square meters")
    carpet_area_sqft: float = Field(..., description="Carpet area in square feet")
    floor_height_m: float = Field(default=3.0, description="Clear ceiling/floor height in meters")
    elevation_base_m: float = Field(..., description="Z-bottom elevation from ground in meters")
    elevation_top_m: float = Field(..., description="Z-top elevation from ground in meters")
    footprint_2d: List[Tuple[float, float]] = Field(default_factory=list, description="2D polygon ring coordinates (X, Y)")
    bbox_3d: List[float] = Field(default_factory=list, description="[min_x, min_y, min_z, max_x, max_y, max_z]")
    volume_cum: float = Field(default=0.0, description="3D Volume in cubic meters (m³)")
    centroid_3d: Tuple[float, float, float] = Field(default=(0.0, 0.0, 0.0), description="(X, Y, Z) centroid")
    mesh_3d: Optional[Mesh3DData] = None
    baunit: Optional[LA_BAUnit] = None
    status: CadastralStatus = Field(default=CadastralStatus.CLEAR)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CadastralParcel(BaseModel):
    """
    2D Base Land Parcel representing the ground-level cadastral survey boundary.
    """
    ulpin_2d: str
    survey_cts_no: str
    village: str
    taluka: str
    district: str
    state: str
    state_code: str = Field(default="MH")
    district_code: str = Field(default="045")
    total_area_sqm: float
    boundary_coordinates: List[Tuple[float, float]] = Field(default_factory=list)
    sanction_plan: Optional[BuildingSanctionPlan] = None
    buildings: List[str] = Field(default_factory=list)
