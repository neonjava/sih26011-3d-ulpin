#!/usr/bin/env python3
"""
generate_cadastral_data.py
--------------------------
Generates realistic Indian 3D Cadastral Datasets, Building Sanction Plans,
and CERSAI Mortgage Records for the SIH26011 3D-ULPIN System.

Target Datasets:
1. backend/app/data/cadastral_registry.json
   - Mumbai: Sagar View Towers, Bandra West (CTS 1245/8, ULPIN MH27-045-8912345)
     * 14-story tower with Wing A & B (sanctioned 12 floors, Floors 13 & 14 phantom)
     * Flat 402 Wing A (SBI Mortgaged, HDFC Duplicate loan attack target)
   - Bengaluru: TechCorp Residency, Whitefield (BBMP Khata 891/2, ULPIN KA02-108-4421908)
     * 20-story IT corridor complex with 2-level EV basement parking and commercial air rights
   - Delhi: Surya Kiran Apartments, Dwarka Sector 12 (DDA Plot 44, ULPIN DL08-301-7719234)
     * 10-story tower with underground DMRC Blue Line metro tunnel easement at -12m depth

2. backend/app/data/sanctioned_plans.json
   - Official municipal approvals, FAR/FSI limits, height envelopes, setback bounds

3. backend/app/data/cersai_records.json
   - CERSAI security interests, active charges, duplicate collision alerts
"""

import json
import os

DATA_DIR = "PROJECT_ROOT/sih26011-3d-ulpin/backend/app/data"
os.makedirs(DATA_DIR, exist_ok=True)


