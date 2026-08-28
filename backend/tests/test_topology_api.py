"""
Pytest Test Suite for 3D ULPIN Cadastre & AI Topology Validation.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.ulpin import generate_ulpin, parse_ulpin, validate_ulpin
from app.core.topology import check_units_overlap, check_unit_within_building, validate_building_topology
from app.db.cadastre_db import CadastreDB
from app.data.seed import seed_demo_data


@pytest.fixture(autouse=True)
def init_db():
    seed_demo_data()


def test_ulpin_generation_and_parsing():
    # 2D Parcel ULPIN
    ulpin_2d = generate_ulpin("MH", "MUM", "P001")
    assert ulpin_2d == "MH-MUM-P001"
    parsed_2d = parse_ulpin(ulpin_2d)
    assert parsed_2d["state"] == "MH"
    assert parsed_2d["district"] == "MUM"
    assert parsed_2d["parcel_id"] == "P001"
    assert parsed_2d["is_3d"] is False

    # 3D Unit ULPIN (3rd Floor)
    ulpin_3d = generate_ulpin("MH", "MUM", "P001", "B001", 3, "U02", 9.0, 12.0)
    assert ulpin_3d == "MH-MUM-P001-B001-F03-U02-9.0_12.0"
    parsed_3d = parse_ulpin(ulpin_3d)
    assert parsed_3d["floor_no"] == 3
    assert parsed_3d["unit_no"] == "U02"
    assert parsed_3d["z_min"] == 9.0
    assert parsed_3d["z_max"] == 12.0
    assert parsed_3d["is_3d"] is True

    # Basement unit (negative floor & Z)
    ulpin_bsmt = generate_ulpin("MH", "MUM", "P001", "B001", -1, "U01", -3.0, 0.0)
    assert ulpin_bsmt == "MH-MUM-P001-B001-BF01-U01-n3.0_0.0"
    parsed_bsmt = parse_ulpin(ulpin_bsmt)
    assert parsed_bsmt["floor_no"] == -1
    assert parsed_bsmt["z_min"] == -3.0
    assert parsed_bsmt["z_max"] == 0.0

    # Ground floor
    ulpin_gf = generate_ulpin("MH", "MUM", "P001", "B001", 0, "U01", 0.0, 3.0)
    assert ulpin_gf == "MH-MUM-P001-B001-GF-U01-0.0_3.0"

    # Validation helper
    valid, err = validate_ulpin(ulpin_3d)
    assert valid is True
    assert err is None

    invalid, err_msg = validate_ulpin("INVALID-ULPIN")
    assert invalid is False
    assert err_msg is not None


def test_topology_clean_building():
    db = CadastreDB()
    building = db.get_building("B001")
    units = db.get_units_by_building("B001")
    assert len(units) == 18

    topo_units = []
    for u in units:
        coords = u["geometry"].get("coordinates", [[]])[0]
        topo_units.append({
            "ulpin": u["ulpin"],
            "geometry": coords,
            "z_min": u["z_min"],
            "z_max": u["z_max"],
            "floor_id": u["floor"],
        })

    res = validate_building_topology(building, topo_units)
    assert res["valid"] is True
    assert len(res["violations"]) == 0
    assert "topologically valid" in res["summary"].lower()


def test_topology_detects_3d_overlap():
    db = CadastreDB()
    building = db.get_building("B001")
    units = db.get_units_by_building("B001")

    topo_units = []
    for u in units:
        coords = u["geometry"].get("coordinates", [[]])[0]
        topo_units.append({
            "ulpin": u["ulpin"],
            "geometry": coords,
            "z_min": u["z_min"],
            "z_max": u["z_max"],
            "floor_id": u["floor"],
        })

    # Inject an overlapping unit on Floor 1 with identical coordinates to Unit A
    u0 = topo_units[0]
    conflict_unit = {
        "ulpin": "MH-MUM-P001-B001-BF01-U99-CLASH",
        "geometry": u0["geometry"],
        "z_min": u0["z_min"],
        "z_max": u0["z_max"],
        "floor_id": u0["floor_id"],
    }
    topo_units.append(conflict_unit)

    res = validate_building_topology(building, topo_units)
    assert res["valid"] is False
    assert len(res["violations"]) >= 1

    v = res["violations"][0]
    assert "ulpin1" in v
    assert "ulpin2" in v
    assert "reason" in v
    assert "overlap_volume" in v
    assert v["overlap_volume"] > 0
    assert v["ulpin1"] == u0["ulpin"]
    assert v["ulpin2"] == conflict_unit["ulpin"]


def test_topology_detects_z_envelope_breach():
    db = CadastreDB()
    building = db.get_building("B001")
    units = db.get_units_by_building("B001")

    topo_units = []
    for u in units:
        coords = u["geometry"].get("coordinates", [[]])[0]
        topo_units.append({
            "ulpin": u["ulpin"],
            "geometry": coords,
            "z_min": u["z_min"],
            "z_max": u["z_max"],
            "floor_id": u["floor"],
        })

    # Unit above sanctioned building height (building is max 15.0m)
    illegal_top_unit = {
        "ulpin": "MH-MUM-P001-B001-F06-U01-18.0_21.0",
        "geometry": topo_units[0]["geometry"],
        "z_min": 18.0,
        "z_max": 21.0,
        "floor_id": 6,
    }
    topo_units.append(illegal_top_unit)

    res = validate_building_topology(building, topo_units)
    assert res["valid"] is False
    assert any("exceeds" in v["reason"].lower() or "maximum height" in v["reason"].lower() for v in res["violations"])


def test_api_topology_validate_endpoint():
    with TestClient(app) as client:
        res = client.post("/topology/validate/B001")
        assert res.status_code == 200
        data = res.json()

        # Strict check of requested JSON shape
        assert "valid" in data
        assert isinstance(data["valid"], bool)
        assert data["valid"] is True

        assert "summary" in data
        assert isinstance(data["summary"], str)

        assert "violations" in data
        assert isinstance(data["violations"], list)
        assert len(data["violations"]) == 0

        # Non-existent building returns 404
        res_404 = client.post("/topology/validate/B_NON_EXISTENT")
        assert res_404.status_code == 404


def test_api_core_endpoints():
    with TestClient(app) as client:
        # 1. Health
        res_health = client.get("/health")
        assert res_health.status_code == 200
        assert res_health.json()["status"] == "healthy"

        # 2. Get Parcel
        res_parcel = client.get("/parcels/MH-MUM-P001")
        assert res_parcel.status_code == 200
        assert res_parcel.json()["ulpin"] == "MH-MUM-P001"

        # 3. Get Building Units
        res_units = client.get("/buildings/B001/units")
        assert res_units.status_code == 200
        units = res_units.json()
        assert len(units) == 18

        # 4. Get Single Unit
        first_ulpin = units[0]["ulpin"]
        res_unit = client.get(f"/units/{first_ulpin}")
        assert res_unit.status_code == 200
        assert res_unit.json()["ulpin"] == first_ulpin
        assert "owner" in res_unit.json()
        assert "geometry" in res_unit.json()
        assert "floor" in res_unit.json()
        assert "type" in res_unit.json()
