"""
REST API routes for the 3D ULPIN system.

New endpoints (root level):
    POST /parcels          — create a parcel, auto-generates ULPIN
    GET  /parcels/{ulpin}  — fetch parcel by 2D ULPIN
    GET  /buildings/{id}/units — list all units in a building
    GET  /units/{ulpin}    — fetch a single unit by full 3D ULPIN
    POST /topology/validate/{building_id} — run topology validation
    POST /simulation/drone-to-3d — AI pipeline simulating 2D LiDAR/Drone footprint to 3D volumetric units
    GET  /health           — health check

Legacy endpoints (under /api):
    GET  /api/cadastre/parcels
    GET  /api/cadastre/buildings
    GET  /api/cadastre/units
    GET  /api/cadastre/unit/{ulpin}
    POST /api/simulation/drone-to-3d
    GET  /api/health
"""

import math
from fastapi import APIRouter, HTTPException
from shapely.geometry import Polygon as ShapelyPolygon

from app.models.schemas import (
    ParcelCreate,
    ParcelResponse,
    UnitResponse,
    BuildingResponse,
    TopologyCheckResult,
    DroneExtrusionRequest,
    DroneExtrusionResponse,
    DroneUnitResult,
    UnitType,
)
from app.db.cadastre_db import CadastreDB
from app.core.ulpin import generate_ulpin
from app.core.topology import validate_building_topology

root_router = APIRouter(tags=["3D ULPIN API"])
api_router = APIRouter(prefix="/api", tags=["Legacy API & AI Simulation"])

db = CadastreDB()


def _subdivide_polygon_strips(coords: list[list[float]], num_units: int) -> list[list[list[float]]]:
    """Subdivides a 2D bounding polygon into vertical unit strips."""
    xs = [pt[0] for pt in coords]
    ys = [pt[1] for pt in coords]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    width = max_x - min_x

    strips = []
    step = width / num_units
    for i in range(num_units):
        x1 = min_x + i * step
        x2 = min_x + (i + 1) * step
        strip = [
            [x1, min_y],
            [x2, min_y],
            [x2, max_y],
            [x1, max_y],
            [x1, min_y],
        ]
        strips.append(strip)
    return strips