def build_mumbai_cadastre():
    """Mumbai: Sagar View Towers, Bandra West (CTS 1245/8, ULPIN: MH27-045-8912345)"""
    base_ulpin = "MH27-045-8912345"
    base_lat, base_lng = 19.058420, 72.825640

    # Ground parcel polygon (approx 2,450 sq.m)
    ground_polygon = [
        [base_lng - 0.00025, base_lat - 0.00022],
        [base_lng + 0.00025, base_lat - 0.00022],
        [base_lng + 0.00025, base_lat + 0.00023],
        [base_lng - 0.00025, base_lat + 0.00023],
        [base_lng - 0.00025, base_lat - 0.00022]
    ]

    # Wing A and B footprints
    wing_a_footprint = [
        [base_lng - 0.00020, base_lat - 0.00018],
        [base_lng - 0.00002, base_lat - 0.00018],
        [base_lng - 0.00002, base_lat + 0.00018],
        [base_lng - 0.00020, base_lat + 0.00018],
        [base_lng - 0.00020, base_lat - 0.00018]
    ]

    wing_b_footprint = [
        [base_lng + 0.00002, base_lat - 0.00018],
        [base_lng + 0.00020, base_lat - 0.00018],
        [base_lng + 0.00020, base_lat + 0.00018],
        [base_lng + 0.00002, base_lat + 0.00018],
        [base_lng + 0.00002, base_lat - 0.00018]
    ]

    # Generate volumetric units for Wing A (14 floors: 1-12 sanctioned, 13-14 phantom)
    units_wing_a = []
    floor_height = 3.0  # meters
    stilt_height = 3.5  # stilt parking at ground level

    for floor in range(1, 15):
        z_min = round(stilt_height + (floor - 1) * floor_height, 2)
        z_max = round(z_min + floor_height, 2)
        is_phantom = floor > 12

        # 2 flats per floor: Flat X01 (West view) and Flat X02 (East/City view)
        unit_1_footprint = [
            [base_lng - 0.00020, base_lat - 0.00018],
            [base_lng - 0.00011, base_lat - 0.00018],
            [base_lng - 0.00011, base_lat + 0.00018],
            [base_lng - 0.00020, base_lat + 0.00018],
            [base_lng - 0.00020, base_lat - 0.00018]
        ]
        unit_2_footprint = [
            [base_lng - 0.00011, base_lat - 0.00018],
            [base_lng - 0.00002, base_lat - 0.00018],
            [base_lng - 0.00002, base_lat + 0.00018],
            [base_lng - 0.00011, base_lat + 0.00018],
            [base_lng - 0.00011, base_lat - 0.00018]
        ]

        unit_num_1 = f"{floor}01"
        unit_num_2 = f"{floor}02"
        ulpin_1 = f"{base_ulpin}-WIGA-FL{floor:02d}-U{unit_num_1}"
        ulpin_2 = f"{base_ulpin}-WIGA-FL{floor:02d}-U{unit_num_2}"

        # Special metadata for Flat 402
        if floor == 4:
            unit_1_meta = {
                "unit_id": unit_num_1,
                "unit_type": "Residential Apartment (2BHK)",
                "3d_ulpin": ulpin_1,
                "wing": "Wing A",
                "floor_number": floor,
                "z_min_meters": z_min,
                "z_max_meters": z_max,
                "height_thickness_meters": floor_height,
                "carpet_area_sqm": 72.50,
                "carpet_area_sqft": 780.40,
                "built_up_area_sqm": 86.00,
                "super_built_up_sqm": 94.25,
                "owner_details": {"primary_owner": f"Resident Owner Wing A - Flat {unit_num_1}"},
                "encumbrance_status": "CLEAR_TITLE",
                "is_sanctioned": True,
                "spatial_boundary": {"type": "Polygon", "coordinates": [unit_1_footprint]}
            }
            unit_2_meta = {
                "unit_id": unit_num_2,
                "unit_type": "Residential Apartment (3BHK)",
                "3d_ulpin": ulpin_2,
                "wing": "Wing A",
                "floor_number": floor,
                "z_min_meters": z_min,
                "z_max_meters": z_max,
                "height_thickness_meters": floor_height,
                "carpet_area_sqm": 88.50,
                "carpet_area_sqft": 952.60,
                "built_up_area_sqm": 104.20,
                "super_built_up_sqm": 115.05,
                "undivided_land_share_pct": 2.15,
                "dedicated_parking_slot": "Stilt Parking Slot P-14",
                "owner_details": {
                    "primary_owner": "Rajesh Kumar Sharma",
                    "co_owner": "Priya R. Sharma",
                    "registered_deed_no": "BDR-3/12458/2024",
                    "registration_date": "2024-03-15",
                    "sub_registrar_office": "SRO Bandra-3 (Andheri Taluka)"
                },
                "encumbrance_status": "MORTGAGED",
                "mortgage_details": {
                    "bank_name": "State Bank of India",
                    "branch": "Bandra West SME Branch",
                    "cersai_security_interest_id": "CERSAI-SBI-2024-88912",
                    "loan_account_no": "SBI-HL-39811029481",
                    "sanctioned_amount_inr": 17500000,
                    "outstanding_amount_inr": 16240000,
                    "charge_creation_date": "2024-03-18"
                },
                "fraud_alerts": [
                    {
                        "alert_code": "DUPLICATE_MORTGAGE_APPLICATION_ATTEMPT",
                        "severity": "CRITICAL",
                        "description": "Scammer 'Vikram Malhotra' attempted duplicate mortgage application at HDFC Bank (Application No. HDFC-APP-2024-88419) using forged chain of title deeds targeting this exact 3D-ULPIN.",
                        "flagged_timestamp": "2024-08-10T11:42:00+05:30",
                        "target_bank": "HDFC Bank Ltd (BKC Branch)",
                        "blocked_by_3d_ulpin": True
                    }
                ],
                "is_sanctioned": True,
                "spatial_boundary": {
                    "type": "Polygon",
                    "coordinates": [unit_2_footprint]
                }
            }
        elif is_phantom:
            # Phantom floor penthouse units (Floors 13 & 14)
            unit_1_meta = {
                "unit_id": unit_num_1,
                "unit_type": "Penthouse Suite (Duplex Lower)",
                "3d_ulpin": ulpin_1,
                "wing": "Wing A",
                "floor_number": floor,
                "z_min_meters": z_min,
                "z_max_meters": z_max,
                "height_thickness_meters": floor_height,
                "carpet_area_sqm": 125.40,
                "carpet_area_sqft": 1349.80,
                "built_up_area_sqm": 145.00,
                "super_built_up_sqm": 163.00,
                "is_sanctioned": False,
                "violation_type": "UNAUTHORIZED_VERTICAL_EXTENSION",
                "sanction_violation_details": {
                    "max_sanctioned_floors": 12,
                    "max_sanctioned_height_m": 42.00,
                    "unit_elevation_m": f"{z_min}m to {z_max}m (Exceeds 42.0m height cap)",
                    "mcgm_notice_issued": True,
                    "notice_no": "MCGM/KW/MRTP/2024/771"
                },
                "owner_details": {
                    "primary_owner": "Illegal Promoter / Unregistered Claim",
                    "registered_deed_no": "FORGED_DEED_ATTEMPT_2024",
                    "registration_status": "REJECTED_UNAUTHORIZED_FLOOR"
                },
                "encumbrance_status": "ILLEGAL_STRUCTURE",
                "spatial_boundary": {
                    "type": "Polygon",
                    "coordinates": [unit_1_footprint]
                }
            }
            unit_2_meta = {
                "unit_id": unit_num_2,
                "unit_type": "Penthouse Suite (Duplex Upper)" if floor == 14 else "Executive Apartment",
                "3d_ulpin": ulpin_2,
                "wing": "Wing A",
                "floor_number": floor,
                "z_min_meters": z_min,
                "z_max_meters": z_max,
                "height_thickness_meters": floor_height,
                "carpet_area_sqm": 125.40,
                "carpet_area_sqft": 1349.80,
                "built_up_area_sqm": 145.00,
                "super_built_up_sqm": 163.00,
                "is_sanctioned": False,
                "violation_type": "UNAUTHORIZED_VERTICAL_EXTENSION",
                "sanction_violation_details": {
                    "max_sanctioned_floors": 12,
                    "max_sanctioned_height_m": 42.00,
                    "unit_elevation_m": f"{z_min}m to {z_max}m (Exceeds 42.0m height cap)",
                    "mcgm_notice_issued": True,
                    "notice_no": "MCGM/KW/MRTP/2024/771"
                },
                "owner_details": {
                    "primary_owner": "Unsold Phantom Inventory (Builder Stock)",
                    "registered_deed_no": "UNAUTHORIZED",
                    "registration_status": "LOCKED_BY_CADASTRAL_ENGINE"
                },
                "encumbrance_status": "ILLEGAL_STRUCTURE",
                "spatial_boundary": {
                    "type": "Polygon",
                    "coordinates": [unit_2_footprint]
                }
            }
        else:
            unit_1_meta = {
                "unit_id": unit_num_1,
                "unit_type": "Residential Apartment (2BHK)",
                "3d_ulpin": ulpin_1,
                "wing": "Wing A",
                "floor_number": floor,
                "z_min_meters": z_min,
                "z_max_meters": z_max,
                "height_thickness_meters": floor_height,
                "carpet_area_sqm": 72.50,
                "carpet_area_sqft": 780.40,
                "built_up_area_sqm": 86.00,
                "super_built_up_sqm": 94.25,
                "owner_details": {"primary_owner": f"Resident Owner Wing A - Flat {unit_num_1}"},
                "encumbrance_status": "CLEAR_TITLE",
                "is_sanctioned": True,
                "spatial_boundary": {"type": "Polygon", "coordinates": [unit_1_footprint]}
            }
            unit_2_meta = {
                "unit_id": unit_num_2,
                "unit_type": "Residential Apartment (3BHK)",
                "3d_ulpin": ulpin_2,
                "wing": "Wing A",
                "floor_number": floor,
                "z_min_meters": z_min,
                "z_max_meters": z_max,
                "height_thickness_meters": floor_height,
                "carpet_area_sqm": 88.50,
                "carpet_area_sqft": 952.60,
                "built_up_area_sqm": 104.20,
                "super_built_up_sqm": 115.05,
                "owner_details": {"primary_owner": f"Resident Owner Wing A - Flat {unit_num_2}"},
                "encumbrance_status": "CLEAR_TITLE",
                "is_sanctioned": True,
                "spatial_boundary": {"type": "Polygon", "coordinates": [unit_2_footprint]}
            }

        units_wing_a.append(unit_1_meta)
        units_wing_a.append(unit_2_meta)

    # Wing B units (Floors 1 to 12 - all sanctioned)
    units_wing_b = []
    for floor in range(1, 13):
        z_min = round(stilt_height + (floor - 1) * floor_height, 2)
        z_max = round(z_min + floor_height, 2)
        unit_1_num = f"{floor}01"
        unit_2_num = f"{floor}02"
        units_wing_b.append({
            "unit_id": unit_1_num,
            "unit_type": "Residential Apartment (2BHK)",
            "3d_ulpin": f"{base_ulpin}-WIGB-FL{floor:02d}-U{unit_1_num}",
            "wing": "Wing B",
            "floor_number": floor,
            "z_min_meters": z_min,
            "z_max_meters": z_max,
            "carpet_area_sqm": 74.00,
            "is_sanctioned": True,
            "encumbrance_status": "CLEAR_TITLE",
            "spatial_boundary": {"type": "Polygon", "coordinates": [wing_b_footprint]}
        })
        units_wing_b.append({
            "unit_id": unit_2_num,
            "unit_type": "Residential Apartment (3BHK)",
            "3d_ulpin": f"{base_ulpin}-WIGB-FL{floor:02d}-U{unit_2_num}",
            "wing": "Wing B",
            "floor_number": floor,
            "z_min_meters": z_min,
            "z_max_meters": z_max,
            "carpet_area_sqm": 89.00,
            "is_sanctioned": True,
            "encumbrance_status": "CLEAR_TITLE",
            "spatial_boundary": {"type": "Polygon", "coordinates": [wing_b_footprint]}
        })

    return {
        "complex_id": "MUM-SVR-001",
        "complex_name": "Sagar View Towers",
        "city": "Mumbai",
        "state": "Maharashtra",
        "district": "Mumbai Suburban (27)",
        "taluka": "Andheri (045)",
        "village_locality": "Bandra West",
        "pin_code": "400050",
        "cadastral_identifiers": {
            "2d_ulpin": base_ulpin,
            "cts_number": "1245/8",
            "survey_number": "78/A",
            "hissa_number": "8",
            "ward": "H-West",
            "municipal_authority": "Municipal Corporation of Greater Mumbai (MCGM)",
            "rera_registration_number": "P51800001234"
        },
        "land_parcel": {
            "parcel_area_sqm": 2450.00,
            "parcel_area_sqft": 26371.80,
            "ground_elevation_msl_m": 6.00,
            "boundary_polygon": {
                "type": "Polygon",
                "coordinates": [ground_polygon]
            },
            "cardinal_boundaries": {
                "north": "CTS No. 1245/7 (Sea Breeze CHS)",
                "south": "18.30 Meter Wide Municipal D.P. Road",
                "east": "CTS No. 1245/9 (Private Residential Layout)",
                "west": "CTS No. 1245/6 & Bandra Bandstand Promenade"
            }
        },
        "building_structure": {
            "total_wings": 2,
            "wings": [
                {
                    "wing_name": "Wing A",
                    "sanctioned_floors": 12,
                    "actual_built_floors": 14,
                    "has_phantom_floors": True,
                    "phantom_floors": [13, 14],
                    "stilt_height_m": 3.50,
                    "total_height_actual_m": 49.00,
                    "sanctioned_height_limit_m": 42.00,
                    "footprint": {"type": "Polygon", "coordinates": [wing_a_footprint]},
                    "units": units_wing_a
                },
                {
                    "wing_name": "Wing B",
                    "sanctioned_floors": 12,
                    "actual_built_floors": 12,
                    "has_phantom_floors": False,
                    "phantom_floors": [],
                    "stilt_height_m": 3.50,
                    "total_height_actual_m": 42.00,
                    "sanctioned_height_limit_m": 42.00,
                    "footprint": {"type": "Polygon", "coordinates": [wing_b_footprint]},
                    "units": units_wing_b
                }
            ],
            "common_amenities_3d": [
                {
                    "amenity_name": "Ground Stilt Parking & Society Office",
                    "3d_ulpin": f"{base_ulpin}-CMN-STILT-01",
                    "z_min_meters": 0.00,
                    "z_max_meters": 3.50,
                    "area_sqm": 850.00
                },
                {
                    "amenity_name": "Rooftop Water Tank & Lift Machine Room (Sanctioned Level)",
                    "3d_ulpin": f"{base_ulpin}-CMN-ROOF-01",
                    "z_min_meters": 39.50,
                    "z_max_meters": 42.00,
                    "area_sqm": 220.00
                }
            ]
        },
        "cadastral_status": "CONSTRUCTION_VIOLATION_DETECTED",
        "spatial_integrity_flags": {
            "phantom_floor_count": 2,
            "unauthorized_bua_sqm": 1012.00,
            "active_mortgage_collision": True,
            "collision_target_ulpin": f"{base_ulpin}-WIGA-FL04-U402"
        }
    }


