class CadastreDB:
    """In-memory cadastre database simulating PostGIS for hackathon demo."""
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.parcels: dict[str, dict] = {}  # keyed by ulpin (2D portion)
        self.buildings: dict[str, dict] = {}  # keyed by building_id
        self.floors: dict[str, dict] = {}  # keyed by f'{building_id}_{floor_no}'
        self.units: dict[str, dict] = {}  # keyed by full 3D ulpin
        self.underground_assets: list[dict] = []
    
    def add_parcel(self, ulpin: str, data: dict) -> dict:
        self.parcels[ulpin] = data
        return data
        
    def get_parcel(self, ulpin: str) -> dict | None:
        return self.parcels.get(ulpin)
        
    def add_building(self, building_id: str, data: dict) -> dict:
        self.buildings[building_id] = data
        return data
        
    def get_building(self, building_id: str) -> dict | None:
        return self.buildings.get(building_id)
        
    def add_unit(self, ulpin: str, data: dict) -> dict:
        self.units[ulpin] = data
        return data
        
    def get_unit(self, ulpin: str) -> dict | None:
        return self.units.get(ulpin)
        
    def get_units_by_building(self, building_id: str) -> list[dict]:
        return [unit for unit in self.units.values() if unit.get('building_id') == building_id]
        
    def get_units_by_floor(self, building_id: str, floor_no: int) -> list[dict]:
        return [unit for unit in self.units.values() if unit.get('building_id') == building_id and unit.get('floor') == floor_no]
        
    def get_all_parcels(self) -> list[dict]:
        return list(self.parcels.values())
        
    def get_all_buildings(self) -> list[dict]:
        return list(self.buildings.values())
