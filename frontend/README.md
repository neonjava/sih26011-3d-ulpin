# 3D-ULPIN Cadastre Visualizer (Frontend)

Interactive 3D Cadastre visualizer built for hackathon demonstration. Renders stacked volumetric property units with Unique Land Parcel Identification Numbers (ULPIN / Bhu-Aadhaar) conforming to the **ISO 19152 (3D-LADM)** standard.

---

## 🚀 How to Run Locally

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local Vite development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:5173
   ```

---

## 🔌 Mock Data to Real API Swap Point

The frontend currently runs against mock data matching the exact JSON contract shape.

### 📍 Swap Location:
File: **[`src/services/api.js`](src/services/api.js)**

To connect to your real backend running at `http://localhost:8000`:

```javascript
// Change line 11 in src/services/api.js:
export const USE_MOCK_DATA = false; // <-- Change from `true` to `false`
export const API_BASE_URL = 'http://localhost:8000/api';
```

All data loading flows through the single async function **`fetchBuildingData(buildingId = 'B001')`**. Once switched, it will automatically query `http://localhost:8000/api/building/B001`.

---

## 📋 API Contract JSON Shape

The frontend expects and renders the following JSON shape from `fetchBuildingData()`:

```json
{
  "building_id": "B001",
  "floors": [
    {
      "floor_no": 1,
      "units": [
        {
          "ulpin": "KA-DVG-P001-B001-F01-U01-Z0-3",
          "geometry": {
            "x": -3.8,
            "z": -3.8,
            "width": 7.2,
            "depth": 7.2,
            "height": 2.7,
            "z_min": 0,
            "z_max": 3
          },
          "owner": "Ramesh Patil",
          "type": "residential"
        }
      ]
    }
  ],
  "underground": [
    {
      "ulpin": "KA-DVG-P001-B001-FB1-U01-Z-3-0",
      "geometry": {
        "x": -3.8,
        "z": -3.8,
        "width": 7.2,
        "depth": 7.2,
        "height": 2.7,
        "z_min": -3,
        "z_max": 0
      },
      "owner": "Society Parking",
      "type": "parking"
    }
  ]
}
```

---

## ✨ Features for Hackathon Judges

- **Stacked Floor Boxes**: Renders 5 floors above ground and 1 underground level (B1), with each floor partitioned into 2-3 volumetric unit boxes.
- **Color-Coded Unit Types**:
  - 🔵 **Residential**: Crisp sky blue (`#0284c7`)
  - 🟠 **Parking**: Warm amber gold (`#d97706`)
  - 🟣 **Utility**: Tech violet (`#7c3aed`)
- **Unit Inspector Panel**: Click any 3D unit to view its full ULPIN (with 1-click copy), owner name, unit type, elevation bounds ($Z_{min}$ to $Z_{max}$), and volumetric dimensions.
- **Underground Toggle**: Toggle button to instantly show or hide the subsurface parking layer.
- **Exploded Floor View Slider**: Interactive slider (0.0x to 2.0x) to expand and separate floor slabs vertically for easy internal inspection.
- **Orbit Navigation & Presets**: Smooth orbit, rotate, pan, and zoom controls with 1-click presets (3D Orbit, Front, Top 2D Plan, Side, and Reset).
- **Search & Filter**: Search by ULPIN string or owner name, or filter by unit type (Residential, Parking, Utility).