def build_bengaluru_cadastre():
    """Bengaluru: TechCorp Residency, Whitefield (BBMP Khata 891/2, ULPIN: KA02-108-4421908)"""
    base_ulpin = "KA02-108-4421908"
    base_lat, base_lng = 12.971500, 77.749500

    # Ground parcel polygon (approx 6,800 sq.m)
    ground_polygon = [
        [base_lng - 0.00045, base_lat - 0.00040],
        [base_lng + 0.00045, base_lat - 0.00040],
        [base_lng + 0.00045, base_lat + 0.00040],
        [base_lng - 0.00045, base_lat + 0.00040],
        [base_lng - 0.00045, base_lat - 0.00040]
    ]

    building_footprint = [
        [base_lng - 0.00030, base_lat - 0.00028],
        [base_lng + 0.00030, base_lat - 0.00028],
        [base_lng + 0.00030, base_lat + 0.00028],
        [base_lng - 0.00030, base_lat + 0.00028],
        [base_lng - 0.00030, base_lat - 0.00028]
    ]

    # Basements (B2 and B1)
    basement_units = []
    # B2: EV Fast Charging & Automated Parking (-6.0m to -3.0m)
    for bay in range(1, 21):
        basement_units.append({
            "unit_id": f"B2-EV-{bay:02d}",
            "unit_type": "Underground EV Charging Slot & Smart Stacking Bay",
            "3d_ulpin": f"{base_ulpin}-BS02-EV{bay:02d}",
            "level": "Basement Level 2 (B2)",
            "z_min_meters": -6.00,
            "z_max_meters": -3.00,
            "area_sqm": 25.00,
            "power_capacity_kw": 22.0,
            "encumbrance_status": "MORTGAGED" if bay <= 5 else "CLEAR_TITLE",
            "cersai_ref": "CERSAI-BOB-2024-33201" if bay <= 5 else None,
            "is_sanctioned": True
        })

    # B1: Resident & Visitor Parking (-3.0m to 0.0m)
    for bay in range(1, 31):
        basement_units.append({
            "unit_id": f"B1-PKG-{bay:02d}",
            "unit_type": "Basement Standard Parking Slot",
            "3d_ulpin": f"{base_ulpin}-BS01-P{bay:02d}",
            "level": "Basement Level 1 (B1)",
            "z_min_meters": -3.00,
            "z_max_meters": 0.00,
            "area_sqm": 18.50,
            "is_sanctioned": True
        })

    # Ground & 1st Floor Commercial Units (0.0m to +7.0m)
    commercial_units = [
        {
            "unit_id": "COM-G01",
            "unit_name": "Anchor Retail Superstore",
            "3d_ulpin": f"{base_ulpin}-COM-G01",
            "floor": "Ground Floor",
            "z_min_meters": 0.00,
            "z_max_meters": 3.50,
            "carpet_area_sqm": 350.00,
            "encumbrance_status": "CLEAR_TITLE",
            "is_sanctioned": True
        },
        {
            "unit_id": "COM-G02",
            "unit_name": "Fintech & Banking Experience Center",
            "3d_ulpin": f"{base_ulpin}-COM-G02",
            "floor": "Ground Floor",
            "z_min_meters": 0.00,
            "z_max_meters": 3.50,
            "carpet_area_sqm": 220.00,
            "encumbrance_status": "MORTGAGED",
            "mortgage_details": {
                "bank_name": "ICICI Bank Ltd",
                "cersai_security_interest_id": "CERSAI-ICICI-2023-45129",
                "loan_account_no": "ICICI-BL-0984512033",
                "borrower": "CloudNxt IT Solutions Pvt Ltd",
                "sanctioned_amount_inr": 35000000,
                "outstanding_amount_inr": 29500000
            },
            "is_sanctioned": True
        },
        {
            "unit_id": "COM-F101",
            "unit_name": "Tech Incubator & Co-Working Hub",
            "3d_ulpin": f"{base_ulpin}-COM-F101",
            "floor": "1st Floor",
            "z_min_meters": 3.50,
            "z_max_meters": 7.00,
            "carpet_area_sqm": 480.00,
            "encumbrance_status": "CLEAR_TITLE",
            "is_sanctioned": True
        }
    ]

    # Residential Floors 2 to 20 (7.0m to 67.0m)
    residential_units = []
    floor_height = 3.0
    for fl in range(2, 21):
        z_min = round(7.00 + (fl - 2) * floor_height, 2)
        z_max = round(z_min + floor_height, 2)
        for u in range(1, 5):
            uid = f"{fl:02d}{u:02d}"
            residential_units.append({
                "unit_id": uid,
                "unit_type": f"Condominium {3 if u in [1, 4] else 2}BHK",
                "3d_ulpin": f"{base_ulpin}-RES-FL{fl:02d}-U{uid}",
                "floor_number": fl,
                "z_min_meters": z_min,
                "z_max_meters": z_max,
                "carpet_area_sqm": 112.50 if u in [1, 4] else 84.20,
                "is_sanctioned": True,
                "encumbrance_status": "CLEAR_TITLE"
            })

    # Rooftop Air Rights (67.0m to 72.0m)
    air_rights = [
        {
            "right_id": "AIR-01-SOLAR",
            "right_type": "Commercial Solar Photovoltaic Grid Rights",
            "3d_ulpin": f"{base_ulpin}-AIR01-SOLAR",
            "z_min_meters": 67.00,
            "z_max_meters": 70.00,
            "area_sqm": 1200.00,
            "installed_capacity_kwp": 150,
            "holder": "SunGrid Energy Power Developer LLP",
            "validity_years": 25,
            "is_sanctioned": True
        },
        {
            "right_id": "AIR-02-SKYLOU",
            "right_type": "Rooftop Sky Lounge & Heli-Observation Air Rights",
            "3d_ulpin": f"{base_ulpin}-AIR02-SKYLOU",
            "z_min_meters": 70.00,
            "z_max_meters": 73.00,
            "area_sqm": 450.00,
            "holder": "TechCorp Hospitality Club",
            "is_sanctioned": True
        }
    ]

    return {
        "complex_id": "BLR-TCR-002",
        "complex_name": "TechCorp Residency",
        "city": "Bengaluru",
        "state": "Karnataka",
        "district": "Bengaluru Urban (02)",
        "taluka": "Bengaluru East (108)",
        "hobli": "K.R. Puram",
        "village_locality": "Whitefield (IT Corridor)",
        "pin_code": "560066",
        "cadastral_identifiers": {
            "2d_ulpin": base_ulpin,
            "bbmp_khata_number": "891/2",
            "pid_number": "084-W0192-44",
            "survey_number": "142/1B",
            "bbmp_ward": "Ward 84 (Hagadur)",
            "municipal_authority": "Bruhat Bengaluru Mahanagara Palike (BBMP) / BDA",
            "rera_registration_number": "PRM/KA/RERA/1251/446/PR/210818/004289"
        },
        "land_parcel": {
            "parcel_area_sqm": 6800.00,
            "parcel_area_sqft": 73194.50,
            "ground_elevation_msl_m": 890.00,
            "boundary_polygon": {
                "type": "Polygon",
                "coordinates": [ground_polygon]
            },
            "cardinal_boundaries": {
                "north": "45-Meter Main International Tech Park Road (ITPL Main Rd)",
                "south": "Sy No. 142/2 Private Tech Park",
                "east": "Nallurahalli Lake Buffer Greens",
                "west": "Sy No. 141/3 Commercial Complex"
            }
        },
        "building_structure": {
            "total_floors_above_ground": 20,
            "total_basement_levels": 2,
            "total_height_m": 68.00,
            "deepest_basement_level_m": -6.00,
            "sanctioned_height_limit_m": 68.00,
            "has_phantom_floors": False,
            "footprint": {"type": "Polygon", "coordinates": [building_footprint]},
            "basement_infrastructure": basement_units,
            "commercial_units": commercial_units,
            "residential_units": residential_units,
            "air_rights_parcels": air_rights
        },
        "cadastral_status": "FULLY_COMPLIANT_3D_STRATIFIED",
        "spatial_integrity_flags": {
            "phantom_floor_count": 0,
            "unauthorized_bua_sqm": 0.00,
            "active_mortgage_collision": False
        }
    }


