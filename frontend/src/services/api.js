/**
 * 3D ULPIN Building Data Service
 *
 * Fetches real data from the backend API and transforms it into the
 * nested shape the frontend components expect.
 *
 * Backend returns a flat array of units from GET /buildings/{id}/units:
 *   [{ ulpin, geometry (GeoJSON), floor, unit, owner, type, z_min, z_max }, ...]
 *
 * Frontend components expect the nested shape:
 *   { building_id, building_name, city, floors: [{ floor_no, units: [...] }], underground: [...] }
 *
 * This module bridges that gap with a transform layer.
 */

import { MOCK_BUILDING_DATA } from '../data/mockBuildingData.js';

// ============================================================================
// ⚙️ API CONFIGURATION
// ============================================================================
export const USE_MOCK_DATA = false; // ← LIVE: connected to backend at localhost:8000
export const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Map unit index within a floor to a 3D position for Three.js rendering.
 * Generates box geometry params matching the mock data layout pattern.
 */
function buildUnitGeometry(unitIndex, totalUnitsOnFloor, zMin, zMax) {
  const height = Math.min((zMax - zMin) - 0.3, 2.7);

  if (totalUnitsOnFloor === 3) {
    // 3-unit layout: two small boxes left/right, one wide box behind
    const layouts = [
      { x: -3.8, z: -3.8, width: 7.2, depth: 7.2 },   // Unit A (left-front)
      { x:  3.8, z: -3.8, width: 7.2, depth: 7.2 },   // Unit B (right-front)
      { x:  0.0, z:  3.8, width: 14.8, depth: 7.2 },   // Unit C (back-wide)
    ];
    const pos = layouts[unitIndex] || layouts[0];
    return { ...pos, height, z_min: zMin, z_max: zMax };
  }

  if (totalUnitsOnFloor === 2) {
    const layouts = [
      { x: -3.8, z: 0.0, width: 7.2, depth: 14.8 },
      { x:  3.8, z: 0.0, width: 7.2, depth: 14.8 },
    ];
    const pos = layouts[unitIndex] || layouts[0];
    return { ...pos, height, z_min: zMin, z_max: zMax };
  }

  // 1 unit — full floor plate
  return { x: 0, z: 0, width: 14.8, depth: 14.8, height, z_min: zMin, z_max: zMax };
}

/**
 * Map backend unit label (A, B, C) to a descriptive unit_number string.
 */
function makeUnitNumber(floorNo, unitLabel) {
  if (floorNo < 0) {
    const bLevel = Math.abs(floorNo);
    return `Bay B${bLevel}-${unitLabel}`;
  }
  // Use floor-based numbering: floor 0 → Unit 101, floor 1 → Unit 201, etc.
  const floorPrefix = floorNo + 1;
  const unitSuffix = unitLabel.charCodeAt(0) - 64; // A→1, B→2, C→3
  return `Unit ${floorPrefix}0${unitSuffix}`;
}

/**
 * Transform backend flat unit array + building info into the nested shape
 * that Building3DScene.jsx and SidebarPanel.jsx expect.
 */
