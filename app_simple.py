"""
3D Land Registry & Anti-Fraud Extruder with Davanagere Street View
------------------------------------------------------------------
Single-file FastAPI server featuring:
- Real Davanagere, Karnataka GIS Map (Leaflet / OpenStreetMap)
- First-Person 3D Street View with Mouse Look-Around
- 2D-to-3D Deed Extrusion & Volumetric Anti-Fraud Engine
"""

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from phase1_extruder import extrude_2d_to_3d
from phase2_doc_reader import extract_deed_parameters
from phase3_fraud_checker import check_3d_conflict

app = FastAPI(title="3D Land Registry - Davanagere Cadastre")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Davanagere Plot Coordinates & Metadata
DAVANAGERE_PLOT = {
    "city": "Davanagere, Karnataka",
    "locality": "Vidyanagar Main Road (Near PB Road)",
    "survey_no": "Survey No. 482/3",
    "ulpin": "KA14-002-9841234",
    "building_name": "Durga Heights Residency",
    "lat": 14.4644,
    "lon": 75.9218,
    "plot_dimensions": "12m x 10m (120 sq.m)"
}

LAND_PARCEL_2D = [(0.0, 0.0), (12.0, 0.0), (12.0, 10.0), (0.0, 10.0)]

# Pre-registered units in database (Canara Bank / SBI holds mortgage on Flat 402, 4th Floor)
registered_units = [
    {
        "flat_number": "402",
        "floor_number": 4,
        "owner_name": "Ramesh Patil",
        "bank": "Canara Bank (Davanagere Branch)",
        "cersai_id": "CERSAI-KA-2023-44109",
        "loan_amount": "₹ 65,00,000",
        **extrude_2d_to_3d(LAND_PARCEL_2D, floor_number=4, floor_height=3.0)
    }
]

class DeedRequest(BaseModel):
    deed_text: str
    target_bank: str = "HDFC Bank (Davanagere)"
    loan_amount: str = "₹ 75,00,000"

@app.get("/api/registry")
def get_registry():
    return {
        "plot_info": DAVANAGERE_PLOT,
        "parcel_2d": LAND_PARCEL_2D,
        "registered_units": registered_units
    }