def build_delhi_cadastre():
    """Delhi: Surya Kiran Apartments, Dwarka Sector 12 (DDA Plot 44, ULPIN: DL08-301-7719234)"""
    base_ulpin = "DL08-301-7719234"
    base_lat, base_lng = 28.591200, 77.041800

    # Ground parcel polygon (approx 3,500 sq.m)
    ground_polygon = [
        [base_lng - 0.00030, base_lat - 0.00025],
        [base_lng + 0.00030, base_lat - 0.00025],
        [base_lng + 0.00030, base_lat + 0.00025],
        [base_lng - 0.00030, base_lat + 0.00025],
        [base_lng - 0.00030, base_lat - 0.00025]
    ]

    building_footprint = [
        [base_lng - 0.00022, base_lat - 0.00018],
        [base_lng + 0.00022, base_lat - 0.00018],
        [base_lng + 0.00022, base_lat + 0.00018],
        [base_lng - 0.00022, base_lat + 0.00018],
        [base_lng - 0.00022, base_lat - 0.00018]
    ]

    # Underground DMRC Tunnel Easement corridor in South quadrant
    dmrc_easement_polygon = [
        [base_lng - 0.00030, base_lat - 0.00025],
        [base_lng + 0.00030, base_lat - 0.00025],
        [base_lng + 0.00030, base_lat - 0.00008],
        [base_lng - 0.00030, base_lat - 0.00008],
        [base_lng - 0.00030, base_lat - 0.00025]
    ]

    # Residential units 10 floors (G + 10)
    floor_height = 3.3
    residential_units = []
    for fl in range(1, 11):
        z_min = round((fl - 1) * floor_height, 2)
        z_max = round(z_min + floor_height, 2)
        for u in range(1, 5):
            uid = f"{fl:02d}{u:02d}"
            ulpin = f"{base_ulpin}-FL{fl:02d}-U{uid}"
            is_pnb_mortgage = (fl == 6 and u == 2)
            residential_units.append({
                "unit_id": uid,
                "unit_type": "3BHK HIG Apartment",
                "3d_ulpin": ulpin,
                "floor_number": fl,
                "z_min_meters": z_min,
                "z_max_meters": z_max,
                "carpet_area_sqm": 94.80,
                "carpet_area_sqft": 1020.40,
                "built_up_area_sqm": 110.50,
                "is_sanctioned": True,
                "encumbrance_status": "MORTGAGED" if is_pnb_mortgage else "CLEAR_TITLE",
                "mortgage_details": {
                    "bank_name": "Punjab National Bank",
                    "branch": "Dwarka Sector 12 Branch",
                    "cersai_security_interest_id": "CERSAI-PNB-2024-11892",
                    "loan_account_no": "PNB-HL-1092837465",
                    "borrower": "Amit Kumar Verma & Sunita Verma",
                    "sanctioned_amount_inr": 9500000,
                    "outstanding_amount_inr": 8820000,
                    "charge_creation_date": "2024-01-22"
                } if is_pnb_mortgage else None
            })

    # Subsurface Easement parcel for DMRC Metro Tunnel
    subsurface_easements = [
        {
            "easement_id": "DMRC-BLUE-LINE-TNL-08",
            "easement_title": "DMRC Underground Metro Tunnel & Safety Envelope",
            "3d_ulpin": f"{base_ulpin}-SUB01-DMRC-TNL",
            "easement_holder": "Delhi Metro Rail Corporation Ltd. (DMRC)",
            "statutory_act": "Metro Railways (Construction of Works) Act, 1978 & DMRC Easement Deed No. DEL/DDA/2006/4481",
            "depth_profile": {
                "tunnel_crown_depth_m": -9.00,
                "tunnel_invert_depth_m": -15.00,
                "nominal_centerline_depth_m": -12.00,
                "protection_buffer_top_m": -6.00,
                "protection_buffer_bottom_m": -18.00,
                "z_min_meters": -18.00,
                "z_max_meters": -6.00
            },
            "subsurface_polygon": {
                "type": "Polygon",
                "coordinates": [dmrc_easement_polygon]
            },
            "vertical_construction_restrictions": {
                "no_piling_depth_threshold_m": -6.00,
                "prohibited_activities": [
                    "Borewell drilling below -6.0m",
                    "Heavy dynamic compaction",
                    "Deep driven pile foundations within 15m radius of tunnel axis",
                    "Subterranean basement excavation into buffer zone"
                ],
                "permitted_foundation": "Engineered cantilever shallow raft slab resting at maximum depth -4.50m"
            },
            "clash_detection_status": "MONITORED_ACTIVE_EASEMENT",
            "is_sanctioned": True
        }
    ]

    return {
        "complex_id": "DEL-DWK-003",
        "complex_name": "Surya Kiran Apartments (DDA Shanti Enclave)",
        "city": "New Delhi",
        "state": "Delhi",
        "district": "South West Delhi (08)",
        "sub_division": "Dwarka (301)",
        "village_locality": "Kakrola / Sector 12 Dwarka",
        "pin_code": "110078",
        "cadastral_identifiers": {
            "2d_ulpin": base_ulpin,
            "dda_plot_number": "Plot No. 44, Pocket 6",
            "khasra_number": "182/4",
            "sector": "Sector 12 Dwarka",
            "municipal_authority": "Delhi Development Authority (DDA) / MCD",
            "rera_registration_number": "DLRERA2019P0028"
        },
        "land_parcel": {
            "parcel_area_sqm": 3500.00,
            "parcel_area_sqft": 37673.70,
            "ground_elevation_msl_m": 215.00,
            "boundary_polygon": {
                "type": "Polygon",
                "coordinates": [ground_polygon]
            },
            "cardinal_boundaries": {
                "north": "24-Meter Sector Dividing Road",
                "south": "DMRC Metro Blue Line Alignment Corridor & Green Belt",
                "east": "DDA Plot No. 45 (Cooperative Group Housing)",
                "west": "DDA Community Park & Master Plan Road"
            }
        },
        "building_structure": {
            "total_floors_above_ground": 10,
            "total_basement_levels": 0,
            "foundation_type": "Compensated Shallow Raft Slab (South) & Friction Piles (North)",
            "total_height_m": 33.00,
            "sanctioned_height_limit_m": 35.00,
            "has_phantom_floors": False,
            "footprint": {"type": "Polygon", "coordinates": [building_footprint]},
            "residential_units": residential_units
        },
        "subsurface_easements": subsurface_easements,
        "cadastral_status": "EASEMENT_PROTECTED_STRUCTURE",
        "spatial_integrity_flags": {
            "subsurface_tunnel_easement_active": True,
            "metro_easement_clash_risk": "HIGH_MONITORING",
            "piling_depth_restricted": True
        }
    }