def _process_drone_to_3d_extrusion(req: DroneExtrusionRequest) -> DroneExtrusionResponse:
    """Core logic to transform raw 2D drone/LiDAR footprint into 3D ULPIN units."""
    raw_coords = req.geometry.get("coordinates", [[]])[0]
    if not raw_coords or len(raw_coords) < 3:
        raise HTTPException(
            status_code=400,
            detail="Invalid GeoJSON geometry: must be a Polygon with at least 3 coordinate points."
        )

    # Subdivide footprint for each floor plate
    strips = _subdivide_polygon_strips(raw_coords, req.units_per_floor)

    # Calculate footprint area in sqm
    poly = ShapelyPolygon(raw_coords)
    centroid = poly.centroid
    if abs(centroid.x) <= 180 and abs(centroid.y) <= 90 and poly.area < 1.0:
        lat = centroid.y
        m_per_deg_lat = 111320.0
        m_per_deg_lon = 111320.0 * math.cos(math.radians(lat))
        total_footprint_sqm = round(poly.area * m_per_deg_lat * m_per_deg_lon, 2)
    else:
        total_footprint_sqm = round(poly.area, 2)

    unit_area_sqm = round(total_footprint_sqm / req.units_per_floor, 2)
    unit_volume_cum = round(unit_area_sqm * req.floor_height, 2)

    # Mock Indian cadastral owners pool
    owners_pool = [
        ("Rajesh & Sunita Sharma", "Clear Title"),
        ("Priya S. Patel", "Clear Title"),
        ("Amit Vikram Singh", "Mortgaged (SBI)"),
        ("Sneha & K. Reddy", "Clear Title"),
        ("Vikramaditya Joshi", "Mortgaged (HDFC Bank)"),
        ("Ananya Gupta", "Clear Title"),
        ("Kiran & Shalini Desai", "Clear Title"),
        ("Meera Nair", "Clear Title"),
        ("Rohan Kapoor", "Mortgaged (ICICI Bank)"),
        ("Deepa & Ramanathan Iyer", "Clear Title"),
        ("Suresh Kumar Deshmukh", "Clear Title"),
        ("Dr. Neha & Arjun Malhotra", "Clear Title"),
    ]

    unit_labels = ["A", "B", "C", "D", "E", "F", "G", "H"]
    generated_units: list[DroneUnitResult] = []

    # Floor range: optionally start from basement (-1) up to floor_count - 1
    start_floor = -1 if req.include_basement else 0
    end_floor = req.floor_count - (0 if req.include_basement else 0)

    owner_idx = 0
    for fn in range(start_floor, req.floor_count):
        z_min = round(req.base_elevation + (fn * req.floor_height), 2)
        z_max = round(z_min + req.floor_height, 2)

        for u_idx in range(req.units_per_floor):
            unit_code = f"U{u_idx + 1:02d}"
            label = unit_labels[u_idx % len(unit_labels)]

            # Determine realistic unit type
            if fn < 0:
                u_type = UnitType.PARKING
            elif fn == 0:
                u_type = UnitType.UTILITY if u_idx == 0 else UnitType.COMMERCIAL
            else:
                u_type = UnitType.RESIDENTIAL

            # Generate formal 3D ULPIN
            ulpin_3d = generate_ulpin(
                state=req.state,
                district=req.district,
                parcel_id=req.parcel_id,
                building_id=req.building_id,
                floor_no=fn,
                unit_no=unit_code,
                z_min=z_min,
                z_max=z_max,
            )

            owner_info = owners_pool[owner_idx % len(owners_pool)]
            owner_idx += 1

            generated_units.append(
                DroneUnitResult(
                    ulpin=ulpin_3d,
                    floor=fn,
                    unit=label,
                    owner=owner_info[0],
                    type=u_type,
                    z_min=z_min,
                    z_max=z_max,
                    area_sqm=unit_area_sqm,
                    volume_cum=unit_volume_cum,
                    status=owner_info[1],
                    geometry={"type": "Polygon", "coordinates": [strips[u_idx]]},
                )
            )

    total_units = len(generated_units)
    total_built_up_area = round(unit_area_sqm * total_units, 2)
    total_volume = round(unit_volume_cum * total_units, 2)
    total_height = round(req.floor_count * req.floor_height, 2)

    ulpin_prefix = f"{req.state}-{req.district}-{req.parcel_id}-{req.building_id}"

    return DroneExtrusionResponse(
        success=True,
        building_id=req.building_id,
        ulpin_prefix=ulpin_prefix,
        total_floors=req.floor_count + (1 if req.include_basement else 0),
        total_units=total_units,
        total_height_m=total_height,
        total_built_up_area_sqm=total_built_up_area,
        total_volume_cum=total_volume,
        units=generated_units,
        summary=(
            f"Successfully auto-generated {total_units} 3D volumetric ULPIN parcels across "
            f"{req.floor_count} floors from raw 2D drone LiDAR footprint. Total built-up area: "
            f"{total_built_up_area} m², total volumetric space: {total_volume} m³."
        ),
    )


# ── Core Endpoints ─────────────────────────────────────────────────────────


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


@root_router.post("/simulation/drone-to-3d", response_model=DroneExtrusionResponse)
def simulate_drone_to_3d(req: DroneExtrusionRequest):
    """AI Simulation: Auto-generate 3D volumetric ULPIN parcels from 2D drone/LiDAR footprint."""
    return _process_drone_to_3d_extrusion(req)


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


# ── Legacy & API Prefix Endpoints ──────────────────────────────────────────


@api_router.post("/simulation/drone-to-3d", response_model=DroneExtrusionResponse)
def api_simulate_drone_to_3d(req: DroneExtrusionRequest):
    """Legacy route for drone simulation pipeline."""
    return _process_drone_to_3d_extrusion(req)


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
