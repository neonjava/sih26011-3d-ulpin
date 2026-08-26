"""
Vinoba Nagara, Davanagere - 3D Land Cadastre & Volumetric Anti-Fraud System
-------------------------------------------------------------------------
Accurate geography, architecture, and Kaveri 2.0 land registration for:
Location: 3rd Main, Vinoba Nagara, Davanagere, Karnataka - 577004
Coordinates: 14.4671° N, 75.9042° E
"""

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from phase1_extruder import extrude_2d_to_3d
from phase2_doc_reader import extract_deed_parameters
from phase3_fraud_checker import check_3d_conflict

app = FastAPI(title="Vinoba Nagara Davanagere 3D Land Cadastre")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Realistic Cadastral Plot Metadata for Vinoba Nagara, Davanagere
VINOBA_NAGARA_PROPERTY = {
    "locality": "Vinoba Nagara (Near MCC 'A' Block)",
    "city": "Davanagere, Karnataka",
    "pincode": "577004",
    "street": "3rd Main Road, Vinoba Nagara",
    "assessment_no": "Assessment No. 142/A-3",
    "survey_no": "City Survey No. 894/2",
    "ulpin": "KA14-004-8942103",
    "building_name": "Sri Raghavendra Residency",
    "lat": 14.4671,
    "lon": 75.9042,
    "plot_area_sqm": 160.0
}

# 2D Ground Polygon (16m frontage x 10m depth)
LAND_PARCEL_2D = [(0.0, 0.0), (16.0, 0.0), (16.0, 10.0), (0.0, 10.0)]

# Pre-registered units in Vinoba Nagara database
# Canara Bank (Davanagere Main Branch) holds a registered mortgage on Flat 301 on Floor 3
registered_units = [
    {
        "flat_number": "301",
        "floor_number": 3,
        "owner_name": "Manjunath Swamy",
        "bank": "Canara Bank (Davanagere PB Road Branch)",
        "cersai_id": "CERSAI-KA-DVG-2023-88912",
        "loan_amount": "₹ 55,00,000",
        **extrude_2d_to_3d(LAND_PARCEL_2D, floor_number=3, floor_height=3.0, base_elevation=3.0) # Stilt ground parking at 0-3m
    }
]

class DeedRequest(BaseModel):
    deed_text: str
    target_bank: str = "HDFC Bank (Davanagere Branch)"
    loan_amount: str = "₹ 60,00,000"

@app.get("/api/registry")
def get_registry():
    return {
        "property_info": VINOBA_NAGARA_PROPERTY,
        "parcel_2d": LAND_PARCEL_2D,
        "registered_units": registered_units
    }

@app.post("/api/process-deed")
def process_deed(req: DeedRequest):
    extracted = extract_deed_parameters(req.deed_text)
    
    floor_num = extracted["floor_number"] if extracted["floor_number"] is not None else 1
    floor_height = extracted["floor_height_meters"]
    
    # Ground floor is stilt parking (0-3m), so residential floors start at base_elevation=3.0m
    extruded_3d = extrude_2d_to_3d(LAND_PARCEL_2D, floor_number=floor_num, floor_height=floor_height, base_elevation=3.0)
    extruded_3d["flat_number"] = extracted["flat_number"] or f"Flat-{floor_num}01"
    extruded_3d["owner_name"] = extracted["owner_name"] or "Applicant"
    extruded_3d["bank"] = req.target_bank
    extruded_3d["loan_amount"] = req.loan_amount
    
    conflict_result = check_3d_conflict(extruded_3d, registered_units)
    
    if not conflict_result["has_fraud_clash"]:
        registered_units.append(extruded_3d)
        
    return {
        "extracted_parameters": extracted,
        "extruded_3d": extruded_3d,
        "conflict_result": conflict_result,
        "all_units": registered_units
    }

