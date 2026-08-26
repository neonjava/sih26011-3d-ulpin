"""
3D Geospatial Engine for Cadastral Extrusions, Mesh Generation, and Volumetric Math.
Uses Shapely 2.x for 2D footprint topology and Trimesh for 3D watertight polyhedral meshes.
"""

import math
from typing import List, Tuple, Dict, Any, Optional
import numpy as np
from shapely.geometry import Polygon, MultiPolygon, Point, box
from shapely import validation
import trimesh

from app.models.ladm_models import Mesh3DData, LA_SpatialUnit, LA_UnitType
from app.core.ulpin_generator import generate_3d_ulpin, compute_volumetric_hash


def ensure_valid_polygon(coords: List[Tuple[float, float]]) -> Polygon:
    """
    Validates and fixes 2D polygon orientation (counter-clockwise) and closing.
    """
    if len(coords) < 3:
        raise ValueError(f"Polygon requires at least 3 coordinates, got {len(coords)}")
    
    # Ensure closed
    if coords[0] != coords[-1]:
        coords = list(coords) + [coords[0]]
    
    poly = Polygon(coords)
    if not poly.is_valid:
        poly = validation.make_valid(poly)
        if isinstance(poly, MultiPolygon):
            poly = max(poly.geoms, key=lambda p: p.area)
    
    # Ensure exterior ring is CCW (standard for 3D extrusion)
    if not poly.exterior.is_ccw:
        poly = Polygon(list(poly.exterior.coords)[::-1])
        
    return poly


def extrude_footprint_to_mesh(
    footprint_coords: List[Tuple[float, float]],
    z_min: float,
    z_max: float,
    color: str = "#3B82F6",
    opacity: float = 0.85,
) -> Tuple[trimesh.Trimesh, Mesh3DData, Dict[str, Any]]:
    """
    Extrudes a 2D polygonal footprint vertically from z_min to z_max into a 3D Polyhedral Mesh.
    Returns:
    - trimesh.Trimesh instance
    - Mesh3DData (ready for Three.js WebGL rendering)
    - Dict with volume_cum, surface_area_sqm, centroid_3d, bbox_3d
    """
    height = float(z_max - z_min)
    if height <= 0:
        raise ValueError(f"Invalid extrusion height: z_max ({z_max}) must be greater than z_min ({z_min})")

    poly = ensure_valid_polygon(footprint_coords)
    area_2d = float(poly.area)

    # Use Trimesh 2D polygon extrusion
    mesh_2d = trimesh.creation.extrude_polygon(poly, height=height)
    
    # Translate mesh vertically to start at z_min
    mesh_2d.apply_translation([0.0, 0.0, float(z_min)])
    
    # Calculate geometric properties
    volume_cum = round(float(area_2d * height), 3)
    surface_area = round(float(mesh_2d.area), 3)
    centroid = (
        round(float(mesh_2d.centroid[0]), 3),
        round(float(mesh_2d.centroid[1]), 3),
        round(float(mesh_2d.centroid[2]), 3),
    )
    
    bounds_arr = mesh_2d.bounds  # [[min_x, min_y, min_z], [max_x, max_y, max_z]]
    bbox_3d = [
        round(float(bounds_arr[0][0]), 3),
        round(float(bounds_arr[0][1]), 3),
        round(float(bounds_arr[0][2]), 3),
        round(float(bounds_arr[1][0]), 3),
        round(float(bounds_arr[1][1]), 3),
        round(float(bounds_arr[1][2]), 3),
    ]

    # Convert to flat lists for WebGL / Three.js
    vertices_flat = mesh_2d.vertices.flatten().tolist()
    faces_flat = mesh_2d.faces.flatten().tolist()
    
    normals_flat = []
    if hasattr(mesh_2d, "vertex_normals") and mesh_2d.vertex_normals is not None:
        normals_flat = mesh_2d.vertex_normals.flatten().tolist()

    mesh_data = Mesh3DData(
        vertices=[round(v, 4) for v in vertices_flat],
        faces=faces_flat,
        normals=[round(n, 4) for n in normals_flat],
        bounds={
            "minX": bbox_3d[0],
            "minY": bbox_3d[1],
            "minZ": bbox_3d[2],
            "maxX": bbox_3d[3],
            "maxY": bbox_3d[4],
            "maxZ": bbox_3d[5],
        },
        color=color,
        opacity=opacity,
    )

    metrics = {
        "volume_cum": volume_cum,
        "surface_area_sqm": surface_area,
        "carpet_area_sqm": round(area_2d, 2),
        "carpet_area_sqft": round(area_2d * 10.7639, 2),
        "centroid_3d": centroid,
        "bbox_3d": bbox_3d,
    }

    return mesh_2d, mesh_data, metrics


