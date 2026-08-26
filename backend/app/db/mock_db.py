"""
Cadastral In-Memory Repository initialized with real-world Indian 3D Cadastre datasets:
1. Mumbai Bandra West (CTS 1042 / Sea Breeze Towers)
2. Bengaluru Whitefield (Survey 84/2 / Silicon Heights)
3. New Delhi Dwarka Sector 21 (Khasra 412/1 / Metro View Plaza)
"""

from typing import List, Dict, Any, Optional
from app.models.ladm_models import (
    LA_SpatialUnit,
    LA_BAUnit,
    LA_Party,
    LA_PartyType,
    LA_RRR,
    LA_RRRType,
    LA_UnitType,
    BuildingSanctionPlan,
    CadastralParcel,
    CadastralStatus,
)
from app.core.ulpin_generator import generate_3d_ulpin
from app.core.spatial_engine import extrude_footprint_to_mesh, subdivide_floor_plate


class CadastreDatabase:
    def __init__(self):
        self.parcels: Dict[str, CadastralParcel] = {}
        self.buildings: Dict[str, BuildingSanctionPlan] = {}
        self.spatial_units: Dict[str, LA_SpatialUnit] = {}
        self.utility_layers: List[Dict[str, Any]] = []
        self._initialize_seed_data()

    def _initialize_seed_data(self):
        # -------------------------------------------------------------
        # 1. MUMBAI BANDRA WEST DATASET (CTS 1042)
        # -------------------------------------------------------------
        mumbai_ulpin_2d = "MH27-045-8912345"
        mumbai_bld_id = "BLD-MUM-01"
        
        mumbai_plan = BuildingSanctionPlan(
            plan_id=mumbai_bld_id,
            approval_number="MCGM/BP/2022/WS/789",
            municipal_authority="Municipal Corporation of Greater Mumbai (MCGM)",
            approval_date="2022-03-15",
            building_name="Sea Breeze Towers",
            survey_cts_no="CTS-1042",
            district="Mumbai Suburban",
            state="Maharashtra",
            sanctioned_floors=15,
            sanctioned_basements=2,
            sanctioned_height_m=45.0,
            plinth_elevation_m=0.0,
            floor_height_m=3.0,
            sanctioned_carpet_area_per_floor_sqm=360.0,
            sanctioned_total_fsi_sqm=5400.0,
        )
        self.buildings[mumbai_bld_id] = mumbai_plan

        mumbai_parcel_coords = [
            (72.8250, 19.0550),
            (72.8270, 19.0550),
            (72.8270, 19.0570),
            (72.8250, 19.0570),
            (72.8250, 19.0550),
        ]
        self.parcels[mumbai_ulpin_2d] = CadastralParcel(
            ulpin_2d=mumbai_ulpin_2d,
            survey_cts_no="CTS-1042",
            village="Bandra West",
            taluka="Andheri",
            district="Mumbai Suburban",
            state="Maharashtra",
            state_code="MH27",
            district_code="045",
            total_area_sqm=1200.0,
            boundary_coordinates=mumbai_parcel_coords,
            sanction_plan=mumbai_plan,
            buildings=[mumbai_bld_id],
        )

        # Base building footprint 20m x 20m centered locally
        base_floor_poly = [(0.0, 0.0), (20.0, 0.0), (20.0, 18.0), (0.0, 18.0), (0.0, 0.0)]
        floor_subdivisions = subdivide_floor_plate(base_floor_poly, num_units=4)

        # Populate floors 1 to 5
        for fl in range(1, 6):
            z_min = (fl - 1) * 3.0
            z_max = z_min + 3.0
            for idx, sub in enumerate(floor_subdivisions):
                unit_no = f"{fl}0{idx + 1}"
                is_target_mortgage_unit = (fl == 4 and unit_no == "402")

                color = "#F59E0B" if is_target_mortgage_unit else "#3B82F6"
                _, mesh_data, metrics = extrude_footprint_to_mesh(
                    footprint_coords=sub["footprint"],
                    z_min=z_min,
                    z_max=z_max,
                    color=color,
                    opacity=0.85,
                )

                ulpin_3d = generate_3d_ulpin(
                    state_code="MH27",
                    dist_code="045",
                    cadastral_pin="8912345",
                    unit_type=LA_UnitType.APARTMENT,
                    wing="W1",
                    floor_number=fl,
                    unit_number=unit_no,
                    bbox_3d=metrics["bbox_3d"],
                )

                party = LA_Party(
                    party_id=f"PTY-MUM-{unit_no}",
                    name="Vikramaditya Roy" if is_target_mortgage_unit else f"Owner Flat {unit_no}",
                    party_type=LA_PartyType.INDIVIDUAL,
                    aadhaar_hash="8f9b4c7d6e5a4b3c2d1e0f" if is_target_mortgage_unit else None,
                )

                rrr_list = []
                unit_status = CadastralStatus.CLEAR

                if is_target_mortgage_unit:
                    unit_status = CadastralStatus.MORTGAGED
                    rrr_list.append(
                        LA_RRR(
                            rrr_id=f"RRR-SBI-{unit_no}",
                            baunit_id=f"BAU-MUM-{unit_no}",
                            rrr_type=LA_RRRType.RESTRICTION_MORTGAGE,
                            party_id=party.party_id,
                            bank_name="State Bank of India",
                            cersai_security_interest_id="CERSAI-MH-2023-998821",
                            loan_amount_inr=15000000.0,
                            sanction_date="2023-11-20",
                            is_active=True,
                            description="First Pari-Passu Charge / Home Loan Mortgage",
                        )
                    )

                baunit = LA_BAUnit(
                    baunit_id=f"BAU-MUM-{unit_no}",
                    name=f"Flat {unit_no}, Sea Breeze Towers, Bandra",
                    ulpin_2d=mumbai_ulpin_2d,
                    ulpin_3d=ulpin_3d,
                    title_deed_no=f"REG/MUM/2023/{unit_no}",
                    registration_date="2023-08-10",
                    sub_registrar_office="SRO Bandra West",
                    status=unit_status,
                    property_value_inr=22000000.0,
                    parties=[party],
                    rrr_records=rrr_list,
                )

                sp_unit = LA_SpatialUnit(
                    spatial_unit_id=f"SPU-MUM-{unit_no}",
                    ulpin_2d=mumbai_ulpin_2d,
                    ulpin_3d=ulpin_3d,
                    unit_type=LA_UnitType.APARTMENT,
                    building_id=mumbai_bld_id,
                    wing="W1",
                    floor_number=fl,
                    unit_number=unit_no,
                    carpet_area_sqm=metrics["carpet_area_sqm"],
                    carpet_area_sqft=metrics["carpet_area_sqft"],
                    floor_height_m=3.0,
                    elevation_base_m=z_min,
                    elevation_top_m=z_max,
                    footprint_2d=sub["footprint"],
                    bbox_3d=metrics["bbox_3d"],
                    volume_cum=metrics["volume_cum"],
                    centroid_3d=metrics["centroid_3d"],
                    mesh_3d=mesh_data,
                    baunit=baunit,
                    status=unit_status,
                )
                self.spatial_units[ulpin_3d] = sp_unit

        # -------------------------------------------------------------
        # 2. BENGALURU WHITEFIELD DATASET (Phantom Floor Scenario)
        # -------------------------------------------------------------
        blr_ulpin_2d = "KA01-018-7723410"
        blr_bld_id = "BLD-BLR-02"

        blr_plan = BuildingSanctionPlan(
            plan_id=blr_bld_id,
            approval_number="BBMP/HO/LP/2021-22/334",
            municipal_authority="Bruhat Bengaluru Mahanagara Palike (BBMP)",
            approval_date="2021-06-20",
            building_name="Silicon Heights",
            survey_cts_no="Sy-84/2",
            district="Bengaluru Urban",
            state="Karnataka",
            sanctioned_floors=10,  # Max 10 floors permitted
            sanctioned_basements=1,
            sanctioned_height_m=30.0,
            plinth_elevation_m=0.0,
            floor_height_m=3.0,
            sanctioned_carpet_area_per_floor_sqm=400.0,
            sanctioned_total_fsi_sqm=4000.0,
        )
        self.buildings[blr_bld_id] = blr_plan

        self.parcels[blr_ulpin_2d] = CadastralParcel(
            ulpin_2d=blr_ulpin_2d,
            survey_cts_no="Sy-84/2",
            village="Whitefield",
            taluka="KR Puram",
            district="Bengaluru Urban",
            state="Karnataka",
            state_code="KA01",
            district_code="018",
            total_area_sqm=1500.0,
            boundary_coordinates=[(77.740, 12.960), (77.743, 12.960), (77.743, 12.963), (77.740, 12.963), (77.740, 12.960)],
            sanction_plan=blr_plan,
            buildings=[blr_bld_id],
        )

        # Populate approved floors 1 to 10 + illegal Phantom Floor 12
        for fl in [1, 2, 3, 10, 12]:
            z_min = (fl - 1) * 3.0
            z_max = z_min + 3.0
            is_phantom = (fl == 12)
            
            unit_no = f"{fl}04"
            footprint = [(30.0, 0.0), (50.0, 0.0), (50.0, 18.0), (30.0, 18.0), (30.0, 0.0)]
            color = "#DC2626" if is_phantom else "#10B981"

            _, mesh_data, metrics = extrude_footprint_to_mesh(
                footprint_coords=footprint,
                z_min=z_min,
                z_max=z_max,
                color=color,
                opacity=0.9 if is_phantom else 0.8,
            )

            ulpin_3d = generate_3d_ulpin(
                state_code="KA01",
                dist_code="018",
                cadastral_pin="7723410",
                unit_type=LA_UnitType.APARTMENT,
                wing="W1",
                floor_number=fl,
                unit_number=unit_no,
                bbox_3d=metrics["bbox_3d"],
            )

            party = LA_Party(
                party_id=f"PTY-BLR-{unit_no}",
                name="Anand Kulkarni" if is_phantom else f"Owner {unit_no}",
                party_type=LA_PartyType.INDIVIDUAL,
            )

            baunit = LA_BAUnit(
                baunit_id=f"BAU-BLR-{unit_no}",
                name=f"Unit {unit_no}, Silicon Heights, Whitefield",
                ulpin_2d=blr_ulpin_2d,
                ulpin_3d=ulpin_3d,
                title_deed_no=f"REG/BLR/2024/{unit_no}",
                registration_date="2024-02-14",
                sub_registrar_office="SRO Shivajinagar",
                status=CadastralStatus.VIOLATION_PHANTOM if is_phantom else CadastralStatus.CLEAR,
                property_value_inr=18500000.0,
                parties=[party],
                rrr_records=[],
            )

            sp_unit = LA_SpatialUnit(
                spatial_unit_id=f"SPU-BLR-{unit_no}",
                ulpin_2d=blr_ulpin_2d,
                ulpin_3d=ulpin_3d,
                unit_type=LA_UnitType.APARTMENT,
                building_id=blr_bld_id,
                wing="W1",
                floor_number=fl,
                unit_number=unit_no,
                carpet_area_sqm=metrics["carpet_area_sqm"],
                carpet_area_sqft=metrics["carpet_area_sqft"],
                floor_height_m=3.0,
                elevation_base_m=z_min,
                elevation_top_m=z_max,
                footprint_2d=footprint,
                bbox_3d=metrics["bbox_3d"],
                volume_cum=metrics["volume_cum"],
                centroid_3d=metrics["centroid_3d"],
                mesh_3d=mesh_data,
                baunit=baunit,
                status=CadastralStatus.VIOLATION_PHANTOM if is_phantom else CadastralStatus.CLEAR,
            )
            self.spatial_units[ulpin_3d] = sp_unit

        # -------------------------------------------------------------
        # 3. NEW DELHI DWARKA SEC-21 (Subsurface Metro Clash Dataset)
        # -------------------------------------------------------------
        delhi_ulpin_2d = "DL04-009-3319022"
        delhi_bld_id = "BLD-DEL-03"

        delhi_plan = BuildingSanctionPlan(
            plan_id=delhi_bld_id,
            approval_number="DDA/Bldg/Dwarka/2020/55",
            municipal_authority="Delhi Development Authority (DDA)",
            approval_date="2020-09-10",
            building_name="Metro View Commercial Plaza",
            survey_cts_no="Khasra-412/1",
            district="South West Delhi",
            state="Delhi",
            sanctioned_floors=8,
            sanctioned_basements=2,  # Only B1, B2 approved
            sanctioned_height_m=28.0,
            plinth_elevation_m=0.0,
            floor_height_m=3.5,
            sanctioned_carpet_area_per_floor_sqm=600.0,
            sanctioned_total_fsi_sqm=4800.0,
        )
        self.buildings[delhi_bld_id] = delhi_plan

        self.parcels[delhi_ulpin_2d] = CadastralParcel(
            ulpin_2d=delhi_ulpin_2d,
            survey_cts_no="Khasra-412/1",
            village="Dwarka Sec 21",
            taluka="Najafgarh",
            district="South West Delhi",
            state="Delhi",
            state_code="DL04",
            district_code="009",
            total_area_sqm=2000.0,
            boundary_coordinates=[(77.050, 28.550), (77.055, 28.550), (77.055, 28.555), (77.050, 28.555), (77.050, 28.550)],
            sanction_plan=delhi_plan,
            buildings=[delhi_bld_id],
        )

        # DMRC Subsurface Utility Layer (Metro Line 3 Underground Corridor)
        metro_footprint = [(60.0, 0.0), (85.0, 0.0), (85.0, 25.0), (60.0, 25.0), (60.0, 0.0)]
        self.utility_layers.append({
            "id": "UTIL-DMRC-LINE3",
            "name": "DMRC Blue Line Underground Tunnel & Right-of-Way Buffer",
            "type": "METRO_TUNNEL",
            "authority": "Delhi Metro Rail Corporation (DMRC)",
            "footprint": metro_footprint,
            "z_min": -14.0,
            "z_max": -7.0,
            "buffer_zone_m": 2.0,
        })

        # Commercial basement unit B3 (illegal excavation into metro zone)
        b3_footprint = [(62.0, 2.0), (80.0, 2.0), (80.0, 20.0), (62.0, 20.0), (62.0, 2.0)]
        _, b3_mesh, b3_metrics = extrude_footprint_to_mesh(
            footprint_coords=b3_footprint,
            z_min=-11.0,
            z_max=-7.5,
            color="#9333EA",  # Purple for basement
            opacity=0.85,
        )

        delhi_b3_ulpin = generate_3d_ulpin(
            state_code="DL04",
            dist_code="009",
            cadastral_pin="3319022",
            unit_type=LA_UnitType.BASEMENT,
            wing="W1",
            floor_number=-3,
            unit_number="B301",
            bbox_3d=b3_metrics["bbox_3d"],
        )

        delhi_b3_party = LA_Party(
            party_id="PTY-DEL-B301",
            name="Apex Retail Ventures Pvt Ltd",
            party_type=LA_PartyType.BUILDER,
        )

        delhi_b3_baunit = LA_BAUnit(
            baunit_id="BAU-DEL-B301",
            name="Basement B3 Commercial Storage, Metro View Plaza",
            ulpin_2d=delhi_ulpin_2d,
            ulpin_3d=delhi_b3_ulpin,
            title_deed_no="REG/DEL/2024/B301",
            registration_date="2024-03-01",
            sub_registrar_office="SRO Kapashera Delhi",
            status=CadastralStatus.VIOLATION_EASEMENT,
            property_value_inr=35000000.0,
            parties=[delhi_b3_party],
            rrr_records=[],
        )

        delhi_b3_unit = LA_SpatialUnit(
            spatial_unit_id="SPU-DEL-B301",
            ulpin_2d=delhi_ulpin_2d,
            ulpin_3d=delhi_b3_ulpin,
            unit_type=LA_UnitType.BASEMENT,
            building_id=delhi_bld_id,
            wing="W1",
            floor_number=-3,
            unit_number="B301",
            carpet_area_sqm=b3_metrics["carpet_area_sqm"],
            carpet_area_sqft=b3_metrics["carpet_area_sqft"],
            floor_height_m=3.5,
            elevation_base_m=-11.0,
            elevation_top_m=-7.5,
            footprint_2d=b3_footprint,
            bbox_3d=b3_metrics["bbox_3d"],
            volume_cum=b3_metrics["volume_cum"],
            centroid_3d=b3_metrics["centroid_3d"],
            mesh_3d=b3_mesh,
            baunit=delhi_b3_baunit,
            status=CadastralStatus.VIOLATION_EASEMENT,
        )
        self.spatial_units[delhi_b3_ulpin] = delhi_b3_unit

    # Data access helpers
    def get_all_parcels(self) -> List[CadastralParcel]:
        return list(self.parcels.values())

    def get_parcel_by_2d_ulpin(self, ulpin_2d: str) -> Optional[CadastralParcel]:
        return self.parcels.get(ulpin_2d)

    def get_all_buildings(self) -> List[BuildingSanctionPlan]:
        return list(self.buildings.values())

    def get_building(self, building_id: str) -> Optional[BuildingSanctionPlan]:
        return self.buildings.get(building_id)

    def get_all_units(self) -> List[LA_SpatialUnit]:
        return list(self.spatial_units.values())

    def get_unit_by_3d_ulpin(self, ulpin_3d: str) -> Optional[LA_SpatialUnit]:
        return self.spatial_units.get(ulpin_3d)

    def get_units_by_building(self, building_id: str) -> List[LA_SpatialUnit]:
        return [u for u in self.spatial_units.values() if u.building_id == building_id]

    def add_spatial_unit(self, unit: LA_SpatialUnit):
        self.spatial_units[unit.ulpin_3d] = unit


# Singleton DB Instance
cadastre_db = CadastreDatabase()