@app.get("/", response_class=HTMLResponse)
def serve_ui():
    return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vinoba Nagara, Davanagere • 3D Volumetric Land Cadastre</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Leaflet CSS & JS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <!-- Three.js & OrbitControls -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        #leafletMap { height: 100%; width: 100%; }
    </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen flex flex-col">

    <!-- Clean Government / Municipal Header -->
    <header class="bg-white border-b border-slate-200 shadow-sm px-6 py-3.5 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                3D
            </div>
            <div>
                <h1 class="text-base font-bold text-slate-900 leading-none">
                    Davanagere City Land Cadastre • 3D Volumetric Registry
                </h1>
                <p class="text-xs text-slate-500 mt-1 font-medium">
                    3rd Main Road, Vinoba Nagara • City Survey No. 894/2 • Kaveri 2.0 & Bhoomi System
                </p>
            </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 text-xs">
            <button id="btnMapView" onclick="switchView('MAP')" class="px-4 py-2 rounded-lg font-semibold bg-white text-blue-700 shadow-sm border border-slate-200 transition">
                🗺️ Vinoba Nagara Map
            </button>
            <button id="btnStreetView" onclick="switchView('STREET')" class="px-4 py-2 rounded-lg font-semibold text-slate-600 hover:text-slate-900 transition">
                🚶 3D Street View
            </button>
        </div>
    </header>

    <!-- Main Workspace -->
    <main class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl w-full mx-auto">

        <!-- Left Column: Legal Deeds & Anti-Fraud Verification -->
        <div class="lg:col-span-5 flex flex-col gap-4">
            
            <!-- Deed Selection Panel -->
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div class="flex items-center justify-between mb-3">
                    <h2 class="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Property Deeds & Loan Verification
                    </h2>
                    <span class="text-[10px] font-bold font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                        Kaveri 2.0 SRO Davanagere
                    </span>
                </div>

                <!-- 3 Realistic Davanagere Scenarios -->
                <div class="space-y-2 mb-4">
                    <button onclick="loadPreset('A')" class="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/80 text-xs transition">
                        <div class="flex items-center justify-between font-bold text-slate-900">
                            <span>📄 Flat 101 (1st Floor)</span>
                            <span class="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Clear Title</span>
                        </div>
                        <div class="text-[11px] text-slate-500 mt-0.5">Legitimate deed for Floor 1 on 3rd Main, Vinoba Nagara</div>
                    </button>
                    
                    <button onclick="loadPreset('B')" class="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/80 text-xs transition">
                        <div class="flex items-center justify-between font-bold text-slate-900">
                            <span>📄 Flat 301 (3rd Floor - Canara Bank)</span>
                            <span class="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Active Mortgage</span>
                        </div>
                        <div class="text-[11px] text-slate-500 mt-0.5">Registered mortgage held by Canara Bank Davanagere</div>
                    </button>

                    <button onclick="loadPreset('C')" class="w-full text-left p-3 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50 text-xs transition">
                        <div class="flex items-center justify-between font-bold text-rose-900">
                            <span>🚨 Duplicate Loan on Flat 301 (HDFC Bank)</span>
                            <span class="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">Duplicate Fraud</span>
                        </div>
                        <div class="text-[11px] text-rose-700 mt-0.5">Scammer attempting 2nd mortgage on the same 3rd floor flat!</div>
                    </button>
                </div>

                <!-- Textarea -->
                <label class="block text-xs font-semibold text-slate-700 mb-1.5">
                    Deed Schedule & Legal Description:
                </label>
                <textarea id="deedText" rows="4" class="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" placeholder="Paste deed text..."></textarea>

                <!-- Extrude Button -->
                <button onclick="processDeed()" id="btnProcess" class="mt-3.5 w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition">
                    <span>⚡ Extrude 3D Volume & Inspect from Street</span>
                </button>
            </div>

            <!-- Verification Analysis Result Panel -->
            <div id="resultsCard" class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hidden space-y-3">
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800">
                    3D Spatial Verification Analysis
                </h3>

                <div id="decisionBox" class="p-3.5 rounded-xl text-xs font-medium"></div>

                <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2 font-mono">
                    <div class="flex justify-between"><span class="text-slate-500 font-sans">Unit Identifier:</span> <strong id="resFlat" class="text-slate-900"></strong></div>
                    <div class="flex justify-between"><span class="text-slate-500 font-sans">Floor Level:</span> <strong id="resFloor" class="text-slate-900"></strong></div>
                    <div class="flex justify-between"><span class="text-slate-500 font-sans">3D Elevation:</span> <strong id="resZRange" class="text-blue-700 font-bold"></strong></div>
                    <div class="flex justify-between"><span class="text-slate-500 font-sans">Location:</span> <strong id="resLand" class="text-slate-900"></strong></div>
                </div>
            </div>

        </div>

        <!-- Right Column: Interactive Davanagere Map & 3D Street Model -->
        <div class="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col min-h-[520px]">
            
            <div class="flex items-center justify-between mb-3">
                <div>
                    <h2 id="viewTitle" class="text-xs font-bold uppercase tracking-wider text-slate-900">
                        🗺️ Vinoba Nagara Geographic Cadastre Map
                    </h2>
                    <p id="viewSubtitle" class="text-xs text-slate-500 font-medium">
                        Property: Sri Raghavendra Residency, 3rd Main, Vinoba Nagara, Davanagere
                    </p>
                </div>

                <!-- Altitude View Buttons in Street Mode -->
                <div id="streetControls" class="hidden flex items-center gap-1.5 text-xs">
                    <button onclick="setCameraHeight(1.7)" class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200">
                        🚶 Street (1.7m)
                    </button>
                    <button onclick="setCameraHeight(9.0)" class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200">
                        👁️ 3rd Floor (9m)
                    </button>
                    <button onclick="setCameraHeight(22.0)" class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200">
                        🦅 Rooftop View
                    </button>
                </div>
            </div>

            <!-- Viewport Container -->
            <div class="relative w-full flex-1 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 min-h-[440px]">
                
                <!-- 1. Real Davanagere Leaflet Map -->
                <div id="leafletMap" class="absolute inset-0 z-10"></div>

                <!-- 2. Realistic 3D Three.js Street View -->
                <div id="threeContainer" class="absolute inset-0 z-0 hidden"></div>

                <!-- Floating Instruction Pill -->
                <div id="streetHelpPill" class="hidden absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-700 shadow-sm font-medium">
                    🖱️ <strong>Mouse Drag</strong>: Look around 360° on 3rd Main • <strong>Scroll</strong>: Move closer
                </div>

            </div>

        </div>

    </main>

    <!-- Application Script -->
    <script>
        const PRESETS = {
            'A': `GOVERNMENT OF KARNATAKA - DEPARTMENT OF STAMPS & REGISTRATION
SUB-REGISTRAR OFFICE: DAVANAGERE URBAN
KAVERI 2.0 INDEX-II REGISTER EXTRACT (YEAR 2024)

SCHEDULE A (Land): City Survey No. 894/2, Assessment No. 142/A-3, 3rd Main Road, Vinoba Nagara, Davanagere - 577004.
SCHEDULE B (Unit): Flat No. 101 on the 1st Floor, Sri Raghavendra Residency.
Carpet Area: 85 sq.meters (915 sq.ft), Slab Height: 10 feet.
Purchaser: Chetan Kumar (Clear Title - ICICI Bank Housing Loan)`,

            'B': `GOVERNMENT OF KARNATAKA - DEPARTMENT OF STAMPS & REGISTRATION
SUB-REGISTRAR OFFICE: DAVANAGERE URBAN
KAVERI 2.0 INDEX-II REGISTER EXTRACT (YEAR 2023)

SCHEDULE A (Land): City Survey No. 894/2, Assessment No. 142/A-3, 3rd Main Road, Vinoba Nagara, Davanagere - 577004.
SCHEDULE B (Unit): Flat No. 301 on the 3rd Floor, Sri Raghavendra Residency.
Carpet Area: 85 sq.meters (915 sq.ft), Slab Height: 10 feet.
Purchaser: Manjunath Swamy (Mortgaged to Canara Bank Davanagere PB Road Branch)`,

            'C': `GOVERNMENT OF KARNATAKA - DEPARTMENT OF STAMPS & REGISTRATION
DUPLICATE TITLE DEED PRESENTED FOR LOAN
SCHEDULE A (Land): City Survey No. 894/2, Assessment No. 142/A-3, 3rd Main Road, Vinoba Nagara, Davanagere - 577004.
SCHEDULE B (Unit): Flat No. 301 on the 3rd Floor, Sri Raghavendra Residency.
Applicant: Vikram Shettar (Applying for ₹60 Lakh Loan from HDFC Bank)`
        };

        function loadPreset(key) {
            document.getElementById('deedText').value = PRESETS[key];
        }
        loadPreset('C');

        let currentView = 'MAP';

        // 1. Initialize Davanagere Leaflet Map (Vinoba Nagara Coordinates)
        let map;
        function initMap() {
            // Centered on Vinoba Nagara, Davanagere
            map = L.map('leafletMap').setView([14.4671, 75.9042], 17);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap | Vinoba Nagara Cadastre'
            }).addTo(map);

            // Vinoba Nagara Cadastral Plot Polygon (3rd Main Road)
            const plot = L.polygon([
                [14.4673, 75.9040],
                [14.4673, 75.9045],
                [14.4669, 75.9045],
                [14.4669, 75.9040]
            ], {
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.35,
                weight: 3
            }).addTo(map);

            plot.bindPopup(`
                <div class="text-xs p-1">
                    <strong class="text-blue-700 text-sm block">Sri Raghavendra Residency</strong>
                    <div class="text-slate-700 font-medium mt-1">3rd Main Road, Vinoba Nagara, Davanagere</div>
                    <div class="text-slate-500 text-[11px] font-mono mt-0.5">CS No. 894/2 • ULPIN: KA14-004-8942103</div>
                    <button onclick="switchView('STREET')" class="mt-2.5 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition">
                        🚶 Enter 3D Street View
                    </button>
                </div>
            `).openPopup();
        }

        // 2. Realistic Three.js 3D Street Scene (Vinoba Nagara Residential Aesthetic)
        let scene, camera, renderer, controls;
        let unitMeshes = [];

        function initStreet3D() {
            const container = document.getElementById('threeContainer');
            const w = container.clientWidth || 600;
            const h = container.clientHeight || 440;

            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf1f5f9); // Clean daylight atmosphere
            scene.fog = new THREE.FogExp2(0xf1f5f9, 0.008);

            // First-person camera on Vinoba Nagara 3rd Main Road looking at building
            camera = new THREE.PerspectiveCamera(48, w / h, 0.2, 500);
            camera.position.set(8, 1.7, 26); // 1.7m eye height on street

            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(w, h);
            renderer.shadowMap.enabled = true;
            container.appendChild(renderer.domElement);

            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.08;
            controls.target.set(8, 7, 5); // Looking up towards 3rd floor
            controls.maxDistance = 55;
            controls.minDistance = 2;
            controls.maxPolarAngle = Math.PI / 2 + 0.02;

            // Sunlight & Ambient Lighting
            const ambient = new THREE.AmbientLight(0xffffff, 1.15);
            scene.add(ambient);

            const sun = new THREE.DirectionalLight(0xfffdf0, 1.6);
            sun.position.set(30, 50, 35);
            sun.castShadow = true;
            scene.add(sun);

            // Build Vinoba Nagara Street Environment (Road, Sidewalk, Trees, Water Tank)
            buildVinobaNagaraStreet(scene);

            // Load registered units
            loadInitialRegistry();

            animateStreet();
        }

        function animateStreet() {
            requestAnimationFrame(animateStreet);
            controls.update();
            renderer.render(scene, camera);
        }

        function buildVinobaNagaraStreet(scene) {
            // 1. Vinoba Nagara 3rd Main Asphalt Road
            const roadGeom = new THREE.PlaneGeometry(90, 26);
            const roadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
            const road = new THREE.Mesh(roadGeom, roadMat);
            road.rotation.x = -Math.PI / 2;
            road.position.set(8, 0.0, 24);
            scene.add(road);

            // Yellow Road Center Marking
            const lineGeom = new THREE.PlaneGeometry(90, 0.35);
            const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
            const centerLine = new THREE.Mesh(lineGeom, lineMat);
            centerLine.rotation.x = -Math.PI / 2;
            centerLine.position.set(8, 0.02, 24);
            scene.add(centerLine);

            // 2. Concrete Sidewalk & Kerb
            const walkGeom = new THREE.BoxGeometry(90, 0.25, 4.5);
            const walkMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });
            const sidewalk = new THREE.Mesh(walkGeom, walkMat);
            sidewalk.position.set(8, 0.12, 13);
            scene.add(sidewalk);

            // 3. Cadastral Plot Ground Base (Plot 142/A)
            const plotBaseGeom = new THREE.BoxGeometry(18, 0.1, 14);
            const plotBaseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
            const plotBase = new THREE.Mesh(plotBaseGeom, plotBaseMat);
            plotBase.position.set(8, 0.05, 5);
            scene.add(plotBase);

            // Blue Boundary Line
            const edges = new THREE.EdgesGeometry(plotBaseGeom);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x2563eb, linewidth: 2 }));
            plotBase.add(line);

            // 4. Ground Stilt Parking Pillars (Typical Karnataka Apartment Ground Floor)
            const pillarGeom = new THREE.BoxGeometry(0.8, 3.0, 0.8);
            const pillarMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
            
            [1.5, 8.0, 14.5].forEach(x => {
                [0.5, 9.5].forEach(z => {
                    const pillar = new THREE.Mesh(pillarGeom, pillarMat);
                    pillar.position.set(x, 1.5, z);
                    scene.add(pillar);
                });
            });

            // 5. Roadside Greenery (Karnataka Neem / Ashoka Tree representation)
            function addTree(x, z) {
                const trunkGeom = new THREE.CylinderGeometry(0.25, 0.35, 3.5, 8);
                const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
                const trunk = new THREE.Mesh(trunkGeom, trunkMat);
                trunk.position.set(x, 1.75, z);
                scene.add(trunk);

                const foliageGeom = new THREE.DodecahedronGeometry(1.8, 1);
                const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
                const foliage = new THREE.Mesh(foliageGeom, foliageMat);
                foliage.position.set(x, 4.2, z);
                scene.add(foliage);
            }
            addTree(-8, 13);
            addTree(24, 13);

            // 6. Rooftop Sintex Water Tank & Solar Water Heater (Authentic South Indian detail)
            const tankGeom = new THREE.CylinderGeometry(0.9, 0.9, 1.4, 16);
            const tankMat = new THREE.MeshStandardMaterial({ color: 0x1e293b }); // Black Sintex tank
            const tank = new THREE.Mesh(tankGeom, tankMat);
            tank.position.set(13, 16.0, 3);
            scene.add(tank);
        }

        function setCameraHeight(y) {
            camera.position.y = y;
            controls.target.set(8, y + 2, 5);
            controls.update();
        }

        // Render 3D Units on Plot
        function render3DUnits(units, highlightClash = false) {
            unitMeshes.forEach(m => scene.remove(m));
            unitMeshes = [];

            units.forEach(u => {
                const zMin = u.elevation_range.z_bottom_meters;
                const zMax = u.elevation_range.z_top_meters;
                const height = zMax - zMin;
                const floorNum = u.floor_number;

                const isConflict = highlightClash && u.flat_number === '301';
                
                // Architectural Apartment Unit Box
                const geom = new THREE.BoxGeometry(15.2, height - 0.25, 9.2);
                
                // Color coding: Warm ivory/cream for residential floors, Red for conflict
                const mat = new THREE.MeshStandardMaterial({
                    color: isConflict ? 0xef4444 : (floorNum === 3 ? 0x0284c7 : 0x0ea5e9),
                    emissive: isConflict ? 0xdc2626 : 0x0369a1,
                    emissiveIntensity: isConflict ? 0.75 : 0.05,
                    transparent: true,
                    opacity: 0.85,
                    roughness: 0.25
                });

                const mesh = new THREE.Mesh(geom, mat);
                mesh.position.set(8, zMin + height / 2, 5);

                // Architectural Balcony / Chajja line
                const edgeGeom = new THREE.EdgesGeometry(geom);
                const edgeLine = new THREE.LineSegments(edgeGeom, new THREE.LineBasicMaterial({
                    color: isConflict ? 0xffffff : 0xbae6fd,
                    linewidth: 1.5
                }));
                mesh.add(edgeLine);

                scene.add(mesh);
                unitMeshes.push(mesh);
            });
        }

        async function loadInitialRegistry() {
            try {
                const res = await fetch('/api/registry');
                const data = await res.json();
                render3DUnits(data.registered_units);
            } catch(e) {
                console.error(e);
            }
        }

        function switchView(mode) {
            currentView = mode;
            const mapEl = document.getElementById('leafletMap');
            const threeEl = document.getElementById('threeContainer');
            const pillEl = document.getElementById('streetHelpPill');
            const controlsEl = document.getElementById('streetControls');
            const btnMap = document.getElementById('btnMapView');
            const btnStreet = document.getElementById('btnStreetView');
            const vTitle = document.getElementById('viewTitle');
            const vSub = document.getElementById('viewSubtitle');

            if (mode === 'STREET') {
                mapEl.classList.add('hidden');
                threeEl.classList.remove('hidden');
                pillEl.classList.remove('hidden');
                controlsEl.classList.remove('hidden');

                btnStreet.className = 'px-4 py-2 rounded-lg font-semibold bg-white text-blue-700 shadow-sm border border-slate-200 transition';
                btnMap.className = 'px-4 py-2 rounded-lg font-semibold text-slate-600 hover:text-slate-900 transition';

                vTitle.innerText = '🚶 3D Street View • 3rd Main Road, Vinoba Nagara';
                vSub.innerText = 'Looking up at Sri Raghavendra Residency from street level (1.7m)';

                if (!renderer) {
                    initStreet3D();
                } else {
                    const w = threeEl.clientWidth;
                    const h = threeEl.clientHeight;
                    camera.aspect = w / h;
                    camera.updateProjectionMatrix();
                    renderer.setSize(w, h);
                }
            } else {
                threeEl.classList.add('hidden');
                pillEl.classList.add('hidden');
                controlsEl.classList.add('hidden');
                mapEl.classList.remove('hidden');

                btnMap.className = 'px-4 py-2 rounded-lg font-semibold bg-white text-blue-700 shadow-sm border border-slate-200 transition';
                btnStreet.className = 'px-4 py-2 rounded-lg font-semibold text-slate-600 hover:text-slate-900 transition';

                vTitle.innerText = '🗺️ Vinoba Nagara Geographic Cadastre Map';
                vSub.innerText = 'Property: Sri Raghavendra Residency, 3rd Main, Vinoba Nagara, Davanagere';
                
                setTimeout(() => map.invalidateSize(), 100);
            }
        }

        async function processDeed() {
            const text = document.getElementById('deedText').value;
            const btn = document.getElementById('btnProcess');
            btn.innerHTML = '<span>⏳ Extruding & Checking 3D Collisions...</span>';
            btn.disabled = true;

            try {
                const res = await fetch('/api/process-deed', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deed_text: text })
                });
                const data = await res.json();

                // Switch to 3D Street View automatically
                switchView('STREET');

                // Show Results Card
                document.getElementById('resultsCard').classList.remove('hidden');
                document.getElementById('resFlat').innerText = 'Flat ' + data.extracted_parameters.flat_number;
                document.getElementById('resFloor').innerText = 'Floor ' + data.extracted_parameters.floor_number;
                document.getElementById('resZRange').innerText = '+' + data.extruded_3d.elevation_range.z_bottom_meters + 'm to +' + data.extruded_3d.elevation_range.z_top_meters + 'm above ground';
                document.getElementById('resLand').innerText = 'CS No. 894/2, 3rd Main, Vinoba Nagara';

                const dBox = document.getElementById('decisionBox');
                if (data.conflict_result.has_fraud_clash) {
                    dBox.className = 'p-4 rounded-xl text-xs font-semibold bg-rose-50 border border-rose-300 text-rose-900 space-y-1.5';
                    dBox.innerHTML = `
                        <div class="text-sm font-bold text-rose-700">🚨 DUPLICATE MORTGAGE FRAUD DETECTED</div>
                        <div>${data.conflict_result.message}</div>
                        <div class="text-[11px] font-mono mt-1 text-slate-700">Existing Mortgagee: <strong>${data.conflict_result.conflict_details.conflicting_bank}</strong> (${data.conflict_result.conflict_details.conflicting_cersai_id})</div>
                    `;
                    render3DUnits(data.all_units, true);
                } else {
                    dBox.className = 'p-4 rounded-xl text-xs font-semibold bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-1.5';
                    dBox.innerHTML = `
                        <div class="text-sm font-bold text-emerald-700">✅ TITLE CLEAR: APPROVED TO LEND</div>
                        <div>${data.conflict_result.message}</div>
                        <div class="text-[11px] mt-1 text-emerald-800">Successfully extruded & registered Floor ${data.extracted_parameters.floor_number} on 3rd Main Road, Vinoba Nagara.</div>
                    `;
                    render3DUnits(data.all_units, false);
                }

            } catch(e) {
                alert('Error processing deed: ' + e);
            } finally {
                btn.innerHTML = '<span>⚡ Extrude 3D Volume & Inspect from Street</span>';
                btn.disabled = false;
            }
        }

        window.onload = () => {
            initMap();
        };
    </script>
</body>
</html>
    """

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