@app.post("/api/process-deed")
def process_deed(req: DeedRequest):
    extracted = extract_deed_parameters(req.deed_text)
    
    floor_num = extracted["floor_number"] if extracted["floor_number"] is not None else 1
    floor_height = extracted["floor_height_meters"]
    
    extruded_3d = extrude_2d_to_3d(LAND_PARCEL_2D, floor_number=floor_num, floor_height=floor_height)
    extruded_3d["flat_number"] = extracted["flat_number"] or f"Unit-{floor_num}01"
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
    <title>3D Land Registry & Anti-Fraud Cadastre | Davanagere</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Leaflet CSS & JS for Davanagere Map -->
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

    <!-- Header -->
    <header class="bg-white border-b border-slate-200 shadow-sm px-6 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                3D
            </div>
            <div>
                <h1 class="text-base font-bold text-slate-900 leading-none">
                    Davanagere 3D Land Cadastre & Anti-Fraud System
                </h1>
                <p class="text-xs text-slate-500 mt-1">
                    Vidyanagar Main Road • Survey No. 482/3 • Kaveri 2.0 & Bhoomi Cadastre
                </p>
            </div>
        </div>

        <!-- View Mode Switcher Pills -->
        <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 text-xs">
            <button id="btnMapView" onclick="switchView('MAP')" class="px-3.5 py-1.5 rounded-lg font-semibold bg-white text-blue-700 shadow-sm border border-slate-200 transition">
                🗺️ Davanagere Map
            </button>
            <button id="btnStreetView" onclick="switchView('STREET')" class="px-3.5 py-1.5 rounded-lg font-semibold text-slate-600 hover:text-slate-900 transition">
                🚶 3D Street View
            </button>
        </div>
    </header>

    <!-- Main Workspace -->
    <main class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl w-full mx-auto">

        <!-- Left Panel: Deed Input & Fraud Results -->
        <div class="lg:col-span-5 flex flex-col gap-4">
            
            <!-- Deed Input Card -->
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Step 1: Test with Davanagere Sale Deeds
                </h2>

                <!-- 3 Quick Deed Buttons -->
                <div class="space-y-2 mb-3">
                    <button onclick="loadPreset('A')" class="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 text-xs transition">
                        <div class="font-bold text-slate-800">📄 Deed A: Flat 101 (1st Floor, Vidyanagar)</div>
                        <div class="text-[11px] text-slate-500">Legitimate ground level title (Clear Title)</div>
                    </button>
                    
                    <button onclick="loadPreset('B')" class="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 text-xs transition">
                        <div class="font-bold text-slate-800">📄 Deed B: Flat 402 (4th Floor - Canara Bank Mortgaged)</div>
                        <div class="text-[11px] text-slate-500">Original legitimate mortgage in Davanagere Registry</div>
                    </button>

                    <button onclick="loadPreset('C')" class="w-full text-left p-2.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-xs transition">
                        <div class="font-bold text-rose-800">🚨 Deed C: Duplicate Flat 402 (Fraud Loan Attempt)</div>
                        <div class="text-[11px] text-rose-600">Scammer attempting 2nd loan for HDFC Bank on Floor 4!</div>
                    </button>
                </div>

                <!-- Textarea -->
                <label class="block text-xs font-semibold text-slate-600 mb-1">
                    Kaveri 2.0 / Deed Text:
                </label>
                <textarea id="deedText" rows="4" class="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" placeholder="Paste deed text here..."></textarea>

                <!-- Action Button -->
                <button onclick="processDeed()" id="btnProcess" class="mt-3 w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition">
                    <span>⚡ Extrude Deed to 3D & Inspect from Street</span>
                </button>
            </div>

            <!-- Extraction & Conflict Card -->
            <div id="resultsCard" class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hidden space-y-3">
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Step 2: 3D Volumetric Conflict Result
                </h3>

                <div id="decisionBox" class="p-3.5 rounded-lg text-xs font-medium"></div>

                <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5 font-mono">
                    <div class="flex justify-between"><span class="text-slate-500 font-sans">Flat Number:</span> <strong id="resFlat" class="text-slate-800"></strong></div>
                    <div class="flex justify-between"><span class="text-slate-500 font-sans">Floor Level:</span> <strong id="resFloor" class="text-slate-800"></strong></div>
                    <div class="flex justify-between"><span class="text-slate-500 font-sans">Elevation in Air:</span> <strong id="resZRange" class="text-blue-700 font-bold"></strong></div>
                    <div class="flex justify-between"><span class="text-slate-500 font-sans">Cadastral Survey:</span> <strong id="resLand" class="text-slate-800"></strong></div>
                </div>
            </div>

        </div>

        <!-- Right Panel: Dual-Mode Map & 3D Street View -->
        <div class="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col min-h-[500px]">
            
            <div class="flex items-center justify-between mb-3">
                <div>
                    <h2 id="viewTitle" class="text-xs font-bold uppercase tracking-wider text-slate-800">
                        🗺️ Davanagere City Geographic Map
                    </h2>
                    <p id="viewSubtitle" class="text-xs text-slate-500">
                        Plot: Survey No. 482/3, Vidyanagar Main Road, Davanagere
                    </p>
                </div>

                <!-- Street Controls Toolbar (Visible in Street Mode) -->
                <div id="streetControls" class="hidden flex items-center gap-2 text-xs">
                    <button onclick="setCameraHeight(1.7)" class="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">
                        🚶 Street Level (1.7m)
                    </button>
                    <button onclick="setCameraHeight(12.0)" class="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">
                        👁️ 4th Floor Level (12m)
                    </button>
                    <button onclick="setCameraHeight(24.0)" class="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">
                        🦅 Aerial View
                    </button>
                </div>
            </div>

            <!-- Viewport Container -->
            <div class="relative w-full flex-1 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 min-h-[420px]">
                
                <!-- 1. Leaflet Davanagere Map -->
                <div id="leafletMap" class="absolute inset-0 z-10"></div>

                <!-- 2. Three.js 3D Street View -->
                <div id="threeContainer" class="absolute inset-0 z-0 hidden"></div>

                <!-- Street View Floating Instruction Pill -->
                <div id="streetHelpPill" class="hidden absolute bottom-3 left-3 z-20 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-700 shadow-sm">
                    🖱️ <strong>Mouse Drag</strong>: Look around 360° • <strong>Scroll</strong>: Walk closer • <strong>Click Flat</strong> to inspect
                </div>

            </div>

        </div>

    </main>

    <!-- App Logic -->
    <script>
        // Preset Deeds for Davanagere
        const PRESETS = {
            'A': `GOVERNMENT OF KARNATAKA - DEPARTMENT OF STAMPS & REGISTRATION
KAVERI 2.0 SUMMARY (DAVANAGERE SUB-REGISTRAR)
Schedule A: Survey No. 482/3, Vidyanagar Main Road, Davanagere - 577004.
Schedule B: Flat No. 101 on the 1st Floor, Durga Heights Residency.
Carpet Area: 80 sq.meters, Ceiling Height: 10 feet.
Purchaser: Chetan Kumar (ICICI Bank Loan Approved)`,

            'B': `GOVERNMENT OF KARNATAKA - DEPARTMENT OF STAMPS & REGISTRATION
KAVERI 2.0 SUMMARY (DAVANAGERE SUB-REGISTRAR)
Schedule A: Survey No. 482/3, Vidyanagar Main Road, Davanagere - 577004.
Schedule B: Flat No. 402 on the 4th Floor, Durga Heights Residency.
Carpet Area: 80 sq.meters, Ceiling Height: 10 feet.
Purchaser: Ramesh Patil (Mortgaged to Canara Bank Davanagere Branch)`,

            'C': `GOVERNMENT OF KARNATAKA - DEPARTMENT OF STAMPS & REGISTRATION
DUPLICATE SALE DEED SUBMITTED FOR LOAN
Schedule A: Survey No. 482/3, Vidyanagar Main Road, Davanagere - 577004.
Schedule B: Flat No. 402 on the 4th Floor, Durga Heights Residency.
Applicant: Vikram Shettar (Applying for ₹75 Lakh Loan from HDFC Bank)`
        };

        function loadPreset(key) {
            document.getElementById('deedText').value = PRESETS[key];
        }
        loadPreset('C');

        let currentView = 'MAP'; // 'MAP' or 'STREET'

        // 1. Initialize Davanagere Leaflet Map
        let map;
        function initMap() {
            map = L.map('leafletMap').setView([14.4644, 75.9218], 16);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap | Davanagere City Cadastre'
            }).addTo(map);

            // Cadastral Plot on Vidyanagar Road
            const plotPolygon = L.polygon([
                [14.4646, 75.9216],
                [14.4646, 75.9220],
                [14.4642, 75.9220],
                [14.4642, 75.9216]
            ], {
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.35,
                weight: 3
            }).addTo(map);

            // Popup
            plotPolygon.bindPopup(`
                <div class="text-xs p-1">
                    <strong class="text-blue-700 text-sm block">Durga Heights Residency</strong>
                    <div class="text-slate-600 mt-1">Survey No. 482/3, Vidyanagar Road, Davanagere</div>
                    <div class="font-mono text-[11px] text-slate-500">ULPIN: KA14-002-9841234</div>
                    <button onclick="switchView('STREET')" class="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition">
                        🚶 Drop into 3D Street View
                    </button>
                </div>
            `).openPopup();
        }

        // 2. Initialize Three.js 3D Street View
        let scene, camera, renderer, controls;
        let unitMeshes = [];

        function initStreet3D() {
            const container = document.getElementById('threeContainer');
            const w = container.clientWidth || 600;
            const h = container.clientHeight || 420;

            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf1f5f9); // Clean sky/slate daylight
            scene.fog = new THREE.FogExp2(0xf1f5f9, 0.01);

            // First Person Street Camera (Standing on Vidyanagar Road in front of the building)
            camera = new THREE.PerspectiveCamera(50, w / h, 0.2, 500);
            camera.position.set(6, 1.7, 24); // Human eye height (1.7m) on the road

            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(w, h);
            renderer.shadowMap.enabled = true;
            container.appendChild(renderer.domElement);

            // OrbitControls configured for intuitive first-person look-around
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.08;
            controls.target.set(6, 8, 5); // Looking up towards middle floors
            controls.maxDistance = 50;
            controls.minDistance = 2;
            controls.maxPolarAngle = Math.PI / 2 + 0.05; // Don't look below ground

            // Lighting
            const ambient = new THREE.AmbientLight(0xffffff, 1.2);
            scene.add(ambient);

            const sun = new THREE.DirectionalLight(0xfffdf0, 1.5);
            sun.position.set(25, 45, 30);
            sun.castShadow = true;
            scene.add(sun);

            // Build Davanagere Street Environment (Road, Sidewalk, Gate)
            buildStreetEnvironment(scene);

            // Load registered units
            loadInitialRegistry();

            animateStreet();
        }

        function animateStreet() {
            requestAnimationFrame(animateStreet);
            controls.update();
            renderer.render(scene, camera);
        }

        function buildStreetEnvironment(scene) {
            // 1. Asphalt Road (Vidyanagar Main Road)
            const roadGeom = new THREE.PlaneGeometry(80, 24);
            const roadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
            const road = new THREE.Mesh(roadGeom, roadMat);
            road.rotation.x = -Math.PI / 2;
            road.position.set(6, 0.0, 22);
            scene.add(road);

            // Road Yellow Center Line
            const lineGeom = new THREE.PlaneGeometry(80, 0.4);
            const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
            const centerLine = new THREE.Mesh(lineGeom, lineMat);
            centerLine.rotation.x = -Math.PI / 2;
            centerLine.position.set(6, 0.02, 22);
            scene.add(centerLine);

            // 2. Pedestrian Sidewalk / Curb
            const walkGeom = new THREE.BoxGeometry(80, 0.3, 4);
            const walkMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });
            const sidewalk = new THREE.Mesh(walkGeom, walkMat);
            sidewalk.position.set(6, 0.15, 12);
            scene.add(sidewalk);

            // 3. Cadastral Plot Ground Base
            const plotBaseGeom = new THREE.BoxGeometry(16, 0.1, 14);
            const plotBaseMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
            const plotBase = new THREE.Mesh(plotBaseGeom, plotBaseMat);
            plotBase.position.set(6, 0.05, 5);
            scene.add(plotBase);

            // Cadastral Boundary Line (Blue)
            const edges = new THREE.EdgesGeometry(plotBaseGeom);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x2563eb, linewidth: 2 }));
            plotBase.add(line);
        }

        function setCameraHeight(y) {
            camera.position.y = y;
            controls.target.set(6, y + 2, 5);
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

                const isConflict = highlightClash && u.flat_number === '402';
                
                // Building Unit Box
                const geom = new THREE.BoxGeometry(11.6, height - 0.2, 9.6);
                const mat = new THREE.MeshStandardMaterial({
                    color: isConflict ? 0xef4444 : (floorNum % 2 === 0 ? 0x0284c7 : 0x0ea5e9),
                    emissive: isConflict ? 0xdc2626 : 0x0369a1,
                    emissiveIntensity: isConflict ? 0.7 : 0.05,
                    transparent: true,
                    opacity: 0.85,
                    roughness: 0.2
                });

                const mesh = new THREE.Mesh(geom, mat);
                mesh.position.set(6, zMin + height / 2, 5);

                // Architectural Edge
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

                btnStreet.className = 'px-3.5 py-1.5 rounded-lg font-semibold bg-white text-blue-700 shadow-sm border border-slate-200 transition';
                btnMap.className = 'px-3.5 py-1.5 rounded-lg font-semibold text-slate-600 hover:text-slate-900 transition';

                vTitle.innerText = '🚶 3D Street View • Vidyanagar Road, Davanagere';
                vSub.innerText = 'Looking up at Durga Heights (Survey No. 482/3) from road level (1.7m)';

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

                btnMap.className = 'px-3.5 py-1.5 rounded-lg font-semibold bg-white text-blue-700 shadow-sm border border-slate-200 transition';
                btnStreet.className = 'px-3.5 py-1.5 rounded-lg font-semibold text-slate-600 hover:text-slate-900 transition';

                vTitle.innerText = '🗺️ Davanagere City Geographic Map';
                vSub.innerText = 'Plot: Survey No. 482/3, Vidyanagar Main Road, Davanagere';
                
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

                // Switch to 3D Street View automatically so user sees the building pull up!
                switchView('STREET');

                // Show Results Card
                document.getElementById('resultsCard').classList.remove('hidden');
                document.getElementById('resFlat').innerText = 'Flat ' + data.extracted_parameters.flat_number;
                document.getElementById('resFloor').innerText = 'Floor ' + data.extracted_parameters.floor_number;
                document.getElementById('resZRange').innerText = '+' + data.extruded_3d.elevation_range.z_bottom_meters + 'm to +' + data.extruded_3d.elevation_range.z_top_meters + 'm above road';
                document.getElementById('resLand').innerText = 'Survey No. 482/3, Vidyanagar, Davanagere';

                const dBox = document.getElementById('decisionBox');
                if (data.conflict_result.has_fraud_clash) {
                    dBox.className = 'p-3.5 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-300 text-rose-900 space-y-1';
                    dBox.innerHTML = `
                        <div class="text-sm font-bold text-rose-700">🚨 FRAUD BLOCKED: DUPLICATE 3D MORTGAGE</div>
                        <div>${data.conflict_result.message}</div>
                        <div class="text-[11px] font-mono mt-1 text-slate-700">Existing Loan Holder: <strong>${data.conflict_result.conflict_details.conflicting_bank}</strong> (${data.conflict_result.conflict_details.conflicting_cersai_id})</div>
                    `;
                    render3DUnits(data.all_units, true);
                } else {
                    dBox.className = 'p-3.5 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-1';
                    dBox.innerHTML = `
                        <div class="text-sm font-bold text-emerald-700">✅ TITLE CLEAR: APPROVED TO LEND</div>
                        <div>${data.conflict_result.message}</div>
                        <div class="text-[11px] mt-1 text-emerald-800">Successfully extruded & registered Floor ${data.extracted_parameters.floor_number} on Vidyanagar Road.</div>
                    `;
                    render3DUnits(data.all_units, false);
                }

            } catch(e) {
                alert('Error processing deed: ' + e);
            } finally {
                btn.innerHTML = '<span>⚡ Extrude Deed to 3D & Inspect from Street</span>';
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
