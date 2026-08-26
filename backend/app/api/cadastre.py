"""
Cadastre Management & 3D Spatial Unit Query APIs.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.db.mock_db import cadastre_db
from app.models.ladm_models import (
    LA_SpatialUnit,
    CadastralParcel,
    BuildingSanctionPlan,
    CadastralStatus,
)
from app.core.spatial_engine import export_to_3d_geojson

router = APIRouter(prefix="/cadastre", tags=["Cadastre & 3D Spatial Units"])


@router.get("/parcels", response_model=List[CadastralParcel])
def get_all_parcels():
    """
    Returns all 2D cadastral land parcels registered in Bhu-Aadhaar system.
    """
    return cadastre_db.get_all_parcels()


@router.get("/parcel/{ulpin_2d}", response_model=CadastralParcel)
def get_parcel_by_ulpin(ulpin_2d: str):
    """
    Fetches base cadastral parcel by 2D ULPIN.
    """
    parcel = cadastre_db.get_parcel_by_2d_ulpin(ulpin_2d)
    if not parcel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Parcel {ulpin_2d} not found")
    return parcel


@router.get("/buildings", response_model=List[BuildingSanctionPlan])
def get_all_buildings():
    """
    Returns municipal building approval sanction plans.
    """
    return cadastre_db.get_all_buildings()


@router.get("/units", response_model=List[LA_SpatialUnit])
def get_all_spatial_units(
    building_id: Optional[str] = Query(None, description="Filter by building ID"),
    floor_number: Optional[int] = Query(None, description="Filter by floor level"),
    status_filter: Optional[str] = Query(None, description="Filter by status: ALL, CLEAR, MORTGAGED, DISPUTED, VIOLATION"),
):
    """
    Retrieves all 3D spatial units with optional filtering.
    """
    units = cadastre_db.get_all_units()

    if building_id:
        units = [u for u in units if u.building_id == building_id]

    if floor_number is not None:
        units = [u for u in units if u.floor_number == floor_number]

    if status_filter and status_filter.upper() != "ALL":
        stat = status_filter.upper()
        if stat == "MORTGAGED":
            units = [u for u in units if u.status == CadastralStatus.MORTGAGED]
        elif stat == "CLEAR":
            units = [u for u in units if u.status == CadastralStatus.CLEAR]
        elif stat == "DISPUTED":
            units = [u for u in units if u.status == CadastralStatus.DISPUTED]
        elif stat in ("VIOLATION", "VIOLATIONS"):
            units = [u for u in units if u.status in (CadastralStatus.VIOLATION_PHANTOM, CadastralStatus.VIOLATION_EASEMENT, CadastralStatus.CLASH_DETECTED)]

    return units


@router.get("/unit/{ulpin_3d}", response_model=LA_SpatialUnit)
def get_unit_by_3d_ulpin(ulpin_3d: str):
    """
    Fetches full 3D spatial unit details including 3D Mesh vertices/faces,
    ISO 19152 BAUnit legal record, parties, and active CERSAI mortgages.
    """
    unit = cadastre_db.get_unit_by_3d_ulpin(ulpin_3d)
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"3D Spatial Unit {ulpin_3d} not found")
    return unit


@router.post("/units", response_model=LA_SpatialUnit, status_code=status.HTTP_201_CREATED)
def register_3d_unit(unit: LA_SpatialUnit):
    """
    Registers a new 3D spatial unit into the cadastre database.
    """
    cadastre_db.add_spatial_unit(unit)
    return unit


@router.get("/export/geojson")
def export_cadastre_geojson(building_id: Optional[str] = None):
    """
    Exports 3D cadastre units as 3D GeoJSON FeatureCollection (Polygon Z).
    """
    units = cadastre_db.get_units_by_building(building_id) if building_id else cadastre_db.get_all_units()
    return export_to_3d_geojson(units)
