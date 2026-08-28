-- Create PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- parcels table
-- Stores the 2D parcel boundary and information
CREATE TABLE parcels (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(100) UNIQUE NOT NULL, -- the 2D portion: STATE-DISTRICT-PARCEL_ID
    geometry GEOMETRY(Polygon, 4326) NOT NULL, -- 2D parcel boundary
    area_sqm DOUBLE PRECISION,
    owner_name VARCHAR(255),
    owner_id VARCHAR(50), -- like Aadhaar placeholder
    land_use VARCHAR(50), -- residential, commercial, mixed, agricultural
    address TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for parcels geometry
CREATE INDEX parcels_geom_idx ON parcels USING GIST (geometry);

-- Trigger to auto-update updated_at on parcels
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_parcels_modtime
    BEFORE UPDATE ON parcels
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();


-- buildings table
-- Stores 3D building footprint with height and basic properties
CREATE TABLE buildings (
    id SERIAL PRIMARY KEY,
    building_id VARCHAR(20) NOT NULL,
    parcel_id INTEGER REFERENCES parcels(id),
    ulpin_prefix VARCHAR(100) NOT NULL, -- STATE-DISTRICT-PARCEL_ID-BUILDING_ID
    geometry GEOMETRY(PolygonZ, 4326), -- 3D building footprint with height
    ground_elevation DOUBLE PRECISION DEFAULT 0.0,
    total_height DOUBLE PRECISION NOT NULL,
    num_floors INTEGER NOT NULL,
    num_basements INTEGER DEFAULT 0,
    floor_height DOUBLE PRECISION DEFAULT 3.0,
    building_type VARCHAR(50), -- residential, commercial, mixed
    sanction_height DOUBLE PRECISION, -- max allowed height from municipality
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for buildings geometry
CREATE INDEX buildings_geom_idx ON buildings USING GIST (geometry);


-- floors table
-- Defines each floor within a building with Z ranges
CREATE TABLE floors (
    id SERIAL PRIMARY KEY,
    building_id INTEGER REFERENCES buildings(id),
    floor_no INTEGER NOT NULL, -- 0=ground, positive=upper, negative=basement
    floor_label VARCHAR(10), -- GF, F01, BF01 etc
    z_min DOUBLE PRECISION NOT NULL,
    z_max DOUBLE PRECISION NOT NULL,
    floor_type VARCHAR(50), -- residential, parking, commercial, utility
    geometry GEOMETRY(PolygonZ, 4326),
    metadata JSONB DEFAULT '{}',
    UNIQUE(building_id, floor_no)
);

-- Index for floors geometry
CREATE INDEX floors_geom_idx ON floors USING GIST (geometry);


-- units table
-- Stores individual 3D units within floors
CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(150) UNIQUE NOT NULL, -- full 3D ULPIN
    floor_id INTEGER REFERENCES floors(id),
    building_id INTEGER REFERENCES buildings(id),
    unit_no VARCHAR(10) NOT NULL,
    geometry GEOMETRY(PolygonZ, 4326), -- 3D unit boundary
    z_min DOUBLE PRECISION NOT NULL,
    z_max DOUBLE PRECISION NOT NULL,
    area_sqm DOUBLE PRECISION,
    unit_type VARCHAR(50) NOT NULL, -- residential, parking, utility, commercial
    owner_name VARCHAR(255),
    owner_id VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for units geometry
CREATE INDEX units_geom_idx ON units USING GIST (geometry);


-- underground_assets table
-- Stores paths of underground utilities with their Z ranges
CREATE TABLE underground_assets (
    id SERIAL PRIMARY KEY,
    asset_type VARCHAR(50) NOT NULL, -- metro_tunnel, sewer, water_main, power_cable, gas_pipe
    name VARCHAR(255),
    geometry GEOMETRY(LineStringZ, 4326), -- 3D path
    buffer_radius DOUBLE PRECISION DEFAULT 5.0, -- safety buffer in meters
    z_min DOUBLE PRECISION NOT NULL,
    z_max DOUBLE PRECISION NOT NULL,
    operator VARCHAR(255), -- DMRC, Municipal Corp, etc
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for underground_assets geometry
CREATE INDEX underground_assets_geom_idx ON underground_assets USING GIST (geometry);
