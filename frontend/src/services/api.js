/**
 * 3D ULPIN Building Data Service
 * 
 * SWAPPING MOCK DATA FOR REAL BACKEND API:
 * Change `USE_MOCK_DATA` below from `true` to `false`.
 * When false, `fetchBuildingData()` will fetch directly from `API_BASE_URL`.
 */

import { MOCK_BUILDING_DATA } from '../data/mockBuildingData';

// ============================================================================
// ⚙️ API SWAP CONFIGURATION (Change USE_MOCK_DATA to switch to real backend)
// ============================================================================
export const USE_MOCK_DATA = true; // <-- SWAP POINT: Set to `false` when backend on localhost:8000 is ready
export const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Primary Building Data Loader.
 * Returns building matching contract:
 * {
 *   "building_id": "B001",
 *   "floors": [
 *     {
 *       "floor_no": 1,
 *       "units": [
 *         {
 *           "ulpin": "KA-DVG-P001-B001-F01-U01-Z0-3",
 *           "geometry": { ... },
 *           "owner": "Ramesh Patil",
 *           "type": "residential"
 *         }
 *       ]
 *     }
 *   ],
 *   "underground": [
 *     {
 *       "ulpin": "KA-DVG-P001-B001-FB1-U01-Z-3-0",
 *       "type": "parking"
 *     }
 *   ]
 * }
 *
 * @param {string} buildingId - Building identifier (default: "B001")
 * @returns {Promise<Object>} Building 3D Cadastre data
 */
export async function fetchBuildingData(buildingId = 'B001') {
  if (USE_MOCK_DATA) {
    // Return mock data instantaneously
    const mock = MOCK_BUILDING_DATA[buildingId] || MOCK_BUILDING_DATA['B001'];
    return mock;
  }

  // Real API Call to FastAPI / Backend Server
  try {
    const response = await fetch(`${API_BASE_URL}/building/${buildingId}`);
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`[3D-ULPIN] Real API fetch failed (${error.message}). Falling back to mock data.`);
    return MOCK_BUILDING_DATA[buildingId] || MOCK_BUILDING_DATA['B001'];
  }
}

/**
 * Helper to get all available building IDs for demo switching
 */
export function getAvailableBuildings() {
  return Object.values(MOCK_BUILDING_DATA).map(b => ({
    id: b.building_id,
    name: b.building_name,
    city: b.city
  }));
}
