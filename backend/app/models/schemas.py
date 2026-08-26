"""
Pydantic Schemas for API Requests, Responses, Clash Reports, and Verification.
"""

from typing import List, Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field
from app.models.ladm_models import (
    LA_SpatialUnit,
    LA_BAUnit,
    LA_Party,
    LA_RRR,
    BuildingSanctionPlan,
    CadastralStatus,
    RiskLevel,
    Mesh3DData,
)


class ClashDetail(BaseModel):
    clash_type: str = Field(..., description="DUPLICATE_MORTGAGE, PHANTOM_FLOOR, CARPET_INFLATION, SUBSURFACE_UTILITY")
    severity: str = Field(..., description="HIGH, MEDIUM, LOW")
    conflicting_ulpin_3d: Optional[str] = None
    conflicting_unit_number: Optional[str] = None
    conflicting_bank: Optional[str] = None
    conflicting_cersai_id: Optional[str] = None
    conflicting_borrower: Optional[str] = None
    sanction_date: Optional[str] = None
    loan_amount_inr: Optional[float] = None
    overlap_volume_cum: Optional[float] = Field(None, description="Volumetric intersection in m³")
    overlap_percentage: Optional[float] = Field(None, description="Percentage of overlap relative to unit volume")
    excess_height_m: Optional[float] = None
    sanctioned_limit: Optional[Any] = None
    actual_value: Optional[Any] = None
    clash_mesh: Optional[Mesh3DData] = None
    message: str


class LoanVerificationRequest(BaseModel):
    ulpin_2d: str = Field(..., description="Base 2D ULPIN (e.g., MH27-045-8912345)")
    building_id: str = Field(default="BLD-MUM-01")
    wing: str = Field(default="W1")
    floor_number: int = Field(..., description="Requested floor number")
    unit_number: str = Field(..., description="Flat / Unit number e.g. 402")
    carpet_area_sqm: float = Field(..., description="Carpet area in sq meters from loan application")
    bank_name: str = Field(..., description="Lending Bank name (e.g. HDFC Bank)")
    applicant_name: str = Field(..., description="Loan applicant name")
    applicant_pan_aadhaar: Optional[str] = None
    loan_amount_inr: float = Field(..., description="Requested mortgage loan amount in INR")
    custom_footprint: Optional[List[Tuple[float, float]]] = None


class LoanVerificationResponse(BaseModel):
    ulpin_3d: str
    target_unit_number: str
    risk_level: RiskLevel
    risk_score: int = Field(..., description="Risk score from 0 (clean) to 100 (critical fraud)")
    decision: str = Field(..., description="APPROVED, FLAGGED_FOR_MANUAL_REVIEW, REJECTED_COLLISION_DETECTED")
    has_conflict: bool
    clashes: List[ClashDetail] = Field(default_factory=list)
    unit_3d_preview: Optional[Mesh3DData] = None
    clash_geometry: Optional[Mesh3DData] = None
    cadastral_metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str


class DeedParseRequest(BaseModel):
    raw_text: Optional[str] = None
    document_type: Optional[str] = Field(default="AUTO_DETECT", description="INDEX_II_MAHARASHTRA, KAVERI_KARNATAKA, DELHI_DEED, SALE_DEED")


class DeedExtractedData(BaseModel):
    document_type: str
    ulpin_2d: Optional[str] = None
    survey_cts_no: Optional[str] = None
    building_name: Optional[str] = None
    wing: Optional[str] = None
    floor_number: Optional[int] = None
    unit_number: Optional[str] = None
    carpet_area_sqm: Optional[float] = None
    carpet_area_sqft: Optional[float] = None
    built_up_area_sqm: Optional[float] = None
    ceiling_height_m: Optional[float] = None
    consideration_amount_inr: Optional[float] = None
    stamp_duty_paid_inr: Optional[float] = None
    registration_number: Optional[str] = None
    registration_date: Optional[str] = None
    sub_registrar_office: Optional[str] = None
    seller_name: Optional[str] = None
    buyer_name: Optional[str] = None
    mortgage_clause_found: bool = False
    existing_bank: Optional[str] = None
    generated_3d_ulpin: Optional[str] = None
    confidence_score: float = Field(default=0.95)


class DeedParseResponse(BaseModel):
    success: bool
    extracted_data: DeedExtractedData
    spatial_unit_preview: Optional[LA_SpatialUnit] = None
    validation_warnings: List[str] = Field(default_factory=list)


class SimulationScenario(BaseModel):
    scenario_id: str
    title: str
    location: str
    fraud_type: str
    description: str
    impact_analysis: str


class SimulationRunResponse(BaseModel):
    scenario_id: str
    title: str
    location: str
    fraud_detected: bool
    risk_level: RiskLevel
    risk_score: int
    summary: str
    clash_details: List[ClashDetail]
    victim_parties: List[Dict[str, Any]]
    perpetrator_party: Optional[Dict[str, Any]] = None
    financial_exposure_inr: float
    recommended_legal_action: str
    scene_3d_data: Dict[str, Any]
