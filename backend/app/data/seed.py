"""
Seed demo data: 1 building with 5 floors + 1 basement in Mumbai (Bandra).

Creates:
- 1 parcel (MH-MUM-P001)
- 1 building (B001): GF + F01-F04 + BF01
- 18 residential/commercial/utility units + 3 parking units = 21 total
- 1 underground Metro tunnel asset
"""

from app.db.cadastre_db import CadastreDB
from app.core.ulpin import generate_ulpin


def seed_demo_data():
    """Populate the in-memory DB with one sample building for the frontend demo."""
    db = CadastreDB()

    # Skip if already seeded
    if db.parcels:
        return

    # ── Building footprint (approx 30m × 20m rectangle in Bandra) ──────────
    footprint = [
        [72.8370, 19.0596],
        [72.8373, 19.0596],
        [72.8373, 19.0598],
        [72.8370, 19.0598],
        [72.8370, 19.0596],
    ]

    # ── Parcel ──────────────────────────────────────────────────────────────
    parcel_ulpin = generate_ulpin("MH", "MUM", "P001")  # 2D ULPIN: MH-MUM-P001

    db.add_parcel(parcel_ulpin, {
        "ulpin": parcel_ulpin,
        "geometry": {"type": "Polygon", "coordinates": [footprint]},
        "owner": "State Government of Maharashtra",
        "land_use": "mixed",
        "area_sqm": 600.0,
        "address": "Plot 42, Bandra West, Mumbai 400050",
    })

    # ── Building ────────────────────────────────────────────────────────────
    building_id = "B001"
    db.add_building(building_id, {
        "id": building_id,
        "ulpin_prefix": f"{parcel_ulpin}-{building_id}",
        "total_height": 15.0,
        "num_floors": 5,
        "num_basements": 1,
        "building_type": "mixed",
        "geometry": {"type": "Polygon", "coordinates": [footprint]},
        "ground_elevation": 0.0,
    })

    # ── Unit strip geometries (split footprint into 3 vertical strips) ─────
    x_min, x_max = 72.8370, 72.8373
    y_min, y_max = 19.0596, 19.0598
    width = x_max - x_min
    x1 = x_min + width / 3
    x2 = x_min + 2 * width / 3

    strips = [
        [[x_min, y_min], [x1, y_min], [x1, y_max], [x_min, y_max], [x_min, y_min]],
        [[x1, y_min], [x2, y_min], [x2, y_max], [x1, y_max], [x1, y_min]],
        [[x2, y_min], [x_max, y_min], [x_max, y_max], [x2, y_max], [x2, y_min]],
    ]

    # ── Floor definitions ──────────────────────────────────────────────────
    floors = [
        {"floor_no": -1, "z_min": -3.0, "z_max": 0.0},
        {"floor_no":  0, "z_min":  0.0, "z_max": 3.0},
        {"floor_no":  1, "z_min":  3.0, "z_max": 6.0},
        {"floor_no":  2, "z_min":  6.0, "z_max": 9.0},
        {"floor_no":  3, "z_min":  9.0, "z_max": 12.0},
        {"floor_no":  4, "z_min": 12.0, "z_max": 15.0},
    ]

    # ── Unit type rules ────────────────────────────────────────────────────
    def get_unit_type(floor_no: int, unit_idx: int) -> str:
        if floor_no == -1:
            return "parking"
        if floor_no == 0:
            return "utility" if unit_idx == 0 else "commercial"
        return "residential"

    # ── Mock Indian owner names ────────────────────────────────────────────
    owners = [
        "Rajesh Sharma", "Priya Patel", "Amit Singh",
        "Sneha Reddy", "Vikram Joshi", "Ananya Gupta",
        "Kiran Desai", "Meera Nair", "Rohan Kapoor",
        "Deepa Iyer", "Suresh Kumar", "Neha Malhotra",
        "Arjun Rao", "Kavita Bhat", "Sanjay Mishra",
        "Pooja Pillai", "Manish Tiwari", "Ritu Agarwal",
    ]

    # Unit label mapping: U01->A, U02->B, U03->C
    unit_labels = {1: "A", 2: "B", 3: "C"}

    # ── Create all units ───────────────────────────────────────────────────
    owner_idx = 0
    for floor in floors:
        fn = floor["floor_no"]
        z_min = floor["z_min"]
        z_max = floor["z_max"]

        for i in range(1, 4):  # 3 units per floor
            unit_id = f"U{i:02d}"
            unit_type = get_unit_type(fn, i - 1)

            # Generate the full 3D ULPIN
            ulpin = generate_ulpin(
                state="MH",
                district="MUM",
                parcel_id="P001",
                building_id="B001",
                floor_no=fn,
                unit_no=unit_id,
                z_min=z_min,
                z_max=z_max,
            )

            owner = owners[owner_idx % len(owners)]
            owner_idx += 1

            db.add_unit(ulpin, {
                "ulpin": ulpin,
                "building_id": building_id,
                "floor": fn,
                "unit": unit_labels[i],
                "geometry": {"type": "Polygon", "coordinates": [strips[i - 1]]},
                "owner": owner,
                "type": unit_type,
                "z_min": z_min,
                "z_max": z_max,
            })

    # ── Underground asset (Metro tunnel near the building) ─────────────────
    db.underground_assets.append({
        "name": "DMRC Blue Line Tunnel Section 12",
        "type": "metro_tunnel",
        "geometry": {
            "type": "LineString",
            "coordinates": [[72.8365, 19.0590], [72.8378, 19.0600]],
        },
        "z_min": -20.0,
        "z_max": -15.0,
        "buffer_radius": 5.0,
        "operator": "DMRC",
    })
