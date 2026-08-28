"""
REST API routes for the 3D ULPIN system.

New endpoints (root level):
    POST /parcels          — create a parcel, auto-generates ULPIN
    GET  /parcels/{ulpin}  — fetch parcel by 2D ULPIN
    GET  /buildings/{id}/units — list all units in a building
    GET  /units/{ulpin}    — fetch a single unit by full 3D ULPIN
    POST /topology/validate/{building_id} — run topology validation
    GET  /health           — health check

Legacy endpoints (under /api):
    GET /api/cadastre/parcels
    GET /api/cadastre/buildings
    GET /api/cadastre/units
    GET /api/cadastre/unit/{ulpin}
    GET /api/health
"""

from fastapi import APIRouter, HTTPException
from shapely.geometry import Polygon as ShapelyPolygon

from app.models.schemas import (
    ParcelCreate,
    ParcelResponse,
    UnitResponse,
    BuildingResponse,
    TopologyCheckResult,
)
from app.db.cadastre_db import CadastreDB
from app.core.ulpin import generate_ulpin
from app.core.topology import validate_building_topology

root_router = APIRouter(tags=["3D ULPIN API"])
api_router = APIRouter(prefix="/api", tags=["Legacy API"])

db = CadastreDB()


# ── New Endpoints ──────────────────────────────────────────────────────────


@root_router.post("/parcels", response_model=ParcelResponse)
def create_parcel(parcel: ParcelCreate):
    """Create a new parcel and auto-generate its 2D ULPIN."""
    ulpin = generate_ulpin(parcel.state, parcel.district, parcel.parcel_id)

    # Calculate area from geometry if polygon coords provided
    area = 0.0
    try:
        coords = parcel.geometry.get("coordinates", [[]])[0]
        if coords and len(coords) >= 4:
            area = round(ShapelyPolygon(coords).area * 1e10, 2)  # rough deg->sqm
    except Exception:
        pass

    data = {
        "ulpin": ulpin,
        "geometry": parcel.geometry,
        "owner": parcel.owner_name,
        "land_use": parcel.land_use,
        "area_sqm": area,
        "address": parcel.address,
    }
    db.add_parcel(ulpin, data)
    return data


@root_router.get("/parcels/{ulpin}", response_model=ParcelResponse)
def get_parcel(ulpin: str):
    """Fetch a parcel by its 2D ULPIN (e.g., MH-MUM-P001)."""
    data = db.get_parcel(ulpin)
    if not data:
        raise HTTPException(status_code=404, detail=f"Parcel '{ulpin}' not found")
    return data


@root_router.get("/buildings/{building_id}/units", response_model=list[UnitResponse])
def get_building_units(building_id: str):
    """List all units in a building with their full 3D ULPINs."""
    building = db.get_building(building_id)
    if not building:
        raise HTTPException(status_code=404, detail=f"Building '{building_id}' not found")
    units = db.get_units_by_building(building_id)
    return units


@root_router.get("/buildings/{building_id}", response_model=BuildingResponse)
def get_building(building_id: str):
    """Fetch building details by building ID."""
    building = db.get_building(building_id)
    if not building:
        raise HTTPException(status_code=404, detail=f"Building '{building_id}' not found")
    return building


@root_router.get("/units/{ulpin}", response_model=UnitResponse)
def get_unit(ulpin: str):
    """Fetch a single unit by its full 3D ULPIN."""
    data = db.get_unit(ulpin)
    if not data:
        raise HTTPException(status_code=404, detail=f"Unit '{ulpin}' not found")
    return data


@root_router.post(
    "/topology/validate/{building_id}",
    response_model=TopologyCheckResult,
)
def validate_topology(building_id: str):
    """Run topology validation on all units in a building."""
    building = db.get_building(building_id)
    if not building:
        raise HTTPException(status_code=404, detail=f"Building '{building_id}' not found")

    units = db.get_units_by_building(building_id)

    # Convert unit dicts to format expected by topology validator
    topo_units = []
    for u in units:
        # Extract coordinate ring from GeoJSON geometry
        coords = u["geometry"].get("coordinates", [[]])[0]
        topo_units.append({
            "ulpin": u["ulpin"],
            "geometry": coords,
            "z_min": u["z_min"],
            "z_max": u["z_max"],
            "floor_id": u["floor"],
        })

    result = validate_building_topology(building, topo_units)
    return TopologyCheckResult(**result)


@root_router.get("/health")
def health():
    """Health check with entity counts."""
    return {
        "status": "healthy",
        "parcels": len(db.parcels),
        "buildings": len(db.buildings),
        "units": len(db.units),
        "underground_assets": len(db.underground_assets),
    }


# ── Legacy API Endpoints (backward compat with existing frontend) ──────────


@api_router.get("/cadastre/parcels")
def api_get_parcels():
    """List all parcels."""
    return db.get_all_parcels()


@api_router.get("/cadastre/buildings")
def api_get_buildings():
    """List all buildings."""
    return db.get_all_buildings()


@api_router.get("/cadastre/units")
def api_get_all_units():
    """List all units."""
    return list(db.units.values())


@api_router.get("/cadastre/unit/{ulpin:path}")
def api_get_unit(ulpin: str):
    """Fetch a unit by ULPIN."""
    data = db.get_unit(ulpin)
    if not data:
        raise HTTPException(status_code=404, detail=f"Unit '{ulpin}' not found")
    return data


@api_router.get("/health")
def api_health():
    """Legacy health endpoint."""
    return health()
