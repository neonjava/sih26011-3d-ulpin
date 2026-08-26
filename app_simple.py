"""
PHASE 4: Simple Interactive 3D Land Registry Web Application
-----------------------------------------------------------
Single-file clean FastAPI web server with interactive 3D WebGL visualization.
"""

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import json

from phase1_extruder import extrude_2d_to_3d
from phase2_doc_reader import extract_deed_parameters
from phase3_fraud_checker import check_3d_conflict

app = FastAPI(title="3D Land Registry - SIH26011")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory Land & Mortgage Registry for demo
LAND_PARCEL_2D = [(0.0, 0.0), (12.0, 0.0), (12.0, 10.0), (0.0, 10.0)]
LAND_ID = "CTS No. 1245/8, Village Bandra, Mumbai"

# Pre-registered units in database (SBI has a registered mortgage on Flat 402 on Floor 4)
registered_units = [
    {
        "flat_number": "402",
        "floor_number": 4,
        "owner_name": "Vikramaditya Roy",
        "bank": "State Bank of India (SBI)",
        "cersai_id": "CERSAI-MH-2023-88912",
        "loan_amount": "₹ 1,50,00,000",
        **extrude_2d_to_3d(LAND_PARCEL_2D, floor_number=4, floor_height=3.0)
    }
]

class DeedRequest(BaseModel):
    deed_text: str
    target_bank: str = "HDFC Bank"
    loan_amount: str = "₹ 1,80,00,000"

@app.get("/api/registry")
def get_registry():
    return {
        "land_id": LAND_ID,
        "parcel_2d": LAND_PARCEL_2D,
        "registered_units": registered_units
    }

@app.post("/api/process-deed")
def process_deed(req: DeedRequest):
    # Step 1: Read & extract parameters from deed text
    extracted = extract_deed_parameters(req.deed_text)
    
    floor_num = extracted["floor_number"] if extracted["floor_number"] is not None else 1
    floor_height = extracted["floor_height_meters"]
    
    # Step 2: Extrude 2D parcel into 3D volume
    extruded_3d = extrude_2d_to_3d(LAND_PARCEL_2D, floor_number=floor_num, floor_height=floor_height)
    extruded_3d["flat_number"] = extracted["flat_number"] or f"Unit-{floor_num}01"
    extruded_3d["owner_name"] = extracted["owner_name"]
    extruded_3d["bank"] = req.target_bank
    extruded_3d["loan_amount"] = req.loan_amount
    
    # Step 3: Check for 3D conflict against existing registered mortgages
    conflict_result = check_3d_conflict(extruded_3d, registered_units)
    
    # If no conflict, optionally register it
    is_newly_registered = False
    if not conflict_result["has_fraud_clash"]:
        registered_units.append(extruded_3d)
        is_newly_registered = True
        
    return {
        "extracted_parameters": extracted,
        "extruded_3d": extruded_3d,
        "conflict_result": conflict_result,
        "all_units": registered_units,
        "is_newly_registered": is_newly_registered
    }