function transformBackendData(units, buildingInfo) {
  // Group units by floor number
  const floorMap = new Map();
  const undergroundUnits = [];

  units.forEach((u) => {
    const floorNo = u.floor;
    if (floorNo < 0) {
      undergroundUnits.push(u);
    } else {
      if (!floorMap.has(floorNo)) floorMap.set(floorNo, []);
      floorMap.get(floorNo).push(u);
    }
  });

  // Build above-ground floors (sorted by floor number)
  // Backend floors: 0 (ground), 1, 2, 3, 4 -> 5 floors total!
  const sortedFloorNos = [...floorMap.keys()].sort((a, b) => a - b);

  const floors = sortedFloorNos.map((floorNo, index) => {
    const floorUnits = floorMap.get(floorNo);
    const zMin = floorUnits[0]?.z_min ?? index * 3.0;
    const zMax = floorUnits[0]?.z_max ?? (index + 1) * 3.0;

    return {
      floor_no: index + 1, // 1 to 5
      raw_floor_no: floorNo,
      elevation_base: zMin,
      elevation_top: zMax,
      units: floorUnits.map((u, idx) => ({
        ulpin: u.ulpin,
        unit_number: makeUnitNumber(floorNo, u.unit),
        owner: u.owner,
        type: u.type,
        area_sqm: 68.5, // Default area for demo
        status: 'Clear Title',
        geometry: buildUnitGeometry(idx, floorUnits.length, u.z_min, u.z_max),
      })),
    };
  });

  // Build underground array
  const underground = undergroundUnits.map((u, idx) => ({
    ulpin: u.ulpin,
    floor_no: u.floor,
    unit_number: makeUnitNumber(u.floor, u.unit),
    owner: u.owner,
    type: u.type,
    area_sqm: 60.0,
    status: u.type === 'parking' ? 'Allotted' : 'Infrastructure',
    geometry: buildUnitGeometry(idx, undergroundUnits.length, u.z_min, u.z_max),
  }));

  return {
    building_id: buildingInfo?.id || 'B001',
    building_name: buildingInfo?.building_name || `Bandra Heights (Parcel P001)`,
    city: buildingInfo?.city || 'Mumbai, Maharashtra',
    address: buildingInfo?.address || 'Plot 42, Bandra West, Mumbai',
    total_above_ground_floors: floors.length,
    total_underground_levels: underground.length > 0 ? 1 : 0,
    sanctioned_height_m: buildingInfo?.total_height || 15.0,
    parcel_id: buildingInfo?.ulpin_prefix || 'MH-MUM-P001',
    floors,
    underground,
  };
}

/**
 * Primary Building Data Loader.
 *
 * @param {string} buildingId - Building identifier (default: "B001")
 * @returns {Promise<Object>} Building 3D Cadastre data in nested shape
 */
export async function fetchBuildingData(buildingId = 'B001') {
  if (USE_MOCK_DATA) {
    const mock = MOCK_BUILDING_DATA[buildingId] || MOCK_BUILDING_DATA['B001'];
    return mock;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    // Try relative URL first (Vite proxy), fallback to direct 127.0.0.1
    const endpoint = `/buildings/${buildingId}/units`;
    let unitsRes;
    try {
      unitsRes = await fetch(endpoint, { signal: controller.signal });
    } catch {
      unitsRes = await fetch(`${API_BASE_URL}/buildings/${buildingId}/units`, { signal: controller.signal });
    }

    let buildingRes;
    try {
      buildingRes = await fetch(`/buildings/${buildingId}`, { signal: controller.signal }).catch(() => null);
    } catch {
      buildingRes = await fetch(`${API_BASE_URL}/buildings/${buildingId}`, { signal: controller.signal }).catch(() => null);
    }

    clearTimeout(timeoutId);

    if (!unitsRes || !unitsRes.ok) {
      throw new Error(`HTTP ${unitsRes?.status || 'Offline'}`);
    }

    const units = await unitsRes.json();
    const buildingInfo = buildingRes?.ok ? await buildingRes.json() : null;

    // Transform flat backend response → nested frontend shape
    return transformBackendData(units, buildingInfo);
  } catch (error) {
    console.warn(
      `[3D-ULPIN] Backend fetch failed (${error.message}). Falling back to mock data.`
    );
    return MOCK_BUILDING_DATA[buildingId] || MOCK_BUILDING_DATA['B001'];
  }
}

/**
 * Helper to get all available building IDs.
 */
export function getAvailableBuildings() {
  if (USE_MOCK_DATA) {
    return Object.values(MOCK_BUILDING_DATA).map((b) => ({
      id: b.building_id,
      name: b.building_name,
      city: b.city,
    }));
  }

  return [
    { id: 'B001', name: 'Bandra Heights (Parcel P001)', city: 'Mumbai, Maharashtra' },
  ];
}
