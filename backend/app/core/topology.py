"""
Topology validation module for 3D ULPIN.
Uses Shapely for 2D geometry checks and basic range checks for Z axis.
"""
import math
from typing import Any, Dict, List, Optional, Tuple, Union
from shapely.geometry import Polygon, MultiPolygon
from shapely.geometry.base import BaseGeometry
from shapely import validation

def _to_polygon(geom_data: Union[BaseGeometry, Dict[str, Any], List[Tuple[float, float]], List[List[float]]]) -> Polygon:
    """Helper to convert coordinates list, GeoJSON dict, or Shapely geometry to a Shapely Polygon."""
    if isinstance(geom_data, BaseGeometry):
        if isinstance(geom_data, MultiPolygon):
            return max(geom_data.geoms, key=lambda p: p.area)
        if not isinstance(geom_data, Polygon):
            raise ValueError(f"Expected Polygon, got {type(geom_data)}")
        return geom_data
    if isinstance(geom_data, dict):
        coords = geom_data.get("coordinates", [[]])
        if coords and len(coords) > 0:
            poly = Polygon(coords[0])
        else:
            poly = Polygon([])
    else:
        poly = Polygon(geom_data)
        
    if not poly.is_valid:
        poly = validation.make_valid(poly)
        if isinstance(poly, MultiPolygon):
            poly = max(poly.geoms, key=lambda p: p.area)
    return poly

def _compute_area_sqm(poly: BaseGeometry) -> float:
    """Computes area in square meters, converting from degrees if geographic coordinates."""
    if poly.is_empty or not hasattr(poly, 'area'):
        return 0.0
    raw_area = float(poly.area)
    if raw_area <= 0:
        return 0.0
    # Check if coordinates are geographic (WGS84 degrees)
    centroid = poly.centroid
    if abs(centroid.x) <= 180 and abs(centroid.y) <= 90 and raw_area < 1.0:
        lat = centroid.y
        m_per_deg_lat = 111320.0
        m_per_deg_lon = 111320.0 * math.cos(math.radians(lat))
        return raw_area * m_per_deg_lat * m_per_deg_lon
    return raw_area

def check_units_overlap(
    unit_a_geom: Union[BaseGeometry, Dict[str, Any], List[Any]], 
    unit_a_z_range: Tuple[float, float], 
    unit_b_geom: Union[BaseGeometry, Dict[str, Any], List[Any]], 
    unit_b_z_range: Tuple[float, float]
) -> Dict[str, Any]:
    """
    Checks if two units overlap in 2D and 3D.
    
    Args:
        unit_a_geom: Geometry of unit A (Polygon, GeoJSON dict, or list of coordinates)
        unit_a_z_range: (z_min, z_max) for unit A
        unit_b_geom: Geometry of unit B (Polygon, GeoJSON dict, or list of coordinates)
        unit_b_z_range: (z_min, z_max) for unit B
        
    Returns:
        Dict with overlap information: overlaps_2d, overlaps_z, overlaps_3d, 
        overlap_area_2d, overlap_z_range, overlap_volume.
    """
    poly_a = _to_polygon(unit_a_geom)
    poly_b = _to_polygon(unit_b_geom)
    
    # 2D Intersection
    intersection_2d = poly_a.intersection(poly_b)
    
    # Calculate area in sq meters
    overlap_area_sqm = _compute_area_sqm(intersection_2d)
    
    # Meaningful 2D overlap (more than 0.01 sqm = 100 sq cm)
    overlaps_2d = overlap_area_sqm > 0.01
    
    # Z Intersection
    a_min, a_max = unit_a_z_range
    b_min, b_max = unit_b_z_range
    
    overlap_z_min = max(a_min, b_min)
    overlap_z_max = min(a_max, b_max)
    overlap_z_range = overlap_z_max - overlap_z_min
    
    overlaps_z = overlap_z_range > 1e-4
    
    # 3D Intersection
    overlaps_3d = overlaps_2d and overlaps_z
    overlap_volume = overlap_area_sqm * overlap_z_range if overlaps_3d else 0.0
    
    return {
        'overlaps_2d': overlaps_2d,
        'overlaps_z': overlaps_z,
        'overlaps_3d': overlaps_3d,
        'overlap_area_2d': float(overlap_area_sqm),
        'overlap_z_range': float(overlap_z_range) if overlaps_z else 0.0,
        'overlap_volume': float(overlap_volume)
    }

