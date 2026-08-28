"""
3D ULPIN API — FastAPI Application

Backend for the 3D Unique Land Parcel Identification Number system.
Provides REST API for managing parcels, buildings, units, and topology validation.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import root_router, api_router
from app.data.seed import seed_demo_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Seed demo data on startup."""
    seed_demo_data()
    yield


app = FastAPI(
    title="3D ULPIN API",
    description=(
        "3D Unique Land Parcel Identification Number system — "
        "volumetric cadastre with topology validation for SIH26011."
    ),
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow frontend dev servers and wildcard for hackathon
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(root_router)
app.include_router(api_router)


@app.get("/", tags=["Root"])
def root():
    """Root endpoint with project info."""
    return {
        "project": "3D ULPIN — Volumetric Cadastre System (SIH26011)",
        "version": "2.0.0",
        "docs": "/docs",
        "status": "operational",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
