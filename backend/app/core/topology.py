"""
Topology validation module for 3D ULPIN.
Uses Shapely for 2D geometry checks and basic range checks for Z axis.
"""
from typing import Any, Dict, List, Optional, Tuple, Union
from shapely.geometry import Polygon
from shapely.geometry.base import BaseGeometry

def _to_polygon(geom_data: Union[BaseGeometry, List[Tuple[float, float]], List[List[float]]]) -> Polygon:
    """Helper to convert coordinates list or Shapely geometry to a Shapely Polygon."""
    if isinstance(geom_data, BaseGeometry):
        if not isinstance(geom_data, Polygon):
            raise ValueError(f"Expected Polygon, got {type(geom_data)}")
        return geom_data
    return Polygon(geom_data)

def check_units_overlap(
    unit_a_geom: Union[BaseGeometry, List[Any]], 
    unit_a_z_range: Tuple[float, float], 
    unit_b_geom: Union[BaseGeometry, List[Any]], 
    unit_b_z_range: Tuple[float, float]
) -> Dict[str, Any]:
    """
    Checks if two units overlap in 2D and 3D.
    
    Args:
        unit_a_geom: Geometry of unit A (Polygon or list of coordinates)
        unit_a_z_range: (z_min, z_max) for unit A
        unit_b_geom: Geometry of unit B (Polygon or list of coordinates)
        unit_b_z_range: (z_min, z_max) for unit B
        
    Returns:
        Dict with overlap information: overlaps_2d, overlaps_z, overlaps_3d, 
        overlap_area_2d, overlap_z_range, overlap_volume.
    """
    poly_a = _to_polygon(unit_a_geom)
    poly_b = _to_polygon(unit_b_geom)
    
    # 2D Intersection
    intersection_2d = poly_a.intersection(poly_b)
    overlap_area_2d = intersection_2d.area
    overlaps_2d = overlap_area_2d > 1e-6  # small tolerance for floating point issues
    
    # Z Intersection
    a_min, a_max = unit_a_z_range
    b_min, b_max = unit_b_z_range
    
    overlap_z_min = max(a_min, b_min)
    overlap_z_max = min(a_max, b_max)
    overlap_z_range = overlap_z_max - overlap_z_min
    
    overlaps_z = overlap_z_range > 1e-6
    
    # 3D Intersection
    overlaps_3d = overlaps_2d and overlaps_z
    overlap_volume = overlap_area_2d * overlap_z_range if overlaps_3d else 0.0
    
    return {
        'overlaps_2d': overlaps_2d,
        'overlaps_z': overlaps_z,
        'overlaps_3d': overlaps_3d,
        'overlap_area_2d': float(overlap_area_2d),
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
            error = f"Unit bottom ({unit_z_min}) is below building minimum ({building_z_min})"
        elif unit_z_max > building_z_max + tol:
            error = f"Unit top ({unit_z_max}) is above building maximum ({building_z_max})"
            
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
        List of overlap violations between pairs of units.
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
                violations.append({
                    'unit_a': u_a.get('ulpin', f"index_{i}"),
                    'unit_b': u_b.get('ulpin', f"index_{j}"),
                    'overlap_area': overlap_res['overlap_area_2d'],
                    'overlap_volume': overlap_res['overlap_volume']
                })
                
    return violations

def validate_building_topology(building: Dict[str, Any], units: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Validates all units within a building against building envelope and checks for same-floor overlaps.
    
    Args:
        building: Dict containing 'ground_elevation', 'total_height', 'num_basements', 'basement_depth' (optional)
        units: List of unit dicts with 'geometry', 'z_min', 'z_max', 'ulpin', 'floor_id'
        
    Returns:
        Dict with overall validation result and lists of specific violations.
    """
    z_violations = []
    
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
            z_violations.append({
                'unit': u.get('ulpin', 'unknown'),
                'error': z_res['error']
            })
            
    # 2. Check for overlaps on same floors
    overlap_violations = []
    
    # Group units by floor
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
                overlap_violations.extend(floor_violations)
                
    is_valid = len(z_violations) == 0 and len(overlap_violations) == 0
    
    summary_parts = []
    if z_violations:
        summary_parts.append(f"{len(z_violations)} units outside building envelope.")
    if overlap_violations:
        summary_parts.append(f"{len(overlap_violations)} overlapping unit pairs found.")
    
    return {
        'valid': is_valid,
        'z_violations': z_violations,
        'overlap_violations': overlap_violations,
        'summary': " ".join(summary_parts) if summary_parts else "All units topologically valid."
    }
