"""
SIH26011: 3D ULPIN Generation & Vertical Property Mapping System
Production-grade FastAPI Backend Engine.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import cadastre, verify_loan, deed_parser, simulation
from app.db.mock_db import cadastre_db

app = FastAPI(
    title="3D ULPIN Cadastre & Vertical Property Anti-Fraud Engine",
    description=(
        "ISO 19152 LADM Compliant 3D Cadastral Generation, Volumetric Mortgage Clash Detection, "
        "and Indian Deed OCR Parsing System."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware for WebGL & Frontend Dashboards
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api
app.include_router(cadastre.router, prefix="/api")
app.include_router(verify_loan.router, prefix="/api")
app.include_router(deed_parser.router, prefix="/api")
app.include_router(simulation.router, prefix="/api")


@app.get("/", tags=["Health & Status"])
def root():
    return {
        "project": "SIH26011: 3D ULPIN Cadastre & Vertical Property Mapping",
        "status": "OPERATIONAL",
        "standard": "ISO 19152 LADM & Indian Bhu-Aadhaar 3D Cadastre",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health & Status"])
@app.get("/api/health", tags=["Health & Status"])
def health_check():
    return {
        "status": "healthy",
        "parcels_loaded": len(cadastre_db.get_all_parcels()),
        "buildings_loaded": len(cadastre_db.get_all_buildings()),
        "spatial_units_count": len(cadastre_db.get_all_units()),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
