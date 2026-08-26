import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Maximize2, 
  RotateCcw, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  Info, 
  Eye, 
  EyeOff, 
  Sliders, 
  Compass, 
  Sun, 
  AlertTriangle, 
  Copy, 
  Check, 
  ArrowUpRight, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
  MapPin,
  X
} from 'lucide-react';

export default function Cadastre3DViewer({ 
  parcel, 
  selectedUnit, 
  onSelectUnit, 
  onNavigateToBanker, 
  onNavigateToDeed,
  highlightConflictId 
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const objectsMapRef = useRef(new Map()); // Map unitId -> Mesh
  const floorGroupsRef = useRef(new Map()); // Map floorNum -> Group
  const animationFrameRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Interactive UI States
  const [explosionFactor, setExplosionFactor] = useState(0.0);
  const [selectedFloorFilter, setSelectedFloorFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('SOLID'); // 'SOLID', 'WIREFRAME', 'SANCTION_ONLY'
  const [showSubsurface, setShowSubsurface] = useState(true);
  const [showAirRights, setShowAirRights] = useState(true);
  const [showSanctionEnvelope, setShowSanctionEnvelope] = useState(true);
  const [sunlightAngle, setSunlightAngle] = useState(45);
  const [hoveredUnit, setHoveredUnit] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false });
  const [copiedUlpin, setCopiedUlpin] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(false);

  // Sunlight light ref
  const sunLightRef = useRef(null);

  // Initialize Three.js Scene with Clean Light / Studio Theme
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene with Clean Off-White Architectural Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9); // slate-100 clean studio color
    scene.fog = new THREE.FogExp2(0xf1f5f9, 0.006);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 1000);
    camera.position.set(38, 28, 48);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 180;
    controls.minDistance = 8;
    controls.maxPolarAngle = Math.PI / 2 + 0.12;
    controls.target.set(0, 16, 0);
    controlsRef.current = controls;

    // 5. Bright Clean Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffdf5, 1.6);
    dirLight.position.set(30, 60, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0001;
    scene.add(dirLight);
    sunLightRef.current = dirLight;

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.7);
    fillLight.position.set(-30, 20, -30);
    scene.add(fillLight);

    const subLight = new THREE.PointLight(0x3b82f6, 1.5, 40);
    subLight.position.set(0, -12, 0);
    scene.add(subLight);

    // 6. Ground Surface & Cadastre Parcel Grid
    buildGroundEnvironment(scene, parcel);

    // 7. Render Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Pulsing effect for conflicted/fraud units
      objectsMapRef.current.forEach((mesh) => {
        if (mesh.userData?.hasConflict || mesh.userData?.status === 'CRITICAL_CONFLICT' || mesh.userData?.status === 'SANCTION_BREACH') {
          const pulse = (Math.sin(elapsedTime * 4) + 1) / 2;
          if (mesh.material && mesh.material.emissive) {
            mesh.material.emissiveIntensity = 0.3 + pulse * 1.0;
          }
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Update Sunlight Position
  useEffect(() => {
    if (!sunLightRef.current) return;
    const rad = (sunlightAngle * Math.PI) / 180;
    sunLightRef.current.position.set(Math.cos(rad) * 60, 60, Math.sin(rad) * 60);
  }, [sunlightAngle]);

  // Build Building Geometry when Parcel changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !parcel) return;

    // Remove existing building elements
    floorGroupsRef.current.forEach(group => scene.remove(group));
    floorGroupsRef.current.clear();
    objectsMapRef.current.clear();

    const prevEnv = scene.getObjectByName('SanctionEnvelope');
    if (prevEnv) scene.remove(prevEnv);
    const prevSub = scene.getObjectByName('SubsurfaceGroup');
    if (prevSub) scene.remove(prevSub);
    const prevAir = scene.getObjectByName('AirRightsGroup');
    if (prevAir) scene.remove(prevAir);

    // 1. Build Subsurface (Metro + Basements)
    const subsurfaceGroup = new THREE.Group();
    subsurfaceGroup.name = 'SubsurfaceGroup';

    if (parcel.subsurfaceMetro) {
      const tunnelGeom = new THREE.CylinderGeometry(4.5, 4.5, 70, 32, 1, true);
      const tunnelMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: 0.6,
        roughness: 0.4,
        side: THREE.DoubleSide,
      });
      const tunnel = new THREE.Mesh(tunnelGeom, tunnelMat);
      tunnel.rotation.z = Math.PI / 2;
      tunnel.position.set(0, -15, 12);
      subsurfaceGroup.add(tunnel);

      // Metro Rails
      const trackGeom = new THREE.BoxGeometry(70, 0.4, 3);
      const trackMat = new THREE.MeshBasicMaterial({ color: 0x2563eb, wireframe: true });
      const track = new THREE.Mesh(trackGeom, trackMat);
      track.position.set(0, -17.5, 12);
      subsurfaceGroup.add(track);

      // Foundation Piles
      const pileGeom = new THREE.CylinderGeometry(0.6, 0.6, 12, 16);
      const pileMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
      [-8, 8].forEach(x => {
        [-8, 8].forEach(z => {
          const pile = new THREE.Mesh(pileGeom, pileMat);
          pile.position.set(x, -6, z);
          subsurfaceGroup.add(pile);
        });
      });
    }
    subsurfaceGroup.visible = showSubsurface;
    scene.add(subsurfaceGroup);

    // 2. Build Sanction Envelope (Municipal Height & Volume Cap)
    const sanctionHeight = parcel.sanctionedMaxHeight || 38.0;
    const envGeom = new THREE.BoxGeometry(19, sanctionHeight, 19);
    const envEdges = new THREE.EdgesGeometry(envGeom);
    const envLineMat = new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2, transparent: true, opacity: 0.6 });
    const envLines = new THREE.LineSegments(envEdges, envLineMat);
    envLines.position.set(0, sanctionHeight / 2, 0);

    const envFillMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.03,
      side: THREE.BackSide
    });
    const envFill = new THREE.Mesh(envGeom, envFillMat);
    envFill.position.copy(envLines.position);

    const sanctionGroup = new THREE.Group();
    sanctionGroup.name = 'SanctionEnvelope';
    sanctionGroup.add(envLines);
    sanctionGroup.add(envFill);
    sanctionGroup.visible = showSanctionEnvelope;
    scene.add(sanctionGroup);

    // 3. Build Air Rights Envelope
    if (parcel.airRights) {
      const airGeom = new THREE.BoxGeometry(22, 16, 22);
      const airEdges = new THREE.EdgesGeometry(airGeom);
      const airLineMat = new THREE.LineBasicMaterial({ color: 0xd97706, transparent: true, opacity: 0.5 });
      const airLines = new THREE.LineSegments(airEdges, airLineMat);
      
      const airFillMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.05, side: THREE.DoubleSide });
      const airFill = new THREE.Mesh(airGeom, airFillMat);

      const airGroup = new THREE.Group();
      airGroup.name = 'AirRightsGroup';
      airGroup.position.set(0, sanctionHeight + 8, 0);
      airGroup.add(airLines);
      airGroup.add(airFill);
      airGroup.visible = showAirRights;
      scene.add(airGroup);
    }

    // 4. Build Floors and Apartment Unit Voxels
    parcel.floors.forEach((floor) => {
      const floorGroup = new THREE.Group();
      floorGroup.name = `Floor_${floor.floorNumber}`;
      floorGroup.userData = { floorNumber: floor.floorNumber, baseElevation: floor.zMin, isSanctioned: floor.isSanctioned !== false };

      // Floor Slab (Clean Architectural Stone / Slab)
      const slabThickness = 0.35;
      const slabWidth = 17.5;
      const slabGeom = new THREE.BoxGeometry(slabWidth, slabThickness, slabWidth);
      const slabMat = new THREE.MeshStandardMaterial({
        color: floor.floorNumber < 0 ? 0x64748b : (floor.isSanctioned === false ? 0xfecdd3 : 0xffffff),
        roughness: 0.5,
        metalness: 0.1
      });
      const slab = new THREE.Mesh(slabGeom, slabMat);
      slab.position.set(0, -slabThickness / 2, 0);
      slab.receiveShadow = true;
      floorGroup.add(slab);

      // Slab Edge
      const slabEdges = new THREE.EdgesGeometry(slabGeom);
      const slabEdgeMat = new THREE.LineBasicMaterial({ color: 0xcbd5e1 });
      const slabEdgeLines = new THREE.LineSegments(slabEdges, slabEdgeMat);
      slabEdgeLines.position.copy(slab.position);
      floorGroup.add(slabEdgeLines);

      // Floor Units / Voxels
      floor.units.forEach((unit) => {
        const uPos = unit.position || { x: 0, z: 0, width: 7.5, depth: 7.5 };
        const uHeight = (unit.zMax - unit.zMin) - slabThickness;
        const unitGeom = new THREE.BoxGeometry(uPos.width, uHeight, uPos.depth);

        // Determine Material Color based on clean architectural status
        let unitColor = 0x0284c7; // Crisp clean glass blue
        let emissiveColor = 0x000000;
        let opacity = 0.75;
        let isConflict = unit.hasConflict;

        if (unit.floorNumber < 0) {
          // Basement
          unitColor = isConflict ? 0xef4444 : 0x64748b;
          emissiveColor = isConflict ? 0x991b1b : 0x000000;
          opacity = 0.8;
        } else if (unit.status === 'CRITICAL_CONFLICT' || isConflict) {
          // Duplicate mortgage / Duplicate loan clash
          unitColor = 0xef4444; // Bold red
          emissiveColor = 0xdc2626;
          opacity = 0.92;
        } else if (unit.status === 'SANCTION_BREACH' || floor.isSanctioned === false) {
          // Phantom illegal floor
          unitColor = 0x8b5cf6; // Purple alert
          emissiveColor = 0x7c3aed;
          opacity = 0.9;
        } else {
          // Regular Clean Unit (Crisp architectural sky-tinted glass)
          unitColor = (unit.floorNumber % 2 === 0) ? 0x0284c7 : 0x0ea5e9;
          emissiveColor = 0x0369a1;
          opacity = 0.75;
        }

        const unitMat = new THREE.MeshStandardMaterial({
          color: unitColor,
          emissive: emissiveColor,
          emissiveIntensity: isConflict ? 0.6 : 0.05,
          transparent: true,
          opacity: opacity,
          roughness: 0.2,
          metalness: 0.1,
          wireframe: viewMode === 'WIREFRAME'
        });

        const unitMesh = new THREE.Mesh(unitGeom, unitMat);
        unitMesh.position.set(uPos.x, uHeight / 2, uPos.z);
        unitMesh.castShadow = true;
        unitMesh.receiveShadow = true;

        // Clean edge line
        const unitEdges = new THREE.EdgesGeometry(unitGeom);
        const edgeColor = isConflict ? 0xffffff : (floor.isSanctioned === false ? 0x6d28d9 : 0x0284c7);
        const edgeMat = new THREE.LineBasicMaterial({ color: edgeColor, linewidth: 1.5 });
        const edgeLines = new THREE.LineSegments(unitEdges, edgeMat);
        unitMesh.add(edgeLines);

        // Store reference
        unitMesh.userData = {
          ...unit,
          meshType: 'UNIT_VOXEL',
          originalColor: unitColor,
          isConflict: isConflict
        };

        objectsMapRef.current.set(unit.ulpin_3d, unitMesh);
        floorGroup.add(unitMesh);
      });

      // Initial placement
      floorGroup.position.set(0, floor.zMin, 0);
      floorGroupsRef.current.set(floor.floorNumber, floorGroup);
      scene.add(floorGroup);
    });

  }, [parcel, viewMode]);

  // Handle Exploded Floor View Slider
  useEffect(() => {
    floorGroupsRef.current.forEach((group, floorNumber) => {
      const baseElev = group.userData.baseElevation;
      if (floorNumber >= 0) {
        // Expand upwards
        const offset = floorNumber * explosionFactor * 4.0;
        group.position.y = baseElev + offset;
      } else {
        // Expand downwards for basements
        const offset = Math.abs(floorNumber) * explosionFactor * 3.0;
        group.position.y = baseElev - offset;
      }
    });
  }, [explosionFactor]);

  // Handle Visibility of Subsurface & Sanction Envelope
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const sub = scene.getObjectByName('SubsurfaceGroup');
    if (sub) sub.visible = showSubsurface;
    const env = scene.getObjectByName('SanctionEnvelope');
    if (env) env.visible = showSanctionEnvelope;
    const air = scene.getObjectByName('AirRightsGroup');
    if (air) air.visible = showAirRights;
  }, [showSubsurface, showSanctionEnvelope, showAirRights]);

  // Handle Raycasting / Hover / Click Selection
  const handlePointerMove = (e) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    
    // Test against all unit meshes
    const meshes = Array.from(objectsMapRef.current.values());
    const intersects = raycasterRef.current.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      setHoveredUnit(hit.userData);
      setTooltipPos({ x: e.clientX - rect.left + 15, y: e.clientY - rect.top + 15, visible: true });
    } else {
      setHoveredUnit(null);
      setTooltipPos(prev => ({ ...prev, visible: false }));
    }
  };

  const handlePointerClick = (e) => {
    if (!mountRef.current || !cameraRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const meshes = Array.from(objectsMapRef.current.values());
    const intersects = raycasterRef.current.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      onSelectUnit(hit.userData);
    }
  };

  // Reset Camera View
  const handleResetCamera = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    cameraRef.current.position.set(38, 28, 48);
    controlsRef.current.target.set(0, 16, 0);
    controlsRef.current.update();
  };

  // Helper: Build Clean Ground Surface
  function buildGroundEnvironment(scene, p) {
    const existingGround = scene.getObjectByName('GroundEnvironment');
    if (existingGround) scene.remove(existingGround);

    const groundGroup = new THREE.Group();
    groundGroup.name = 'GroundEnvironment';

    // 1. Clean Ground Plane
    const groundGeom = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    groundGroup.add(ground);

    // 2. Clean Light Cadastral Grid
    const grid = new THREE.GridHelper(120, 60, 0x94a3b8, 0xe2e8f0);
    grid.position.y = 0.0;
    groundGroup.add(grid);

    // 3. Cadastral Parcel Footprint Boundary (Clean Blue Polygon)
    const parcelBoundsGeom = new THREE.BoxGeometry(24, 0.1, 24);
    const parcelEdges = new THREE.EdgesGeometry(parcelBoundsGeom);
    const parcelLineMat = new THREE.LineBasicMaterial({ color: 0x2563eb, linewidth: 2 });
    const parcelLine = new THREE.LineSegments(parcelEdges, parcelLineMat);
    parcelLine.position.set(0, 0.05, 0);
    groundGroup.add(parcelLine);

    scene.add(groundGroup);
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedUlpin(true);
    setTimeout(() => setCopiedUlpin(false), 2000);
  };

  return (
    <div className="relative w-full h-[calc(100vh-6.5rem)] overflow-hidden bg-slate-100 select-none">
      
      {/* 3D WebGL Canvas Mount */}
      <div 
        ref={mountRef} 
        onMouseMove={handlePointerMove}
        onClick={handlePointerClick}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top Left: Building Metadata Card (Clean Light Theme) */}
      <div className="absolute top-4 left-4 z-10 w-80 bg-white/95 backdrop-blur-md border border-slate-200 shadow-md rounded-xl p-4 transition-all">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
              <MapPin className="w-3.5 h-3.5" />
              <span>{parcel?.city || 'Mumbai Suburban'}</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">
              {parcel?.property_name || 'Shanti Heights Co-op Housing'}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              CTS: {parcel?.cts_number || '1245/8'} • ULPIN: {parcel?.ulpin_2d?.slice(0, 12)}...
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded">
              FSI MAX: {parcel?.sanctionedMaxHeight || 38}m
            </span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="text-[10px] text-slate-500 font-medium">Floors</div>
            <div className="text-xs font-bold text-slate-800">
              {parcel?.sanctionedFloors || 12} Sanctioned
            </div>
            {parcel?.floors?.some(f => f.isSanctioned === false) && (
              <span className="text-[9px] font-bold text-purple-600 block">+2 Illegal</span>
            )}
          </div>

          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="text-[10px] text-slate-500 font-medium">Basements</div>
            <div className="text-xs font-bold text-slate-800">
              {parcel?.basementLevels || 2} Levels
            </div>
            <span className="text-[9px] text-slate-500 block">Subsurface</span>
          </div>

          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="text-[10px] text-slate-500 font-medium">3D Status</div>
            <div className="text-xs font-bold text-rose-600">
              {parcel?.floors?.flatMap(f => f.units).filter(u => u.hasConflict).length || 2} Conflicts
            </div>
            <span className="text-[9px] text-rose-500 font-bold block animate-pulse">Action Req.</span>
          </div>
        </div>

        {/* Camera Quick Buttons */}
        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-100">
          <button 
            onClick={handleResetCamera}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>3D Orbit</span>
          </button>
          <button 
            onClick={() => {
              if (cameraRef.current && controlsRef.current) {
                cameraRef.current.position.set(0, 75, 0.1);
                controlsRef.current.target.set(0, 0, 0);
                controlsRef.current.update();
              }
            }}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
          >
            <Layers className="w-3 h-3" />
            <span>Top 2D</span>
          </button>
          <button 
            onClick={() => setShowSubsurface(!showSubsurface)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium border rounded-lg transition ${
              showSubsurface ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <span>🚇 Metro</span>
          </button>
        </div>
      </div>

      {/* Top Right: Legend (Clean Light Theme) */}
      <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-md border border-slate-200 shadow-md rounded-xl p-3 text-xs text-slate-700 space-y-1.5">
        <div className="text-[11px] font-bold text-slate-800 border-b border-slate-100 pb-1">
          3D Cadastre Legend
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-sky-500 border border-sky-600"></span>
          <span>Clear Title (Sanctioned)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-amber-500 border border-amber-600"></span>
          <span>Active Mortgage (Single Bank)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-rose-500 border border-rose-600 animate-pulse"></span>
          <span className="font-semibold text-rose-600">Duplicate Mortgage Clash!</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-purple-500 border border-purple-600"></span>
          <span className="text-purple-700 font-semibold">Phantom Floor (Illegal)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-slate-500 border border-slate-600"></span>
          <span>Basement / Subsurface Metro</span>
        </div>
      </div>

      {/* Bottom Center: Exploded Floor Slider & Interactive Control Dock */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 w-11/12 max-w-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl px-5 py-3.5 transition-all">
        
        {/* Slider Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 whitespace-nowrap">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Exploded Floor View:</span>
            <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {explosionFactor.toFixed(1)}x
            </span>
          </div>

          <div className="flex-1">
            <input 
              type="range"
              min="0"
              max="2.5"
              step="0.1"
              value={explosionFactor}
              onChange={(e) => setExplosionFactor(parseFloat(e.target.value))}
              className="w-full cursor-pointer accent-blue-600"
            />
          </div>

          <button
            onClick={() => setExplosionFactor(explosionFactor > 0 ? 0 : 1.2)}
            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            {explosionFactor > 0 ? 'Collapse' : 'Explode'}
          </button>
        </div>

        {/* View Toggles & Filters Row */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs">
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSanctionEnvelope(!showSanctionEnvelope)}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                showSanctionEnvelope ? 'bg-sky-100 text-sky-800 border border-sky-300' : 'bg-slate-100 text-slate-600'
              }`}
            >
              📐 FSI Envelope
            </button>
            <button
              onClick={() => setShowAirRights(!showAirRights)}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                showAirRights ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-600'
              }`}
            >
              ✈️ Air Rights
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>Drag to rotate • Scroll to zoom • Click unit to inspect</span>
          </div>

        </div>

      </div>

      {/* Floating Hover Tooltip (Clean Light Theme) */}
      {tooltipPos.visible && hoveredUnit && (
        <div 
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          className="absolute z-30 pointer-events-none bg-slate-900 text-white shadow-xl rounded-lg px-3 py-2 text-xs border border-slate-700 max-w-xs transition-opacity duration-150"
        >
          <div className="flex items-center justify-between gap-2 font-bold">
            <span>Unit {hoveredUnit.unitNumber || hoveredUnit.unitId}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
              hoveredUnit.hasConflict 
                ? 'bg-rose-500 text-white' 
                : (hoveredUnit.status === 'SANCTION_BREACH' ? 'bg-purple-500 text-white' : 'bg-emerald-500 text-white')
            }`}>
              {hoveredUnit.hasConflict ? 'CLASH' : (hoveredUnit.status || 'CLEAR')}
            </span>
          </div>
          <div className="text-slate-300 text-[11px] mt-1 space-y-0.5">
            <div>Floor: {hoveredUnit.floorNumber} | Area: {hoveredUnit.carpetAreaSqm || 68} m²</div>
            <div>Elevation Z: {hoveredUnit.zMin}m to {hoveredUnit.zMax}m</div>
            <div className="text-blue-300 font-mono text-[10px] truncate">{hoveredUnit.ulpin_3d}</div>
          </div>
        </div>
      )}

      {/* Slide-Over Property Inspector Drawer (Clean Light Theme) */}
      {selectedUnit && (
        <div className="absolute top-0 right-0 bottom-0 z-20 w-96 bg-white border-l border-slate-200 shadow-2xl p-5 overflow-y-auto transition-all animate-in slide-in-from-right">
          
          <div className="flex items-start justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                3D Volumetric Cadastre Unit
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                Flat {selectedUnit.unitNumber || selectedUnit.unitId} (Floor {selectedUnit.floorNumber})
              </h3>
            </div>
            <button 
              onClick={() => onSelectUnit(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3D-ULPIN Unique Key */}
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
              <span>Standard 3D-ULPIN (Bhu-Aadhaar):</span>
              <button 
                onClick={() => copyToClipboard(selectedUnit.ulpin_3d)}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-[11px] font-semibold"
              >
                {copiedUlpin ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUlpin ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="font-mono text-xs font-bold text-slate-900 break-all bg-white p-2 rounded border border-slate-200 select-all">
              {selectedUnit.ulpin_3d}
            </div>
          </div>

          {/* Conflict Alert Banner if Conflicted */}
          {selectedUnit.hasConflict && (
            <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-700">
                <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>CRITICAL: 3D Duplicate Mortgage Clash!</span>
              </div>
              <p className="text-xs text-rose-700 mt-1.5 leading-relaxed">
                This exact vertical 3D space is already pledged to <strong>State Bank of India (SBI)</strong> under CERSAI ID: <code className="font-mono font-bold">CERSAI-MH-2023-998821</code>.
              </p>
              <button 
                onClick={() => onNavigateToBanker(selectedUnit)}
                className="mt-3 w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Verify Conflict in Banker Portal</span>
              </button>
            </div>
          )}

          {/* Geometric & Volumetric Metrics */}
          <div className="mt-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Volumetric Dimensions (ISO 19152)
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-slate-500 text-[11px]">RERA Carpet Area</div>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  {selectedUnit.carpetAreaSqm || 68.5} m² ({((selectedUnit.carpetAreaSqm || 68.5) * 10.764).toFixed(0)} sq.ft)
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-slate-500 text-[11px]">3D Volume</div>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  {((selectedUnit.carpetAreaSqm || 68.5) * 3.0).toFixed(1)} m³
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-slate-500 text-[11px]">Z-Axis Base ($Z_{'{min}'}$)</div>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  +{selectedUnit.zMin || 13.5} m
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-slate-500 text-[11px]">Z-Axis Top ($Z_{'{max}'}$)</div>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  +{selectedUnit.zMax || 16.5} m
                </div>
              </div>
            </div>
          </div>

          {/* Legal Ownership & Encumbrance Record */}
          <div className="mt-4 pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Title Deed & CERSAI Record
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Registered Owner:</span>
                <span className="font-bold text-slate-800">{selectedUnit.owner || 'Vikramaditya Roy'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Aadhaar Hash:</span>
                <span className="font-mono text-slate-700">SHA256: 8a4f...91c2</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Active Lien Holder:</span>
                <span className={`font-bold ${selectedUnit.hasConflict ? 'text-rose-600' : 'text-slate-800'}`}>
                  {selectedUnit.activeBank || 'State Bank of India'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Sanction Limit:</span>
                <span className="text-emerald-700 font-semibold">Approved by MCGM</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 space-y-2">
            <button 
              onClick={() => onNavigateToDeed(selectedUnit)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Inspect Sale Deed PDF (Document AI)</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