def check_unit_within_building(
    unit_z_min: float, 
    unit_z_max: float, 
    building_ground_elev: float, 
    building_total_height: float, 
    building_num_basements: int, 
    basement_depth: float = 3.0
) -> Dict[str, Any]:
    """
    Checks if unit's Z-range falls within the building's height envelope.
    
    Args:
        unit_z_min: Unit minimum Z coordinate
        unit_z_max: Unit maximum Z coordinate
        building_ground_elev: Building ground elevation
        building_total_height: Building total height above ground
        building_num_basements: Number of basement floors
        basement_depth: Average depth per basement floor
        
    Returns:
        Dict containing validation result and boundary limits.
    """
    building_z_min = building_ground_elev - (building_num_basements * basement_depth)
    building_z_max = building_ground_elev + building_total_height
    
    # A small tolerance for floating point comparisons
    tol = 1e-4
    within = (unit_z_min >= building_z_min - tol) and (unit_z_max <= building_z_max + tol)
    
    error = None
    if not within:
        if unit_z_min < building_z_min - tol:
            error = f"Unit bottom ({unit_z_min}m) is below building foundation minimum ({building_z_min}m)"
        elif unit_z_max > building_z_max + tol:
            error = f"Unit top ({unit_z_max}m) exceeds sanctioned building maximum height ({building_z_max}m)"
            
    return {
        'within_building': within,
        'building_z_min': float(building_z_min),
        'building_z_max': float(building_z_max),
        'unit_z_min': float(unit_z_min),
        'unit_z_max': float(unit_z_max),
        'error': error
    }

def validate_floor_units(units: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Validates units on the same floor by checking all pairs for overlaps.
    
    Args:
        units: List of unit dicts. Each must contain 'geometry', 'z_min', 'z_max', and 'ulpin'
        
    Returns:
        List of overlap violations matching { 'ulpin1', 'ulpin2', 'reason', 'overlap_volume' }.
    """
    violations = []
    
    num_units = len(units)
    for i in range(num_units):
        for j in range(i + 1, num_units):
            u_a = units[i]
            u_b = units[j]
            
            overlap_res = check_units_overlap(
                unit_a_geom=u_a['geometry'],
                unit_a_z_range=(u_a['z_min'], u_a['z_max']),
                unit_b_geom=u_b['geometry'],
                unit_b_z_range=(u_b['z_min'], u_b['z_max'])
            )
            
            if overlap_res['overlaps_3d']:
                vol = round(float(overlap_res['overlap_volume']), 2)
                violations.append({
                    'ulpin1': u_a.get('ulpin', f"unit_{i}"),
                    'ulpin2': u_b.get('ulpin', f"unit_{j}"),
                    'reason': f"3D spatial collision detected between units ({vol:.2f} m³ volumetric overlap)",
                    'overlap_volume': vol
                })
                
    return violations

def validate_building_topology(building: Dict[str, Any], units: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Validates all units within a building against building envelope and checks for same-floor overlaps.
    
    Args:
        building: Dict containing 'ground_elevation', 'total_height', 'num_basements', 'basement_depth' (optional)
        units: List of unit dicts with 'geometry', 'z_min', 'z_max', 'ulpin', 'floor_id'
        
    Returns:
        Dict matching { 'valid': bool, 'summary': str, 'violations': [...] }
    """
    violations = []
    
    # 1. Check unit Z boundaries vs building envelope
    ground_elev = building.get('ground_elevation', 0.0)
    total_height = building.get('total_height', 0.0)
    num_basements = building.get('num_basements', 0)
    basement_depth = building.get('basement_depth', 3.0)
    
    for u in units:
        z_res = check_unit_within_building(
            unit_z_min=u['z_min'],
            unit_z_max=u['z_max'],
            building_ground_elev=ground_elev,
            building_total_height=total_height,
            building_num_basements=num_basements,
            basement_depth=basement_depth
        )
        if not z_res['within_building']:
            violations.append({
                'ulpin1': u.get('ulpin', 'unknown'),
                'ulpin2': None,
                'reason': z_res.get('error', 'Unit Z-range exceeds sanctioned building envelope bounds'),
                'overlap_volume': 0.0
            })
            
    # 2. Check for overlaps on same floors
    floors = {}
    for u in units:
        f_id = u.get('floor_id', 'unknown')
        if f_id not in floors:
            floors[f_id] = []
        floors[f_id].append(u)
        
    for f_id, floor_units in floors.items():
        if len(floor_units) > 1:
            floor_violations = validate_floor_units(floor_units)
            if floor_violations:
                violations.extend(floor_violations)
                
    is_valid = len(violations) == 0
    
    if is_valid:
        summary = "All units topologically valid. No 3D spatial overlaps or envelope violations detected."
    else:
        summary = f"Topology validation detected {len(violations)} spatial violation(s)."
    
    return {
        'valid': is_valid,
        'summary': summary,
        'violations': violations
    }