def generate_all():
    mumbai = build_mumbai_cadastre()
    bengaluru = build_bengaluru_cadastre()
    delhi = build_delhi_cadastre()

    # 1. cadastral_registry.json
    cadastral_registry = {
        "metadata": {
            "system": "National 3D-ULPIN Spatial Cadastre Engine",
            "standard": "ISO 19152 LADM / India 3D Cadastral Framework v2.1",
            "generation_timestamp": "2026-08-26T23:37:55+05:30",
            "total_complexes": 3,
            "jurisdictions": ["Maharashtra (MCGM)", "Karnataka (BBMP)", "Delhi (DDA)"]
        },
        "complexes": [mumbai, bengaluru, delhi],
        "geojson_feature_collection": {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": mumbai["land_parcel"]["boundary_polygon"],
                    "properties": {
                        "complex_id": mumbai["complex_id"],
                        "name": mumbai["complex_name"],
                        "2d_ulpin": mumbai["cadastral_identifiers"]["2d_ulpin"],
                        "city": mumbai["city"],
                        "status": mumbai["cadastral_status"]
                    }
                },
                {
                    "type": "Feature",
                    "geometry": bengaluru["land_parcel"]["boundary_polygon"],
                    "properties": {
                        "complex_id": bengaluru["complex_id"],
                        "name": bengaluru["complex_name"],
                        "2d_ulpin": bengaluru["cadastral_identifiers"]["2d_ulpin"],
                        "city": bengaluru["city"],
                        "status": bengaluru["cadastral_status"]
                    }
                },
                {
                    "type": "Feature",
                    "geometry": delhi["land_parcel"]["boundary_polygon"],
                    "properties": {
                        "complex_id": delhi["complex_id"],
                        "name": delhi["complex_name"],
                        "2d_ulpin": delhi["cadastral_identifiers"]["2d_ulpin"],
                        "city": delhi["city"],
                        "status": delhi["cadastral_status"]
                    }
                },
                {
                    "type": "Feature",
                    "geometry": delhi["subsurface_easements"][0]["subsurface_polygon"],
                    "properties": {
                        "feature_type": "Subsurface_Metro_Easement",
                        "3d_ulpin": delhi["subsurface_easements"][0]["3d_ulpin"],
                        "z_min": -18.00,
                        "z_max": -6.00,
                        "holder": "DMRC"
                    }
                }
            ]
        }
    }

    registry_path = os.path.join(DATA_DIR, "cadastral_registry.json")
    with open(registry_path, "w", encoding="utf-8") as f:
        json.dump(cadastral_registry, f, indent=2)
    print(f"[OK] Generated: {registry_path} ({os.path.getsize(registry_path)} bytes)")

    # 2. sanctioned_plans.json
    sanctioned_plans = {
        "metadata": {
            "title": "Municipal Building Sanction Plans & Permissible Envelope Registry",
            "version": "2026.1",
            "last_updated": "2026-08-26T23:37:55+05:30"
        },
        "sanctions": [
            {
                "plan_id": "SANCT-MUM-2021-0489",
                "complex_id": "MUM-SVR-001",
                "complex_name": "Sagar View Towers",
                "city": "Mumbai",
                "municipal_authority": "Municipal Corporation of Greater Mumbai (MCGM) - Building Proposal Department (Western Suburbs)",
                "approval_number": "CE/4502/WS/AH dated 14/11/2021",
                "commencement_certificate_no": "CC/2021/WS/3902",
                "land_2d_ulpin": "MH27-045-8912345",
                "cts_no": "1245/8",
                "sanctioned_parameters": {
                    "permissible_fsi": 2.50,
                    "sanctioned_built_up_area_sqm": 6125.00,
                    "max_permissible_floors": 12,
                    "floor_configuration": "Ground Stilt + 12 Residential Upper Floors",
                    "max_sanctioned_height_meters": 42.00,
                    "stilt_parking_height_meters": 3.50,
                    "typical_floor_height_meters": 3.00,
                    "basement_permitted": False,
                    "setbacks_meters": {
                        "front_road_setback": 6.00,
                        "rear_setback": 4.50,
                        "side_setback_1": 4.50,
                        "side_setback_2": 4.50
                    }
                },
                "compliance_audit": {
                    "actual_constructed_floors": 14,
                    "actual_height_meters": 49.00,
                    "actual_consumed_built_up_sqm": 7088.00,
                    "fsi_consumed": 2.89,
                    "unauthorized_excess_sqm": 963.00,
                    "violation_severity": "ILLEGAL_PHANTOM_FLOORS",
                    "phantom_floors": [13, 14],
                    "action_status": "STOP_WORK_AND_DEMOLITION_NOTICE_UNDER_MRTP_SEC_53"
                }
            },
            {
                "plan_id": "SANCT-BLR-2022-1102",
                "complex_id": "BLR-TCR-002",
                "complex_name": "TechCorp Residency",
                "city": "Bengaluru",
                "municipal_authority": "Bruhat Bengaluru Mahanagara Palike (BBMP) - Town Planning Department",
                "approval_number": "BBMP/ADDL.DIR/JDTP/LP-891-2/2022-23",
                "commencement_certificate_no": "BBMP/CC/2022/8814",
                "land_2d_ulpin": "KA02-108-4421908",
                "bbmp_khata_no": "891/2",
                "sanctioned_parameters": {
                    "permissible_far": 3.25,
                    "sanctioned_built_up_area_sqm": 22100.00,
                    "max_permissible_floors": 20,
                    "floor_configuration": "2 Basements (B2, B1) + Ground Retail + 1st Floor Commercial + Floors 2 to 20 Residential + Rooftop Solar",
                    "max_sanctioned_height_meters": 68.00,
                    "max_basement_depth_meters": -7.50,
                    "setbacks_meters": {
                        "front_road_setback": 12.00,
                        "rear_setback": 8.00,
                        "side_setback_1": 8.00,
                        "side_setback_2": 8.00
                    }
                },
                "compliance_audit": {
                    "actual_constructed_floors": 20,
                    "actual_height_meters": 68.00,
                    "actual_consumed_built_up_sqm": 21850.00,
                    "far_consumed": 3.21,
                    "unauthorized_excess_sqm": 0.00,
                    "violation_severity": "NONE_COMPLIANT",
                    "phantom_floors": [],
                    "action_status": "OCCUPANCY_CERTIFICATE_ISSUED"
                }
            },
            {
                "plan_id": "SANCT-DEL-2020-0671",
                "complex_id": "DEL-DWK-003",
                "complex_name": "Surya Kiran Apartments",
                "city": "New Delhi",
                "municipal_authority": "Delhi Development Authority (DDA) - Building Section",
                "approval_number": "DDA/Bldg/Dwarka-Sec12/P44/2020/671",
                "commencement_certificate_no": "DDA/CC/2020/419",
                "land_2d_ulpin": "DL08-301-7719234",
                "dda_plot_no": "Plot No. 44, Pocket 6, Sector 12 Dwarka",
                "sanctioned_parameters": {
                    "permissible_far": 2.00,
                    "sanctioned_built_up_area_sqm": 7000.00,
                    "max_permissible_floors": 10,
                    "floor_configuration": "Ground + 10 Residential Floors",
                    "max_sanctioned_height_meters": 35.00,
                    "basement_permitted": False,
                    "subsurface_condition": "DMRC Blue Line underground tunnel alignment in South sector. No excavation or foundation piles allowed below -6.00m MSL in South 22m corridor.",
                    "setbacks_meters": {
                        "front_road_setback": 9.00,
                        "rear_setback": 6.00,
                        "side_setback_1": 5.00,
                        "side_setback_2": 5.00
                    }
                },
                "compliance_audit": {
                    "actual_constructed_floors": 10,
                    "actual_height_meters": 33.00,
                    "actual_consumed_built_up_sqm": 6850.00,
                    "far_consumed": 1.95,
                    "unauthorized_excess_sqm": 0.00,
                    "violation_severity": "NONE_COMPLIANT",
                    "phantom_floors": [],
                    "action_status": "OCCUPANCY_CERTIFICATE_ISSUED_WITH_DMRC_NOC"
                }
            }
        ]
    }

    sanctions_path = os.path.join(DATA_DIR, "sanctioned_plans.json")
    with open(sanctions_path, "w", encoding="utf-8") as f:
        json.dump(sanctioned_plans, f, indent=2)
    print(f"[OK] Generated: {sanctions_path} ({os.path.getsize(sanctions_path)} bytes)")

    # 3. cersai_records.json
    cersai_records = {
        "metadata": {
            "registry": "Central Registry of Securitisation Asset Reconstruction and Security Interest of India (CERSAI)",
            "system_module": "3D-ULPIN Real-Time Asset Encumbrance & Mortgage Validation Engine",
            "last_synced": "2026-08-26T23:37:55+05:30",
            "total_records": 5
        },
        "security_interests": [
            {
                "cersai_security_interest_id": "CERSAI-SBI-2024-88912",
                "asset_category": "Immovable Property - Residential Flat",
                "target_3d_ulpin": "MH27-045-8912345-WIGA-FL04-U402",
                "base_land_2d_ulpin": "MH27-045-8912345",
                "cadastral_reference": "Flat No. 402, 4th Floor, Wing A, Sagar View Towers, CTS No. 1245/8, Bandra West, Mumbai 400050",
                "floor_elevation_envelope": {
                    "z_min_m": 13.50,
                    "z_max_m": 16.50
                },
                "lender_details": {
                    "financial_institution": "State Bank of India",
                    "branch_code": "00481",
                    "branch_name": "Bandra West SME Branch, Mumbai",
                    "ifsc_code": "SBIN0000481"
                },
                "loan_account_no": "SBI-HL-39811029481",
                "loan_type": "Individual Housing Term Loan",
                "borrower_details": {
                    "primary_borrower": "Rajesh Kumar Sharma",
                    "co_borrower": "Priya R. Sharma",
                    "masked_pan": "ABCPS****K",
                    "ckyc_identifier_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                },
                "financial_terms": {
                    "sanctioned_limit_inr": 17500000.00,
                    "current_outstanding_inr": 16240000.00,
                    "rate_of_interest_pct": 8.50,
                    "tenure_months": 240,
                    "equated_monthly_installment_inr": 151874.00
                },
                "mortgage_creation": {
                    "type_of_mortgage": "Equitable Mortgage by Deposit of Title Deeds",
                    "date_of_creation": "2024-03-18",
                    "date_of_cersai_filing": "2024-03-20",
                    "original_deed_number": "BDR-3/12458/2024",
                    "sro_registration_office": "SRO Bandra-3 (Andheri Taluka)"
                },
                "charge_status": "ACTIVE_REGISTERED_MORTGAGE"
            },
            {
                "cersai_security_interest_id": "FLAGGED-HDFC-APP-2024-99104",
                "asset_category": "Immovable Property - Residential Flat (FRAUD ATTEMPT)",
                "target_3d_ulpin": "MH27-045-8912345-WIGA-FL04-U402",
                "base_land_2d_ulpin": "MH27-045-8912345",
                "cadastral_reference": "Flat No. 402, 4th Floor, Wing A, Sagar View Towers, CTS No. 1245/8, Bandra West, Mumbai 400050",
                "floor_elevation_envelope": {
                    "z_min_m": 13.50,
                    "z_max_m": 16.50
                },
                "lender_details": {
                    "financial_institution": "HDFC Bank Ltd",
                    "branch_code": "HDFC000124",
                    "branch_name": "Bandra Kurla Complex (BKC) Branch, Mumbai",
                    "ifsc_code": "HDFC0000124"
                },
                "loan_account_no": "HDFC-APP-2024-88419",
                "loan_type": "Home Equity Loan (Duplicate Fraud Attempt)",
                "borrower_details": {
                    "primary_borrower": "Vikram Malhotra",
                    "co_borrower": "None",
                    "masked_pan": "BKZPM****J",
                    "ckyc_identifier_hash": "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4"
                },
                "financial_terms": {
                    "sanctioned_limit_inr": 18000000.00,
                    "current_outstanding_inr": 0.00,
                    "rate_of_interest_pct": 8.75,
                    "tenure_months": 180,
                    "equated_monthly_installment_inr": 180210.00
                },
                "mortgage_creation": {
                    "type_of_mortgage": "Attempted Equitable Mortgage with Forged Paper Chain",
                    "date_of_creation": "2024-08-10",
                    "date_of_cersai_filing": "2024-08-10 (REJECTED/BLOCKED)",
                    "original_deed_number": "FORGED-BDR-3/9912/2024 (COUNTERFEIT)",
                    "sro_registration_office": "SRO Bandra-3"
                },
                "charge_status": "BLOCKED_DUPLICATE_COLLISION",
                "collision_details": {
                    "conflicting_charge_id": "CERSAI-SBI-2024-88912",
                    "conflicting_lender": "State Bank of India",
                    "conflicting_owner": "Rajesh Kumar Sharma & Priya R. Sharma",
                    "root_cause": "Double mortgage fraud attempted on same 3D spatial voxel [z: 13.5m - 16.5m] at CTS 1245/8.",
                    "mitigation_action": "3D-ULPIN Cadastral Engine rejected charge registration and alerted Indian Cyber Crime Coordination Centre (I4C) & HDFC Risk Team."
                }
            },
            {
                "cersai_security_interest_id": "CERSAI-ICICI-2023-45129",
                "asset_category": "Immovable Property - Commercial Retail Office",
                "target_3d_ulpin": "KA02-108-4421908-COM-G02",
                "base_land_2d_ulpin": "KA02-108-4421908",
                "cadastral_reference": "Commercial Unit G-02, Ground Floor, TechCorp Residency, BBMP Khata 891/2, Whitefield, Bengaluru 560066",
                "floor_elevation_envelope": {
                    "z_min_m": 0.00,
                    "z_max_m": 3.50
                },
                "lender_details": {
                    "financial_institution": "ICICI Bank Ltd",
                    "branch_code": "0042",
                    "branch_name": "Indiranagar SME Hub, Bengaluru",
                    "ifsc_code": "ICIC0000042"
                },
                "loan_account_no": "ICICI-BL-0984512033",
                "loan_type": "Commercial Property Term Loan",
                "borrower_details": {
                    "primary_borrower": "CloudNxt IT Solutions Pvt Ltd (Rep by Dir: Anand Swaminathan)",
                    "masked_pan": "AAACC****D",
                    "ckyc_identifier_hash": "2c624232cdd221771294dfbb310aca000a0df6ec9b5feb9ebb95ab83214574f2"
                },
                "financial_terms": {
                    "sanctioned_limit_inr": 35000000.00,
                    "current_outstanding_inr": 29500000.00,
                    "rate_of_interest_pct": 9.15,
                    "tenure_months": 120,
                    "equated_monthly_installment_inr": 446720.00
                },
                "mortgage_creation": {
                    "type_of_mortgage": "Registered Mortgage",
                    "date_of_creation": "2023-11-12",
                    "date_of_cersai_filing": "2023-11-15",
                    "original_deed_number": "SHV-1-08914-2023-24",
                    "sro_registration_office": "SRO Shivajinagar / K.R. Puram Bengaluru"
                },
                "charge_status": "ACTIVE_REGISTERED_MORTGAGE"
            },
            {
                "cersai_security_interest_id": "CERSAI-PNB-2024-11892",
                "asset_category": "Immovable Property - Residential Flat",
                "target_3d_ulpin": "DL08-301-7719234-FL06-U602",
                "base_land_2d_ulpin": "DL08-301-7719234",
                "cadastral_reference": "Flat No. 602, 6th Floor, Surya Kiran Apartments, Plot 44 Pocket 6, Sector 12 Dwarka, New Delhi 110078",
                "floor_elevation_envelope": {
                    "z_min_m": 16.50,
                    "z_max_m": 19.80
                },
                "lender_details": {
                    "financial_institution": "Punjab National Bank",
                    "branch_code": "1092",
                    "branch_name": "Dwarka Sector 12 Branch, New Delhi",
                    "ifsc_code": "PUNB0109200"
                },
                "loan_account_no": "PNB-HL-1092837465",
                "loan_type": "Housing Loan Scheme",
                "borrower_details": {
                    "primary_borrower": "Amit Kumar Verma",
                    "co_borrower": "Sunita Verma",
                    "masked_pan": "AEEPV****M",
                    "ckyc_identifier_hash": "11a527c93d4a04eb003b0f547041345ac4e089ff641540f823b63a8d097d14c4"
                },
                "financial_terms": {
                    "sanctioned_limit_inr": 9500000.00,
                    "current_outstanding_inr": 8820000.00,
                    "rate_of_interest_pct": 8.40,
                    "tenure_months": 240,
                    "equated_monthly_installment_inr": 81890.00
                },
                "mortgage_creation": {
                    "type_of_mortgage": "Equitable Mortgage",
                    "date_of_creation": "2024-01-22",
                    "date_of_cersai_filing": "2024-01-25",
                    "original_deed_number": "SR-IX/Dwarka/4412/2024",
                    "sro_registration_office": "Sub-Registrar IX Kapashera / Dwarka"
                },
                "charge_status": "ACTIVE_REGISTERED_MORTGAGE"
            },
            {
                "cersai_security_interest_id": "CERSAI-BOB-2024-33201",
                "asset_category": "Immovable Property - Underground EV Charging Infrastructure Space",
                "target_3d_ulpin": "KA02-108-4421908-BS02-EV01",
                "base_land_2d_ulpin": "KA02-108-4421908",
                "cadastral_reference": "EV Charging Bays 01 to 05, Basement Level 2 (B2), TechCorp Residency, Whitefield, Bengaluru 560066",
                "floor_elevation_envelope": {
                    "z_min_m": -6.00,
                    "z_max_m": -3.00
                },
                "lender_details": {
                    "financial_institution": "Bank of Baroda",
                    "branch_code": "BOB-WFD",
                    "branch_name": "Whitefield Corporate Banking Branch, Bengaluru",
                    "ifsc_code": "BARB0WHITEF"
                },
                "loan_account_no": "BOB-INFRA-88273619",
                "loan_type": "Green Energy Infrastructure Term Loan",
                "borrower_details": {
                    "primary_borrower": "VoltCharge Mobility Infrastructure LLP",
                    "masked_pan": "AAAFV****L",
                    "ckyc_identifier_hash": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a"
                },
                "financial_terms": {
                    "sanctioned_limit_inr": 22000000.00,
                    "current_outstanding_inr": 20550000.00,
                    "rate_of_interest_pct": 8.90,
                    "tenure_months": 144,
                    "equated_monthly_installment_inr": 249650.00
                },
                "mortgage_creation": {
                    "type_of_mortgage": "Hypothecation & Subterranean Leasehold Mortgage",
                    "date_of_creation": "2024-05-10",
                    "date_of_cersai_filing": "2024-05-12",
                    "original_deed_number": "SHV-1-11928-2024-25",
                    "sro_registration_office": "SRO K.R. Puram Bengaluru"
                },
                "charge_status": "ACTIVE_REGISTERED_MORTGAGE"
            }
        ]
    }

    cersai_path = os.path.join(DATA_DIR, "cersai_records.json")
    with open(cersai_path, "w", encoding="utf-8") as f:
        json.dump(cersai_records, f, indent=2)
    print(f"[OK] Generated: {cersai_path} ({os.path.getsize(cersai_path)} bytes)")


if __name__ == "__main__":
    generate_all()
