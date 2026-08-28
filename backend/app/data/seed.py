"""
Seed demo data: 1 building with 5 floors + 1 basement in Mumbai (Bandra).

Creates:
- 1 parcel (MH-MUM-P001) - Bandra West Cadastral Survey
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

    # ── Building footprint (approx 30m × 20m rectangle in Bandra West) ─────
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
        "owner": "Government of Maharashtra (Revenue & Forest Dept)",
        "land_use": "mixed_residential_commercial",
        "area_sqm": 600.0,
        "address": "CTS No. 1042/A, Bandra Reclamation, Bandra West, Mumbai 400050",
        "cts_survey_no": "CTS-1042/A",
        "sub_registrar_office": "Bandra SRO-IV (Mumbai Suburban)",
    })

    # ── Building ────────────────────────────────────────────────────────────
    building_id = "B001"
    db.add_building(building_id, {
        "id": building_id,
        "building_name": "Bandra Heights (Parcel P001)",
        "ulpin_prefix": f"{parcel_ulpin}-{building_id}",
        "total_height": 15.0,
        "num_floors": 5,
        "num_basements": 1,
        "building_type": "mixed",
        "geometry": {"type": "Polygon", "coordinates": [footprint]},
        "ground_elevation": 0.0,
        "sanction_height": 18.0,
        "municipal_authority": "MCGM (Municipal Corporation of Greater Mumbai - H/West Ward)",
        "approval_order_no": "MCGM/CHE/CT/1492/2023",
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

    # ── Mock Indian Cadastral Profiles (Real names, Title status, Banks) ───
    unit_profiles = [
        # BF01 (Basement Parking)
        {"owner": "Society Common Stacker Bay A", "status": "Allotted", "area": 60.0},
        {"owner": "Smart EV Hub Ltd", "status": "Registered Lease", "area": 60.0},
        {"owner": "BESCOM Substation & Pump Room", "status": "Critical Infrastructure", "area": 80.0},

        # GF (Ground Floor Utility & Commercial)
        {"owner": "Society Maintenance & Solar Grid", "status": "Common Area", "area": 75.0},
        {"owner": "Oberoi Retail & Pharmacy", "status": "Clear Title", "area": 85.0},
        {"owner": "HDFC Bank ATM & Digital Branch", "status": "Registered Lease", "area": 85.0},

        # Floor 1 (Residential)
        {"owner": "Rajesh & Sunita Sharma", "status": "Clear Title", "area": 78.5},
        {"owner": "Priya Patel", "status": "Clear Title", "area": 78.5},
        {"owner": "Amit Vikram Singh", "status": "Mortgaged (SBI)", "area": 95.0},

        # Floor 2 (Residential)
        {"owner": "Sneha Reddy & K. Reddy", "status": "Clear Title", "area": 78.5},
        {"owner": "Vikramaditya Joshi", "status": "Mortgaged (HDFC Bank)", "area": 78.5},
        {"owner": "Ananya Gupta", "status": "Clear Title", "area": 95.0},

        # Floor 3 (Residential)
        {"owner": "Kiran & Shalini Desai", "status": "Clear Title", "area": 82.0},
        {"owner": "Meera Nair", "status": "Clear Title", "area": 82.0},
        {"owner": "Rohan Kapoor", "status": "Mortgaged (ICICI Bank)", "area": 105.0},

        # Floor 4 (Penthouses / Luxury Units)
        {"owner": "Deepa & Ramanathan Iyer", "status": "Clear Title", "area": 92.0},
        {"owner": "Suresh Kumar Deshmukh", "status": "Clear Title", "area": 92.0},
        {"owner": "Dr. Neha & Arjun Malhotra", "status": "Clear Title", "area": 115.0},
    ]

    unit_labels = {1: "A", 2: "B", 3: "C"}

    # ── Create all units ───────────────────────────────────────────────────
    profile_idx = 0
    for floor in floors:
        fn = floor["floor_no"]
        z_min = floor["z_min"]
        z_max = floor["z_max"]

        for i in range(1, 4):  # 3 units per floor
            unit_id = f"U{i:02d}"
            unit_type = get_unit_type(fn, i - 1)

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

            profile = unit_profiles[profile_idx % len(unit_profiles)]
            profile_idx += 1

            db.add_unit(ulpin, {
                "ulpin": ulpin,
                "building_id": building_id,
                "floor": fn,
                "unit": unit_labels[i],
                "geometry": {"type": "Polygon", "coordinates": [strips[i - 1]]},
                "owner": profile["owner"],
                "type": unit_type,
                "z_min": z_min,
                "z_max": z_max,
                "area_sqm": profile["area"],
                "status": profile["status"],
            })

    # ── Underground asset (Metro tunnel near the building) ─────────────────
    db.underground_assets.append({
        "name": "MMRDA Metro Line 3 (Aqua Line) Colaba-Bandra-SEEPZ",
        "type": "metro_tunnel",
        "geometry": {
            "type": "LineString",
            "coordinates": [[72.8365, 19.0590], [72.8378, 19.0600]],
        },
        "z_min": -22.0,
        "z_max": -16.0,
        "buffer_radius": 5.0,
        "operator": "MMRDA (Mumbai Metropolitan Region Development Authority)",
    })
