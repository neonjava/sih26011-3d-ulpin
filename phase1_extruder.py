"""
PHASE 1: Core 2D to 3D Extruder
-------------------------------
Takes a 2D land/flat polygon and pulls it up into a 3D block along the Z-axis (height).
"""

from typing import List, Tuple, Dict, Any

def extrude_2d_to_3d(
    polygon_2d: List[Tuple[float, float]],
    floor_number: int,
    floor_height: float = 3.0,
    base_elevation: float = 0.0
) -> Dict[str, Any]:
    """
    Pulls a 2D polygon into a 3D solid block for a given floor.
    
    Args:
        polygon_2d: List of (x, y) coordinates representing the flat footprint.
        floor_number: The floor number (e.g., 1 for 1st floor, 4 for 4th floor).
        floor_height: Height of one floor in meters (default: 3.0m / ~10ft).
        base_elevation: Ground / Plinth elevation in meters (default: 0.0m).
    
    Returns:
        Dictionary containing 3D vertices, height range, volume, and 3D boundary.
    """
    if len(polygon_2d) < 3:
        raise ValueError("Polygon must have at least 3 points")
    
    # 1. Calculate vertical Z boundaries
    z_min = base_elevation + (floor_number - 1) * floor_height
    z_max = z_min + floor_height
    
    # 2. Generate 3D bottom and top vertices
    bottom_vertices = [(x, y, z_min) for (x, y) in polygon_2d]
    top_vertices = [(x, y, z_max) for (x, y) in polygon_2d]
    all_3d_vertices = bottom_vertices + top_vertices
    
    # 3. Calculate 2D Area (Shoelace formula) and 3D Volume
    n = len(polygon_2d)
    area_2d = 0.5 * abs(sum(
        polygon_2d[i][0] * polygon_2d[(i + 1) % n][1] - 
        polygon_2d[(i + 1) % n][0] * polygon_2d[i][1] 
        for i in range(n)
    ))
    volume_3d = area_2d * floor_height
    
    # 4. Calculate 3D Bounding Box [minX, minY, minZ, maxX, maxY, maxZ]
    xs = [p[0] for p in polygon_2d]
    ys = [p[1] for p in polygon_2d]
    bbox_3d = {
        "min_x": min(xs),
        "max_x": max(xs),
        "min_y": min(ys),
        "max_y": max(ys),
        "min_z": z_min,
        "max_z": z_max
    }
    
    return {
        "floor_number": floor_number,
        "elevation_range": {
            "z_bottom_meters": z_min,
            "z_top_meters": z_max,
            "height_meters": floor_height
        },
        "carpet_area_sqm": round(area_2d, 2),
        "volume_cubic_meters": round(volume_3d, 2),
        "bounding_box_3d": bbox_3d,
        "vertices_3d": all_3d_vertices,
        "summary": f"Flat on Floor {floor_number} extruded from Z={z_min}m to Z={z_max}m (Volume: {round(volume_3d, 1)} m³)"
    }


# ==========================================
# TEST DEMO: Mumbai Plot with Flat 101 & Flat 402
# ==========================================
if __name__ == "__main__":
    print("=" * 60)
    print("🇮🇳 PHASE 1 DEMO: 2D MAP TO 3D EXTRUDER")
    print("=" * 60)
    
    # Step 1: Define a 2D map flat polygon (10m x 8m = 80 sq.m flat footprint)
    sample_2d_flat = [(0.0, 0.0), (10.0, 0.0), (10.0, 8.0), (0.0, 8.0)]
    print(f"\n[1] 2D Map Footprint Coordinates: {sample_2d_flat}")
    
    # Step 2: Extrude Flat 101 (1st Floor, 3.0m height)
    flat_101 = extrude_2d_to_3d(sample_2d_flat, floor_number=1, floor_height=3.0)
    print(f"\n[2] Flat 101 (1st Floor):")
    print(f"    • {flat_101['summary']}")
    print(f"    • Vertical Range: Z = {flat_101['elevation_range']['z_bottom_meters']}m to {flat_101['elevation_range']['z_top_meters']}m")
    print(f"    • 3D Bounding Box: {flat_101['bounding_box_3d']}")
    
    # Step 3: Extrude Flat 402 (4th Floor, 3.0m height)
    flat_402 = extrude_2d_to_3d(sample_2d_flat, floor_number=4, floor_height=3.0)
    print(f"\n[3] Flat 402 (4th Floor):")
    print(f"    • {flat_402['summary']}")
    print(f"    • Vertical Range: Z = {flat_402['elevation_range']['z_bottom_meters']}m to {flat_402['elevation_range']['z_top_meters']}m")
    print(f"    • 3D Bounding Box: {flat_402['bounding_box_3d']}")
    
    # Step 4: Show the difference
    print("\n[4] Why This Solves The Problem:")
    print("    • In 2D: Flat 101 and Flat 402 have identical (X, Y) footprint -> Banks get confused!")
    print("    • In 3D: Flat 101 is at Z=[0m, 3m], Flat 402 is at Z=[9m, 12m] -> Zero overlap, completely unique!")
    print("=" * 60)
