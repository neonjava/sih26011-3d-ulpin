# 3D ULPIN Backend

Backend API for the **3D Unique Land Parcel Identification Number** system (SIH26011).  
Provides volumetric cadastre management, ULPIN generation/validation, and topology checks.

## Quick Start

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server (auto-seeds demo data)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API docs: **http://localhost:8000/docs**

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8000` | Server port |
| `CORS_ORIGINS` | `*` | Comma-separated allowed origins |

No database setup needed — the demo runs entirely in-memory.  
A PostGIS migration script is provided at `schema.sql` for production use.

## Seeded Demo Data

The server auto-seeds on startup with:

- **1 parcel**: `MH-MUM-P001` (Bandra West, Mumbai)
- **1 building** (`B001`): 5 above-ground floors + 1 underground parking level
- **18 units** across 6 floors (3 per floor):
  - `BF01` — 3 parking units
  - `GF` — 1 utility + 2 commercial
  - `F01–F04` — 3 residential units each
- **1 underground asset**: DMRC Metro tunnel

## ULPIN Format

```
[STATE]-[DISTRICT]-[PARCEL_ID]-[BUILDING_ID]-[FLOOR_NO]-[UNIT_NO]-[Z_RANGE]
```

| Segment | Example | Description |
|---------|---------|-------------|
| STATE | `MH` | 2-letter state code |
| DISTRICT | `MUM` | 2-5 letter district code |
| PARCEL_ID | `P001` | Parcel identifier |
| BUILDING_ID | `B001` | Building identifier |
| FLOOR_NO | `GF`, `F03`, `BF01` | Ground / Floor N / Basement N |
| UNIT_NO | `U02` | Unit number |
| Z_RANGE | `9.0_12.0` | Z elevation range (meters). Negative uses `n` prefix: `n3.0_0.0` |

**Examples:**
```
MH-MUM-P001                                    ← 2D parcel ULPIN
MH-MUM-P001-B001-F03-U02-9.0_12.0             ← 3rd floor, unit B
MH-MUM-P001-B001-BF01-U01-n3.0_0.0            ← basement parking
MH-MUM-P001-B001-GF-U01-0.0_3.0               ← ground floor
```

## API Endpoints

### Core API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/parcels` | Create a parcel (auto-generates ULPIN) |
| `GET` | `/parcels/{ulpin}` | Fetch parcel by 2D ULPIN |
| `GET` | `/buildings/{id}` | Fetch building details |
| `GET` | `/buildings/{id}/units` | List all units in a building |
| `GET` | `/units/{ulpin}` | Fetch unit by full 3D ULPIN |
| `POST` | `/topology/validate/{building_id}` | Run topology validation |
| `GET` | `/health` | Health check with entity counts |

### Legacy API (under `/api`)

| `GET` | `/api/cadastre/parcels` | List all parcels |
| `GET` | `/api/cadastre/buildings` | List all buildings |
| `GET` | `/api/cadastre/units` | List all units |
| `GET` | `/api/cadastre/unit/{ulpin}` | Fetch unit |
| `GET` | `/api/health` | Health check |

## Response Shapes

### Unit (frontend contract)

```json
{
  "ulpin": "MH-MUM-P001-B001-F03-U02-9.0_12.0",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[72.8371, 19.0596], ...]]
  },
  "floor": 3,
  "unit": "B",
  "owner": "Kavita Bhat",
  "type": "residential",
  "z_min": 9.0,
  "z_max": 12.0
}
```

### Parcel

```json
{
  "ulpin": "MH-MUM-P001",
  "geometry": {"type": "Polygon", "coordinates": [...]},
  "owner": "State Government of Maharashtra",
  "land_use": "mixed",
  "area_sqm": 600.0,
  "address": "Plot 42, Bandra West, Mumbai 400050"
}
```

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, startup seeding
│   ├── api/
│   │   └── routes.py        # REST endpoints
│   ├── core/
│   │   ├── ulpin.py          # ULPIN generator, parser, validator
│   │   ├── topology.py       # 2D overlap + Z-range validation (Shapely)
│   │   ├── spatial_engine.py # 3D mesh extrusion (Trimesh)
│   │   └── conflict_detector.py  # Anti-fraud detection
│   ├── data/
│   │   └── seed.py           # Demo data seeder
│   ├── db/
│   │   └── cadastre_db.py    # In-memory singleton DB
│   └── models/
│       └── schemas.py        # Pydantic v2 request/response models
├── schema.sql                # PostGIS migration (for production)
├── requirements.txt
├── Dockerfile
└── README.md                 # ← you are here
```

## For Frontend Devs

1. Start the backend: `uvicorn app.main:app --port 8000 --reload`
2. Fetch all units: `GET http://localhost:8000/buildings/B001/units`
3. Each unit response matches the contract above — use `geometry` for 2D/3D rendering, `z_min`/`z_max` for vertical positioning
4. The `unit` field is a letter label (A/B/C), `floor` is an integer (negative = basement)
5. CORS is open (`*`) so any frontend dev server can call the API directly
