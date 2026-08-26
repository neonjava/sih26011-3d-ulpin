"""
Comprehensive Pytest Test Suite for SIH26011 3D ULPIN Cadastre Backend.
Tests:
1. ISO 19152 LADM Data Models & Schemas
2. Standardized Indian 3D-ULPIN Generation & Verification
3. 2D-to-3D Extrusion & Mesh Geometry Math (Shapely + Trimesh)
4. 3D Anti-Fraud Engines (Duplicate Mortgage, Phantom Floor, Carpet Inflation, Metro Clash)
5. Indian Real Estate Deed & Index-II AI Parser
6. FastAPI REST APIs (Cadastre, Loan Verification, Deed Parser, Real-World Simulations)
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.ladm_models import (
    LA_SpatialUnit,
    LA_BAUnit,
    LA_Party,
    LA_PartyType,
    LA_RRR,
    LA_RRRType,
    LA_UnitType,
    BuildingSanctionPlan,
    CadastralStatus,
    RiskLevel,
)
from app.models.schemas import LoanVerificationRequest, DeedParseRequest
from app.core.ulpin_generator import (
    generate_3d_ulpin,
    parse_3d_ulpin,
    verify_3d_ulpin,
    format_floor_code,
    parse_floor_code,
    compute_volumetric_hash,
)
from app.core.spatial_engine import (
    extrude_footprint_to_mesh,
    compute_volumetric_overlap,
    subdivide_floor_plate,
    export_to_3d_geojson,
)
from app.core.conflict_detector import (
    check_duplicate_mortgage,
    check_phantom_floor,
    check_carpet_inflation,
    check_subsurface_utility_clash,
    run_comprehensive_audit,
)
from app.core.document_ai import (
    parse_indian_deed,
    create_spatial_unit_from_deed,
    detect_document_type,
)
from app.db.mock_db import cadastre_db


client = TestClient(app)


# =====================================================================
# 1. 3D ULPIN GENERATOR TESTS
# =====================================================================

def test_floor_code_formatting():
    assert format_floor_code(0) == "G00"
    assert format_floor_code(4) == "F04"
    assert format_floor_code(12) == "F12"
    assert format_floor_code(-1) == "B01"
    assert format_floor_code(-3) == "B03"

    assert parse_floor_code("G00") == 0
    assert parse_floor_code("F04") == 4
    assert parse_floor_code("F12") == 12
    assert parse_floor_code("B01") == -1
    assert parse_floor_code("B03") == -3


def test_volumetric_hash_generation():
    bbox1 = [0.0, 0.0, 9.0, 10.0, 9.0, 12.0]
    hash1 = compute_volumetric_hash(bbox1)
    assert len(hash1) == 4
    assert hash1.isalnum()
    
    # Deterministic output
    hash2 = compute_volumetric_hash(bbox1)
    assert hash1 == hash2

    # Different bounding box should yield different hash
    bbox_diff = [0.0, 0.0, 12.0, 10.0, 9.0, 15.0]
    assert compute_volumetric_hash(bbox_diff) != hash1


def test_3d_ulpin_generation_and_parsing():
    bbox = [0.0, 0.0, 9.0, 10.0, 9.0, 12.0]
    ulpin_3d = generate_3d_ulpin(
        state_code="MH27",
        dist_code="045",
        cadastral_pin="8912345",
        unit_type=LA_UnitType.APARTMENT,
        wing="W1",
        floor_number=4,
        unit_number="402",
        bbox_3d=bbox,
    )

    # Format verification: MH27-045-8912345-APT-W1-F04-U402-XXXX
    assert ulpin_3d.startswith("MH27-045-8912345-APT-W1-F04-U402-")
    
    # Parse back
    parsed = parse_3d_ulpin(ulpin_3d)
    assert parsed["base_2d"] == "MH27-045-8912345"
    assert parsed["unit_type"] == LA_UnitType.APARTMENT
    assert parsed["wing"] == "W1"
    assert parsed["floor_number"] == 4
    assert parsed["unit_number"] == "402"

    # Integrity verification
    assert verify_3d_ulpin(ulpin_3d, bbox) is True
    assert verify_3d_ulpin(ulpin_3d, [0.0, 0.0, 0.0, 5.0, 5.0, 3.0]) is False


# =====================================================================
# 2. 3D SPATIAL ENGINE & EXTRUSION TESTS
# =====================================================================

def test_2d_to_3d_mesh_extrusion():
    footprint = [(0.0, 0.0), (10.0, 0.0), (10.0, 8.0), (0.0, 8.0), (0.0, 0.0)]
    z_min = 9.0
    z_max = 12.0  # height = 3.0m

    mesh, mesh_data, metrics = extrude_footprint_to_mesh(
        footprint_coords=footprint,
        z_min=z_min,
        z_max=z_max,
    )

    # Expected: area = 10 * 8 = 80 sq.m; volume = 80 * 3 = 240 m³
    assert metrics["carpet_area_sqm"] == 80.0
    assert metrics["volume_cum"] == 240.0
    assert metrics["centroid_3d"] == (5.0, 4.0, 10.5)
    assert metrics["bbox_3d"] == [0.0, 0.0, 9.0, 10.0, 8.0, 12.0]

    # Verify Three.js mesh data
    assert len(mesh_data.vertices) > 0
    assert len(mesh_data.faces) > 0
    assert mesh_data.bounds["minZ"] == 9.0
    assert mesh_data.bounds["maxZ"] == 12.0


def test_volumetric_overlap_calculation():
    # Unit A: [0 to 10] x [0 to 10], z in [0, 3] (Vol = 300 m³)
    poly_a = [(0.0, 0.0), (10.0, 0.0), (10.0, 10.0), (0.0, 10.0), (0.0, 0.0)]
    # Unit B: [5 to 15] x [0 to 10], z in [0, 3] (50% horizontal overlap)
    poly_b = [(5.0, 0.0), (15.0, 0.0), (15.0, 10.0), (5.0, 10.0), (5.0, 0.0)]

    vol, pct, clash_mesh = compute_volumetric_overlap(
        footprint_a=poly_a, z_min_a=0.0, z_max_a=3.0,
        footprint_b=poly_b, z_min_b=0.0, z_max_b=3.0,
    )

    # Overlap region: [5 to 10] x [0 to 10] = 50 sq.m * 3m = 150 m³ (50%)
    assert vol == 150.0
    assert pct == 50.0
    assert clash_mesh is not None
    assert clash_mesh.bounds["minX"] == 5.0
    assert clash_mesh.bounds["maxX"] == 10.0

    # Non-overlapping units vertically
    vol_no_z, pct_no_z, _ = compute_volumetric_overlap(
        footprint_a=poly_a, z_min_a=0.0, z_max_a=3.0,
        footprint_b=poly_a, z_min_b=3.0, z_max_b=6.0,
    )
    assert vol_no_z == 0.0
    assert pct_no_z == 0.0


def test_floor_subdivision_and_geojson_export():
    floor_poly = [(0.0, 0.0), (20.0, 0.0), (20.0, 20.0), (0.0, 20.0), (0.0, 0.0)]
    subs = subdivide_floor_plate(floor_poly, num_units=4)
    assert len(subs) == 4
    total_sub_area = sum(s["area_sqm"] for s in subs)
    assert round(total_sub_area, 1) == 400.0

    # Test GeoJSON Export
    units = cadastre_db.get_all_units()
    geojson = export_to_3d_geojson(units[:3])
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) == 3
    assert len(geojson["features"][0]["geometry"]["coordinates"][0][0]) == 3  # (X, Y, Z)


# =====================================================================
# 3. 3D CONFLICT & ANTI-FRAUD ENGINE TESTS
# =====================================================================

def test_duplicate_mortgage_clash_detection():
    units = cadastre_db.get_units_by_building("BLD-MUM-01")
    unit_402 = next(u for u in units if u.unit_number == "402")

    # Create candidate identical unit claiming Flat 402 with no existing link
    candidate_unit = LA_SpatialUnit(
        spatial_unit_id="SPU-CANDIDATE-NEW",
        ulpin_2d=unit_402.ulpin_2d,
        ulpin_3d="MH27-045-8912345-APT-W1-F04-U402-DIFF",
        unit_type=LA_UnitType.APARTMENT,
        building_id="BLD-MUM-01",
        floor_number=4,
        unit_number="402",
        carpet_area_sqm=unit_402.carpet_area_sqm,
        carpet_area_sqft=unit_402.carpet_area_sqft,
        floor_height_m=3.0,
        elevation_base_m=unit_402.elevation_base_m,
        elevation_top_m=unit_402.elevation_top_m,
        footprint_2d=unit_402.footprint_2d,
        volume_cum=unit_402.volume_cum,
    )

    clashes = check_duplicate_mortgage(candidate_unit, units)
    assert len(clashes) >= 1
    c = clashes[0]
    assert c.clash_type == "DUPLICATE_MORTGAGE"
    assert c.severity == "HIGH"
    assert c.conflicting_bank == "State Bank of India"
    assert c.conflicting_cersai_id == "CERSAI-MH-2023-998821"
    assert c.conflicting_borrower == "Vikramaditya Roy"
    assert c.overlap_percentage >= 99.0


def test_phantom_floor_detection():
    plan = BuildingSanctionPlan(
        plan_id="BLD-TEST",
        approval_number="BBMP/TEST/123",
        municipal_authority="BBMP",
        approval_date="2022-01-01",
        building_name="Test Tower",
        survey_cts_no="123",
        district="Bengaluru",
        state="Karnataka",
        sanctioned_floors=10,
        sanctioned_height_m=30.0,
        sanctioned_carpet_area_per_floor_sqm=300.0,
        sanctioned_total_fsi_sqm=3000.0,
    )

    # Unit on Floor 12 (elevation 33.0m to 36.0m)
    illegal_unit = LA_SpatialUnit(
        spatial_unit_id="SPU-ILLEGAL",
        ulpin_2d="KA01-018-7723410",
        ulpin_3d="KA01-018-7723410-APT-W1-F12-U1204-A9B1",
        unit_type=LA_UnitType.APARTMENT,
        building_id="BLD-TEST",
        floor_number=12,
        unit_number="1204",
        carpet_area_sqm=80.0,
        carpet_area_sqft=861.1,
        elevation_base_m=33.0,
        elevation_top_m=36.0,
        footprint_2d=[(0.0, 0.0), (10.0, 0.0), (10.0, 8.0), (0.0, 8.0), (0.0, 0.0)],
    )

    clash = check_phantom_floor(illegal_unit, plan)
    assert clash is not None
    assert clash.clash_type == "PHANTOM_FLOOR"
    assert clash.excess_height_m == 6.0
    assert "exceeds municipal sanctioned maximum height" in clash.message


def test_carpet_inflation_detection():
    plan = BuildingSanctionPlan(
        plan_id="BLD-TEST-CARPET",
        approval_number="MCGM/TEST",
        municipal_authority="MCGM",
        approval_date="2023-01-01",
        building_name="Tower C",
        survey_cts_no="456",
        district="Mumbai",
        state="MH",
        sanctioned_floors=5,
        sanctioned_height_m=15.0,
        sanctioned_carpet_area_per_floor_sqm=200.0,  # 200 sqm max per floor
        sanctioned_total_fsi_sqm=1000.0,
    )

    # 3 units on floor with total 300 sqm (100 sqm excess)
    units = [
        LA_SpatialUnit(spatial_unit_id=f"U-{i}", ulpin_2d="MH", ulpin_3d=f"3D-{i}", building_id="BLD", floor_number=1, unit_number=f"10{i}", carpet_area_sqm=100.0, carpet_area_sqft=1076.0, elevation_base_m=0.0, elevation_top_m=3.0)
        for i in range(1, 4)
    ]

    clash = check_carpet_inflation(units, plan)
    assert clash is not None
    assert clash.clash_type == "CARPET_INFLATION"
    assert "50.0% excess" in clash.actual_value


def test_subsurface_metro_easement_clash():
    utility = [{
        "id": "UTIL-METRO",
        "name": "Metro Tunnel",
        "type": "METRO_TUNNEL",
        "footprint": [(0.0, 0.0), (20.0, 0.0), (20.0, 20.0), (0.0, 20.0), (0.0, 0.0)],
        "z_min": -12.0,
        "z_max": -6.0,
        "buffer_zone_m": 2.0,
    }]

    deep_basement_unit = LA_SpatialUnit(
        spatial_unit_id="SPU-BASEMENT-3",
        ulpin_2d="DL04-009-3319022",
        ulpin_3d="DL04-009-3319022-BSM-W1-B03-UB301-C001",
        unit_type=LA_UnitType.BASEMENT,
        building_id="BLD-DEL-03",
        floor_number=-3,
        unit_number="B301",
        carpet_area_sqm=100.0,
        carpet_area_sqft=1076.0,
        elevation_base_m=-10.0,
        elevation_top_m=-7.0,
        footprint_2d=[(2.0, 2.0), (10.0, 2.0), (10.0, 10.0), (2.0, 10.0), (2.0, 2.0)],
    )

    clashes = check_subsurface_utility_clash(deep_basement_unit, utility)
    assert len(clashes) == 1
    assert clashes[0].clash_type == "SUBSURFACE_UTILITY"
    assert clashes[0].severity == "HIGH"


# =====================================================================
# 4. DOCUMENT AI & DEED PARSING TESTS
# =====================================================================

def test_document_ai_index_ii_parsing():
    sample_text = """
    DEPARTMENT OF REGISTRATION AND STAMPS - MAHARASHTRA
    INDEX - II (दस्तऐवज क्रमांक: BND/4582/2024)
    ULPIN: MH27-045-8912345
    CTS No: CTS-1042, Bandra West
    Building: Sea Breeze Towers
    Premises: Flat No. 402, 4th Floor, Wing W1
    Carpet Area: 85.50 Sq. Mtrs
    Consideration Amount: Rs. 2,25,00,000/-
    Stamp Duty: Rs. 13,50,000/-
    Vendor: Oberoi Horizon Developers LLP
    Purchaser: Vikramaditya Roy
    Mortgage Clause: Unit mortgaged to State Bank of India
    """

    doc_type = detect_document_type(sample_text)
    assert doc_type == "INDEX_II_MAHARASHTRA"

    extracted = parse_indian_deed(sample_text)
    assert extracted.ulpin_2d == "MH27-045-8912345"
    assert extracted.survey_cts_no == "CTS-1042"
    assert extracted.building_name == "Sea Breeze Towers"
    assert extracted.floor_number == 4
    assert extracted.unit_number == "402"
    assert extracted.carpet_area_sqm == 85.5
    assert extracted.consideration_amount_inr == 22500000.0
    assert extracted.buyer_name == "Vikramaditya Roy"
    assert extracted.mortgage_clause_found is True
    assert extracted.existing_bank == "State Bank of India"
    assert extracted.generated_3d_ulpin is not None

    # Test converting to 3D spatial unit
    spatial_unit, warnings = create_spatial_unit_from_deed(extracted)
    assert spatial_unit.floor_number == 4
    assert spatial_unit.unit_number == "402"
    assert spatial_unit.mesh_3d is not None
    assert spatial_unit.baunit.parties[0].name == "Vikramaditya Roy"


# =====================================================================
# 5. FASTAPI API ENDPOINT TESTS
# =====================================================================

def test_api_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["parcels_loaded"] >= 3
    assert data["buildings_loaded"] >= 3
    assert data["spatial_units_count"] >= 10


def test_api_get_parcels_and_buildings():
    res = client.get("/api/cadastre/parcels")
    assert res.status_code == 200
    parcels = res.json()
    assert len(parcels) >= 3

    res_bld = client.get("/api/cadastre/buildings")
    assert res_bld.status_code == 200
    blds = res_bld.json()
    assert len(blds) >= 3


def test_api_get_units_with_filters():
    res = client.get("/api/cadastre/units")
    assert res.status_code == 200
    units = res.json()
    assert len(units) >= 10

    # Filter by building
    res_mumbai = client.get("/api/cadastre/units?building_id=BLD-MUM-01")
    assert res_mumbai.status_code == 200
    assert len(res_mumbai.json()) >= 4

    # Filter by status
    res_mortgaged = client.get("/api/cadastre/units?status_filter=MORTGAGED")
    assert res_mortgaged.status_code == 200
    assert any(u["unit_number"] == "402" for u in res_mortgaged.json())


def test_api_verify_loan_fraud_clash():
    payload = {
        "ulpin_2d": "MH27-045-8912345",
        "building_id": "BLD-MUM-01",
        "wing": "W1",
        "floor_number": 4,
        "unit_number": "402",
        "carpet_area_sqm": 85.5,
        "bank_name": "HDFC Bank",
        "applicant_name": "Rohan Sharma",
        "loan_amount_inr": 17500000.0,
    }
    res = client.post("/api/verify-loan", json=payload)
    assert res.status_code == 200
    data = res.json()
    
    assert data["has_conflict"] is True
    assert data["risk_level"] == "RED_FRAUD_DETECTED"
    assert data["decision"] == "REJECTED_COLLISION_DETECTED"
    assert len(data["clashes"]) >= 1
    assert data["clashes"][0]["conflicting_bank"] == "State Bank of India"
    assert data["clashes"][0]["conflicting_cersai_id"] == "CERSAI-MH-2023-998821"
    assert data["unit_3d_preview"] is not None


def test_api_parse_deed_json():
    sample_text = """
    INDEX - II MAHARASHTRA
    ULPIN: MH27-045-8912345
    CTS No: CTS-1042
    Building: Sea Breeze Towers
    Wing: W1
    Floor: 3
    Flat: 301
    Carpet Area: 82.50 Sq. Mtrs
    Consideration Amount: Rs. 1,80,00,000/-
    Purchaser: Priya Nair
    """
    res = client.post("/api/parse-deed/json", json={"raw_text": sample_text})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["extracted_data"]["floor_number"] == 3
    assert data["extracted_data"]["unit_number"] == "301"
    assert data["spatial_unit_preview"]["carpet_area_sqm"] == 82.5


def test_api_simulation_scenarios():
    res = client.get("/api/simulation/scenarios")
    assert res.status_code == 200
    scenarios = res.json()
    assert len(scenarios) == 3

    # Run Scenario 1 (Bandra Double Mortgage)
    res_s1 = client.post("/api/simulation/run/scenario-1")
    assert res_s1.status_code == 200
    s1_data = res_s1.json()
    assert s1_data["fraud_detected"] is True
    assert s1_data["risk_level"] == "RED_FRAUD_DETECTED"
    assert "SBI" in s1_data["summary"] or "State Bank" in s1_data["summary"]

    # Run Scenario 2 (Bengaluru Phantom Floor)
    res_s2 = client.post("/api/simulation/run/scenario-2")
    assert res_s2.status_code == 200
    s2_data = res_s2.json()
    assert s2_data["fraud_detected"] is True
    assert s2_data["risk_level"] == "RED_FRAUD_DETECTED"

    # Run Scenario 3 (Delhi Metro Subsurface Clash)
    res_s3 = client.post("/api/simulation/run/scenario-3")
    assert res_s3.status_code == 200
    s3_data = res_s3.json()
    assert s3_data["fraud_detected"] is True
    assert s3_data["risk_level"] == "RED_FRAUD_DETECTED"


def test_api_parse_deed_pdf_upload():
    import io
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas

    pdf_buffer = io.BytesIO()
    p = canvas.Canvas(pdf_buffer, pagesize=letter)
    p.drawString(100, 750, "GOVERNMENT OF MAHARASHTRA - INDEX-II")
    p.drawString(100, 730, "ULPIN: MH27-045-8912345")
    p.drawString(100, 710, "CTS No: CTS-1042, Bandra West")
    p.drawString(100, 690, "Building: Sea Breeze Towers")
    p.drawString(100, 670, "Premises: Flat No. 201, 2nd Floor, Wing W1")
    p.drawString(100, 650, "Carpet Area: 78.00 Sq. Mtrs")
    p.drawString(100, 630, "Consideration Amount: Rs. 1,60,00,000/-")
    p.drawString(100, 610, "Purchaser: Rajesh Khanna")
    p.showPage()
    p.save()
    pdf_buffer.seek(0)

    files = {"file": ("test_deed.pdf", pdf_buffer.getvalue(), "application/pdf")}
    res = client.post("/api/parse-deed", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["extracted_data"]["floor_number"] == 2
    assert data["extracted_data"]["unit_number"] == "201"
    assert data["extracted_data"]["buyer_name"] == "Rajesh Khanna"


def test_api_single_unit_by_ulpin():
    units_res = client.get("/api/cadastre/units")
    assert units_res.status_code == 200
    first_ulpin = units_res.json()[0]["ulpin_3d"]

    res = client.get(f"/api/cadastre/unit/{first_ulpin}")
    assert res.status_code == 200
    data = res.json()
    assert data["ulpin_3d"] == first_ulpin
    assert "mesh_3d" in data
    assert len(data["mesh_3d"]["vertices"]) > 0


def test_api_register_new_spatial_unit():
    new_ulpin = "MH27-045-8912345-APT-W1-F05-U501-A1B2"
    new_unit = {
        "spatial_unit_id": "SPU-MUM-501-CUSTOM",
        "ulpin_2d": "MH27-045-8912345",
        "ulpin_3d": new_ulpin,
        "unit_type": "APARTMENT",
        "building_id": "BLD-MUM-01",
        "wing": "W1",
        "floor_number": 5,
        "unit_number": "501",
        "carpet_area_sqm": 85.0,
        "carpet_area_sqft": 914.93,
        "floor_height_m": 3.0,
        "elevation_base_m": 12.0,
        "elevation_top_m": 15.0,
        "footprint_2d": [[0.0, 0.0], [10.0, 0.0], [10.0, 8.5], [0.0, 8.5], [0.0, 0.0]],
        "bbox_3d": [0.0, 0.0, 12.0, 10.0, 8.5, 15.0],
        "volume_cum": 255.0,
        "status": "CLEAR"
    }
    res = client.post("/api/cadastre/units", json=new_unit)
    assert res.status_code == 201
    created = res.json()
    assert created["ulpin_3d"] == new_ulpin

    # Verify query returns it
    get_res = client.get(f"/api/cadastre/unit/{new_ulpin}")
    assert get_res.status_code == 200
    assert get_res.json()["spatial_unit_id"] == "SPU-MUM-501-CUSTOM"