@app.get("/", response_class=HTMLResponse)
def serve_ui():
    return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Land Registry & Anti-Fraud System (SIH26011)</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Three.js CDN & OrbitControls -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen flex flex-col">

    <!-- Top Simple Header -->
    <header class="bg-white border-b border-slate-200 shadow-sm px-6 py-3.5 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-lg">
                3D
            </div>
            <div>
                <h1 class="text-base font-bold text-slate-900 leading-none">
                    3D Land Registry & Anti-Fraud Extruder
                </h1>
                <p class="text-xs text-slate-500 mt-1">
                    Smart India Hackathon (SIH26011) • Ministry of Rural Development
                </p>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                System Live
            </span>
        </div>
    </header>

    <!-- Main Workspace: 2-Column Clean Layout -->
    <main class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl w-full mx-auto">

        <!-- Left Column: Document Input & Controls -->
        <div class="lg:col-span-5 flex flex-col gap-4">
            
            <!-- Step 1: Document Selection Card -->
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div class="flex items-center justify-between mb-2">
                    <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Step 1: Choose or Paste Sale Deed
                    </h2>
                </div>

                <!-- 3 Quick Presets -->
                <div class="grid grid-cols-1 gap-2 mb-3">
                    <button onclick="loadPreset('A')" class="text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 text-xs transition">
                        <div class="font-bold text-slate-800">📄 Deed A: Flat 101 (1st Floor)</div>
                        <div class="text-[11px] text-slate-500">Legitimate ground level title (Clear)</div>
                    </button>
                    
                    <button onclick="loadPreset('B')" class="text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 text-xs transition">
                        <div class="font-bold text-slate-800">📄 Deed B: Flat 402 (4th Floor - SBI Registered)</div>
                        <div class="text-[11px] text-slate-500">Original legitimate mortgage held by SBI</div>
                    </button>

                    <button onclick="loadPreset('C')" class="text-left p-2.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-xs transition">
                        <div class="font-bold text-rose-800">🚨 Deed C: Duplicate Flat 402 for HDFC Loan</div>
                        <div class="text-[11px] text-rose-600">Scammer attempting duplicate mortgage on Floor 4!</div>
                    </button>
                </div>

                <!-- Deed Text Area -->
                <label class="block text-xs font-semibold text-slate-600 mb-1">
                    Scanned Deed / Paper Text:
                </label>
                <textarea id="deedText" rows="5" class="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" placeholder="Paste deed text here..."></textarea>

                <!-- Extrude Button -->
                <button onclick="processDeed()" id="btnProcess" class="mt-3 w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition">
                    <span>⚡ Read Deed & Pull Map into 3D</span>
                </button>
            </div>

            <!-- Step 2: Extraction & Anti-Fraud Results Card -->
            <div id="resultsCard" class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hidden space-y-3">
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Step 2: AI Extraction & 3D Conflict Result
                </h3>

                <!-- Decision Alert Box -->
                <div id="decisionBox" class="p-3.5 rounded-lg text-xs font-medium"></div>

                <!-- Extracted Parameters Table -->
                <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5 font-mono">
                    <div class="flex justify-between"><span class="text-slate-500 font-sans">Flat Number:</span> <strong id="resFlat" class="text-slate-800"></strong></div>
                    <div class="flex justify-between"><span class="text-slate-500 font-sans">Floor Number:</span> <strong id="resFloor" class="text-slate-800"></strong></div>
                    <div class="flex justify-between"><span class="text-slate-500 font-sans">Floor Height:</span> <strong id="resHeight" class="text-slate-800"></strong></div>
                    <div class="flex justify-between"><span class="text-slate-500 font-sans">Carpet Area:</span> <strong id="resArea" class="text-slate-800"></strong></div>
                    <div class="flex justify-between"><span class="text-slate-500 font-sans">3D Elevation Z:</span> <strong id="resZRange" class="text-blue-700"></strong></div>
                </div>
            </div>

        </div>

        <!-- Right Column: Interactive 3D Canvas -->
        <div class="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col">
            
            <div class="flex items-center justify-between mb-2">
                <div>
                    <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Interactive 3D Cadastre Map
                    </h2>
                    <p class="text-xs text-slate-500">
                        Land Plot: CTS No. 1245/8 (Bandra, Mumbai)
                    </p>
                </div>
                <div class="flex items-center gap-2 text-xs">
                    <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-emerald-500"></span> Clear</span>
                    <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-rose-500"></span> 3D Clash</span>
                </div>
            </div>

            <!-- 3D Canvas Viewport -->
            <div id="canvasContainer" class="relative w-full flex-1 min-h-[420px] rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                <div class="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 shadow-sm">
                    🖱️ Drag to rotate • Scroll to zoom
                </div>
            </div>

        </div>

    </main>

    <!-- JavaScript Logic -->
    <script>
        // Preset Deeds
        const PRESETS = {
            'A': `GOVERNMENT OF MAHARASHTRA - SUB-REGISTRAR OFFICE
INDEX-II EXTRACT (2024)
Schedule A: CTS No. 1245/8, Village Bandra, Mumbai Suburban.
Schedule B: Flat No. 101 on the 1st Floor, Carpet Area 80 sq.m, ceiling Height 10 feet.
Purchaser: Rahul Verma (ICICI Home Loan)`,
            
            'B': `GOVERNMENT OF MAHARASHTRA - SUB-REGISTRAR OFFICE
INDEX-II EXTRACT (2023)
Schedule A: CTS No. 1245/8, Village Bandra, Mumbai Suburban.
Schedule B: Flat No. 402 on the 4th Floor, Carpet Area 80 sq.m, ceiling Height 10 feet.
Purchaser: Vikramaditya Roy (Mortgaged to State Bank of India)`,
            
            'C': `GOVERNMENT OF MAHARASHTRA - SUB-REGISTRAR OFFICE
DUPLICATE SALE DEED PRESENTED FOR LOAN
Schedule A: CTS No. 1245/8, Village Bandra, Mumbai Suburban.
Schedule B: Flat No. 402 on the 4th Floor, Carpet Area 80 sq.m, ceiling Height 10 feet.
Applicant: Sameer Merchant (Applying for ₹1.8 Cr Loan from HDFC Bank)`
        };

        function loadPreset(key) {
            document.getElementById('deedText').value = PRESETS[key];
        }

        // Initialize with Preset C
        loadPreset('C');

        // Three.js Setup
        let scene, camera, renderer, controls;
        let unitMeshes = [];

        function init3D() {
            const container = document.getElementById('canvasContainer');
            const w = container.clientWidth;
            const h = container.clientHeight;

            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf8fafc);

            camera = new THREE.PerspectiveCamera(45, w / h, 0.5, 500);
            camera.position.set(24, 20, 30);

            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(w, h);
            renderer.shadowMap.enabled = true;
            container.appendChild(renderer.domElement);

            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.target.set(6, 6, 5);

            // Lighting
            const ambient = new THREE.AmbientLight(0xffffff, 1.2);
            scene.add(ambient);

            const sun = new THREE.DirectionalLight(0xffffff, 1.0);
            sun.position.set(20, 40, 20);
            sun.castShadow = true;
            scene.add(sun);

            // Ground Cadastral Grid
            const grid = new THREE.GridHelper(40, 20, 0x94a3b8, 0xe2e8f0);
            scene.add(grid);

            // 2D Ground Base Polygon Outline
            const groundBoxGeom = new THREE.BoxGeometry(12, 0.1, 10);
            const groundBoxEdges = new THREE.EdgesGeometry(groundBoxGeom);
            const groundLine = new THREE.LineSegments(groundBoxEdges, new THREE.LineBasicMaterial({ color: 0x2563eb, linewidth: 2 }));
            groundLine.position.set(6, 0.05, 5);
            scene.add(groundLine);

            animate();
            loadInitialRegistry();

            window.addEventListener('resize', () => {
                const nw = container.clientWidth;
                const nh = container.clientHeight;
                camera.aspect = nw / nh;
                camera.updateProjectionMatrix();
                renderer.setSize(nw, nh);
            });
        }

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }

        // Render 3D Units
        function render3DUnits(units, highlightClash = false) {
            // Remove previous
            unitMeshes.forEach(m => scene.remove(m));
            unitMeshes = [];

            units.forEach(u => {
                const zMin = u.elevation_range.z_bottom_meters;
                const zMax = u.elevation_range.z_top_meters;
                const height = zMax - zMin;

                const isConflict = highlightClash && u.flat_number === '402';
                const geom = new THREE.BoxGeometry(11.6, height, 9.6);
                
                const mat = new THREE.MeshStandardMaterial({
                    color: isConflict ? 0xef4444 : 0x10b981,
                    emissive: isConflict ? 0xdc2626 : 0x047857,
                    emissiveIntensity: isConflict ? 0.6 : 0.1,
                    transparent: true,
                    opacity: 0.85,
                    roughness: 0.3
                });

                const mesh = new THREE.Mesh(geom, mat);
                // Center in X=6, Z_height=(zMin + height/2), Y=5
                mesh.position.set(6, zMin + height / 2, 5);

                // Add wireframe edge
                const edges = new THREE.EdgesGeometry(geom);
                const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: isConflict ? 0xffffff : 0x065f46 }));
                mesh.add(line);

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

        async function processDeed() {
            const text = document.getElementById('deedText').value;
            const btn = document.getElementById('btnProcess');
            btn.innerHTML = '<span>⏳ Reading & Extruding to 3D...</span>';
            btn.disabled = true;

            try {
                const res = await fetch('/api/process-deed', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deed_text: text })
                });
                const data = await res.json();

                // Show Results Card
                document.getElementById('resultsCard').classList.remove('hidden');
                document.getElementById('resFlat').innerText = 'Flat ' + data.extracted_parameters.flat_number;
                document.getElementById('resFloor').innerText = 'Floor ' + data.extracted_parameters.floor_number;
                document.getElementById('resHeight').innerText = data.extracted_parameters.floor_height_meters + ' m (10 ft)';
                document.getElementById('resArea').innerText = data.extracted_parameters.carpet_area_sqm + ' m²';
                document.getElementById('resZRange').innerText = '+' + data.extruded_3d.elevation_range.z_bottom_meters + 'm to +' + data.extruded_3d.elevation_range.z_top_meters + 'm';

                const dBox = document.getElementById('decisionBox');
                if (data.conflict_result.has_fraud_clash) {
                    dBox.className = 'p-3.5 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-300 text-rose-900 space-y-1';
                    dBox.innerHTML = `
                        <div class="text-sm font-bold text-rose-700">🚨 FRAUD DETECTED: DUPLICATE 3D MORTGAGE</div>
                        <div>${data.conflict_result.message}</div>
                        <div class="text-[11px] font-mono mt-1 text-slate-700">Conflicting Bank: <strong>${data.conflict_result.conflict_details.conflicting_bank}</strong> (${data.conflict_result.conflict_details.conflicting_cersai_id})</div>
                    `;
                    render3DUnits(data.all_units, true);
                } else {
                    dBox.className = 'p-3.5 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-1';
                    dBox.innerHTML = `
                        <div class="text-sm font-bold text-emerald-700">✅ TITLE CLEAR: APPROVED TO LEND</div>
                        <div>${data.conflict_result.message}</div>
                        <div class="text-[11px] mt-1 text-emerald-800">Successfully extruded & registered 3D block for Floor ${data.extracted_parameters.floor_number}.</div>
                    `;
                    render3DUnits(data.all_units, false);
                }

            } catch(e) {
                alert('Error processing deed: ' + e);
            } finally {
                btn.innerHTML = '<span>⚡ Read Deed & Pull Map into 3D</span>';
                btn.disabled = false;
            }
        }

        window.onload = init3D;
    </script>
</body>
</html>
    """

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