def compute_volumetric_overlap(
    footprint_a: List[Tuple[float, float]],
    z_min_a: float,
    z_max_a: float,
    footprint_b: List[Tuple[float, float]],
    z_min_b: float,
    z_max_b: float,
) -> Tuple[float, float, Optional[Mesh3DData]]:
    """
    Computes exact volumetric intersection between two 3D spatial prisms:
    Intersection Volume = 2D Intersection Area * Vertical Z Overlap.
    
    Returns:
    - overlap_volume_m3: intersection volume in m³
    - overlap_percentage_a: percentage of volume A occupied by overlap
    - intersection_mesh_data: 3D mesh of the clash zone (for red highlight in 3D viewer)
    """
    # Check vertical 1D overlap first
    overlap_z_min = max(z_min_a, z_min_b)
    overlap_z_max = min(z_max_a, z_max_b)
    z_overlap_height = max(0.0, overlap_z_max - overlap_z_min)

    if z_overlap_height <= 0.001:
        return 0.0, 0.0, None

    # Check 2D footprint intersection
    poly_a = ensure_valid_polygon(footprint_a)
    poly_b = ensure_valid_polygon(footprint_b)

    if not poly_a.intersects(poly_b):
        return 0.0, 0.0, None

    intersection_2d = poly_a.intersection(poly_b)
    if intersection_2d.is_empty or intersection_2d.area <= 0.001:
        return 0.0, 0.0, None

    # Calculate volumes
    intersect_area_2d = float(intersection_2d.area)
    overlap_volume_m3 = round(intersect_area_2d * z_overlap_height, 4)
    
    volume_a = float(poly_a.area * (z_max_a - z_min_a))
    overlap_percentage_a = round((overlap_volume_m3 / volume_a) * 100.0, 2) if volume_a > 0 else 0.0

    # Generate red clash mesh
    clash_mesh = None
    try:
        if isinstance(intersection_2d, Polygon):
            coords = list(intersection_2d.exterior.coords)
        elif isinstance(intersection_2d, MultiPolygon):
            largest = max(intersection_2d.geoms, key=lambda p: p.area)
            coords = list(largest.exterior.coords)
        else:
            coords = None

        if coords and len(coords) >= 3:
            _, clash_mesh, _ = extrude_footprint_to_mesh(
                footprint_coords=coords,
                z_min=overlap_z_min,
                z_max=overlap_z_max,
                color="#EF4444",  # Danger Red
                opacity=0.95,
            )
    except Exception:
        clash_mesh = None

    return overlap_volume_m3, overlap_percentage_a, clash_mesh


def subdivide_floor_plate(
    floor_boundary: List[Tuple[float, float]],
    num_units: int = 4,
    unit_prefixes: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """
    Subdivides a building floor footprint into sub-units (e.g. 4 flats per floor: 01, 02, 03, 04).
    Returns list of unit definitions with individual 2D polygon footprints.
    """
    poly = ensure_valid_polygon(floor_boundary)
    minx, miny, maxx, maxy = poly.bounds
    midx = (minx + maxx) / 2.0
    midy = (miny + maxy) / 2.0

    if num_units == 4:
        quadrants = [
            ("01", [(minx, midy), (midx, midy), (midx, maxy), (minx, maxy)]),  # NW
            ("02", [(midx, midy), (maxx, midy), (maxx, maxy), (midx, maxy)]),  # NE
            ("03", [(midx, miny), (maxx, miny), (maxx, midy), (midx, midy)]),  # SE
            ("04", [(minx, miny), (midx, miny), (midx, midy), (minx, midy)]),  # SW
        ]
        
        results = []
        for i, (suffix, q_coords) in enumerate(quadrants):
            prefix = unit_prefixes[i] if unit_prefixes and i < len(unit_prefixes) else suffix
            q_box = box(*Polygon(q_coords).bounds)
            sub_poly = poly.intersection(q_box)
            if not sub_poly.is_empty and sub_poly.area > 1.0:
                coords = list(sub_poly.exterior.coords)
                results.append({
                    "unit_suffix": prefix,
                    "footprint": coords,
                    "area_sqm": round(float(sub_poly.area), 2),
                })
        return results
    else:
        # Default single unit
        return [{
            "unit_suffix": "01",
            "footprint": list(poly.exterior.coords),
            "area_sqm": round(float(poly.area), 2),
        }]


def export_to_3d_geojson(spatial_units: List[LA_SpatialUnit]) -> Dict[str, Any]:
    """
    Exports a list of 3D Spatial Units into 3D GeoJSON format (Polygon Z features).
    """
    features = []
    for u in spatial_units:
        # Create bottom ring and top ring in 3D
        bottom_ring = [[round(x, 6), round(y, 6), round(u.elevation_base_m, 2)] for x, y in u.footprint_2d]
        
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [bottom_ring],
            },
            "properties": {
                "spatial_unit_id": u.spatial_unit_id,
                "ulpin_3d": u.ulpin_3d,
                "ulpin_2d": u.ulpin_2d,
                "floor_number": u.floor_number,
                "unit_number": u.unit_number,
                "unit_type": u.unit_type.value,
                "carpet_area_sqm": u.carpet_area_sqm,
                "carpet_area_sqft": u.carpet_area_sqft,
                "elevation_base_m": u.elevation_base_m,
                "elevation_top_m": u.elevation_top_m,
                "volume_cum": u.volume_cum,
                "status": u.status.value,
                "owner": u.baunit.parties[0].name if u.baunit and u.baunit.parties else "Unknown",
                "bank": u.baunit.rrr_records[0].bank_name if u.baunit and u.baunit.rrr_records else None,
                "cersai_id": u.baunit.rrr_records[0].cersai_security_interest_id if u.baunit and u.baunit.rrr_records else None,
            },
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "name": "3D_ULPIN_Cadastre_Layer",
        "crs": {
            "type": "name",
            "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"},
        },
        "features": features,
    }
