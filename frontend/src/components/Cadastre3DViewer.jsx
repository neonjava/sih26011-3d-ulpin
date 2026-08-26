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
  MapPin
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
  const [explosionFactor, setExplosionFactor] = useState(1.2);
  const [selectedFloorFilter, setSelectedFloorFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('SOLID'); // 'SOLID', 'WIREFRAME', 'SANCTION_ONLY', 'CLASH_HEATMAP'
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

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a12);
    scene.fog = new THREE.FogExp2(0x070a12, 0.012);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 1000);
    camera.position.set(38, 30, 48);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 180;
    controls.minDistance = 8;
    controls.maxPolarAngle = Math.PI / 2 + 0.15; // Allow looking slightly upward from below ground
    controls.target.set(0, 16, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(30, 60, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0001;
    scene.add(dirLight);
    sunLightRef.current = dirLight;

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    fillLight.position.set(-30, 20, -30);
    scene.add(fillLight);

    const blueSubLight = new THREE.PointLight(0x06b6d4, 2, 40);
    blueSubLight.position.set(0, -12, 0);
    scene.add(blueSubLight);

    // 6. Ground Surface & Cadastre Parcel Grid
    buildGroundEnvironment(scene, parcel);

    // 7. Render Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Pulsing effect for conflicted/fraud units
      objectsMapRef.current.forEach((mesh, unitId) => {
        if (mesh.userData?.hasConflict || mesh.userData?.status === 'CRITICAL_CONFLICT' || mesh.userData?.status === 'SANCTION_BREACH') {
          const pulse = (Math.sin(elapsedTime * 4) + 1) / 2;
          if (mesh.material && mesh.material.emissive) {
            mesh.material.emissiveIntensity = 0.5 + pulse * 1.5;
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

    // Clean up previous special meshes
    const prevEnv = scene.getObjectByName('SanctionEnvelope');
    if (prevEnv) scene.remove(prevEnv);
    const prevSub = scene.getObjectByName('SubsurfaceGroup');
    if (prevSub) scene.remove(prevSub);
    const prevAir = scene.getObjectByName('AirRightsGroup');
    if (prevAir) scene.remove(prevAir);

    // 1. Build Subsurface (Metro + Basements)
    const subsurfaceGroup = new THREE.Group();
    subsurfaceGroup.name = 'SubsurfaceGroup';

    // Metro Tunnel Tube
    if (parcel.subsurfaceMetro) {
      const tunnelGeom = new THREE.CylinderGeometry(4.5, 4.5, 70, 32, 1, true);
      const tunnelMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.8,
        roughness: 0.3,
        side: THREE.DoubleSide,
        wireframe: false
      });
      const tunnel = new THREE.Mesh(tunnelGeom, tunnelMat);
      tunnel.rotation.z = Math.PI / 2;
      tunnel.position.set(0, -15, 12);
      subsurfaceGroup.add(tunnel);

      // Metro Rails & Glow Track
      const trackGeom = new THREE.BoxGeometry(70, 0.4, 3);
      const trackMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true });
      const track = new THREE.Mesh(trackGeom, trackMat);
      track.position.set(0, -17.5, 12);
      subsurfaceGroup.add(track);

      // Subsurface Piles Foundation
      const pileGeom = new THREE.CylinderGeometry(0.6, 0.6, 12, 16);
      const pileMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
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
    const envLineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2, transparent: true, opacity: 0.45 });
    const envLines = new THREE.LineSegments(envEdges, envLineMat);
    envLines.position.set(0, sanctionHeight / 2, 0);

    const envFillMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.04,
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

    // 3. Build Air Rights Envelope (Sky Corridor)
    if (parcel.airRights) {
      const airGeom = new THREE.BoxGeometry(22, 16, 22);
      const airEdges = new THREE.EdgesGeometry(airGeom);
      const airLineMat = new THREE.LineBasicMaterial({ color: 0xeab308, transparent: true, opacity: 0.4 });
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
    parcel.floors.forEach((floor, index) => {
      const floorGroup = new THREE.Group();
      floorGroup.name = `Floor_${floor.floorNumber}`;
      floorGroup.userData = { floorNumber: floor.floorNumber, baseElevation: floor.zMin, isSanctioned: floor.isSanctioned !== false };

      // Floor Concrete Slab
      const slabThickness = 0.35;
      const slabWidth = 17.5;
      const slabGeom = new THREE.BoxGeometry(slabWidth, slabThickness, slabWidth);
      const slabMat = new THREE.MeshStandardMaterial({
        color: floor.floorNumber < 0 ? 0x1e293b : (floor.isSanctioned === false ? 0x450a0a : 0x0f172a),
        roughness: 0.7,
        metalness: 0.2
      });
      const slab = new THREE.Mesh(slabGeom, slabMat);
      slab.position.set(0, -slabThickness / 2, 0);
      slab.receiveShadow = true;
      floorGroup.add(slab);

      // Floor Units / Voxels
      floor.units.forEach((unit) => {
        const uPos = unit.position || { x: 0, z: 0, width: 7.5, depth: 7.5 };
        const uHeight = (unit.zMax - unit.zMin) - slabThickness;
        const unitGeom = new THREE.BoxGeometry(uPos.width, uHeight, uPos.depth);

        // Determine Material Color based on conflict status
        let unitColor = 0x0284c7;
        let emissiveColor = 0x000000;
        let opacity = 0.82;
        let isConflict = unit.hasConflict;

        if (unit.floorNumber < 0) {
          // Basement
          unitColor = isConflict ? 0xef4444 : 0x475569;
          emissiveColor = isConflict ? 0x991b1b : 0x000000;
          opacity = 0.75;
        } else if (unit.status === 'CRITICAL_CONFLICT' || isConflict) {
          // Double mortgage / Duplicate loan clash
          unitColor = 0xef4444;
          emissiveColor = 0xef4444;
          opacity = 0.92;
        } else if (unit.status === 'SANCTION_BREACH' || floor.isSanctioned === false) {
          // Phantom illegal floor
          unitColor = 0xf43f5e;
          emissiveColor = 0xe11d48;
          opacity = 0.9;
        } else {
          // Regular Clean Unit
          unitColor = (unit.floorNumber % 2 === 0) ? 0x0369a1 : 0x0284c7;
          emissiveColor = 0x082f49;
          opacity = 0.78;
        }

        const unitMat = new THREE.MeshStandardMaterial({
          color: unitColor,
          emissive: emissiveColor,
          emissiveIntensity: isConflict ? 0.8 : 0.15,
          transparent: true,
          opacity: opacity,
          roughness: 0.3,
          metalness: 0.3,
          wireframe: viewMode === 'WIREFRAME'
        });

        const unitMesh = new THREE.Mesh(unitGeom, unitMat);
        unitMesh.position.set(uPos.x, uHeight / 2, uPos.z);
        unitMesh.castShadow = true;
        unitMesh.receiveShadow = true;

        // Add glowing edge wireframe for architectural clarity
        const unitEdges = new THREE.EdgesGeometry(unitGeom);
        const edgeColor = isConflict ? 0xffffff : (floor.isSanctioned === false ? 0xff6b6b : 0x38bdf8);
        const edgeMat = new THREE.LineBasicMaterial({ color: edgeColor, linewidth: 1.5 });
        const edgeLines = new THREE.LineSegments(unitEdges, edgeMat);
        unitMesh.add(edgeLines);

        // Store metadata on mesh for Raycaster
        unitMesh.userData = {
          ...unit,
          floorNumber: floor.floorNumber,
          floorName: floor.name
        };

        floorGroup.add(unitMesh);
        objectsMapRef.current.set(unit.id, unitMesh);
      });

      // Calculate base Y position
      floorGroup.position.y = floor.zMin;
      scene.add(floorGroup);
      floorGroupsRef.current.set(floor.floorNumber, floorGroup);
    });

    updateFloorExplosion(explosionFactor);
  }, [parcel, viewMode]);

  // Update Floor Explosion Positions
  const updateFloorExplosion = (factor) => {
    if (!parcel) return;
    floorGroupsRef.current.forEach((group, floorNum) => {
      const floorData = parcel.floors.find(f => f.floorNumber === floorNum);
      if (!floorData) return;

      if (selectedFloorFilter !== 'ALL' && selectedFloorFilter !== floorNum) {
        group.visible = false;
      } else {
        group.visible = floorNum < 0 ? showSubsurface : true;
      }

      // Vertical explosion translation formula:
      // Y_exploded = Base_Z + (FloorIndex * factor * 2.5)
      let offset = 0;
      if (factor > 0) {
        if (floorNum >= 0) {
          offset = floorNum * factor * 2.8;
        } else {
          // Negative floors explode downwards
          offset = floorNum * factor * 2.8;
        }
      }
      group.position.y = floorData.zMin + offset;
    });
  };

  useEffect(() => {
    updateFloorExplosion(explosionFactor);
  }, [explosionFactor, selectedFloorFilter, showSubsurface]);

  // Toggle Visibility Updates
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

  // Highlight active selected unit in 3D
  useEffect(() => {
    objectsMapRef.current.forEach((mesh, id) => {
      const isSelected = selectedUnit && selectedUnit.id === id;
      const isConflictTarget = highlightConflictId && highlightConflictId === id;
      
      if (mesh.material) {
        if (isSelected || isConflictTarget) {
          mesh.material.emissive = new THREE.Color(isSelected ? 0x3b82f6 : 0xef4444);
          mesh.material.emissiveIntensity = 1.2;
          mesh.material.opacity = 0.98;
          mesh.scale.set(1.04, 1.04, 1.04);
        } else {
          const isConf = mesh.userData?.hasConflict;
          mesh.material.emissive = new THREE.Color(isConf ? 0xef4444 : 0x082f49);
          mesh.material.emissiveIntensity = isConf ? 0.8 : 0.15;
          mesh.material.opacity = isConf ? 0.92 : 0.8;
          mesh.scale.set(1.0, 1.0, 1.0);
        }
      }
    });
  }, [selectedUnit, highlightConflictId]);

  // Raycasting Click & Hover Handlers
  const handlePointerMove = (e) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const interactiveMeshes = Array.from(objectsMapRef.current.values()).filter(m => m.parent && m.parent.visible);
    const intersects = raycasterRef.current.intersectObjects(interactiveMeshes, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const unitData = hitMesh.userData;
      setHoveredUnit(unitData);
      setTooltipPos({
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top - 15,
        visible: true
      });
      mountRef.current.style.cursor = 'pointer';
    } else {
      setHoveredUnit(null);
      setTooltipPos(prev => ({ ...prev, visible: false }));
      mountRef.current.style.cursor = 'default';
    }
  };

  const handlePointerClick = (e) => {
    if (!hoveredUnit) return;
    onSelectUnit(hoveredUnit);
  };

  // Build Ground Plane & Cadastre Parcel Grid
  function buildGroundEnvironment(scene, parcel) {
    // 1. Surrounding Terrain Mesh
    const groundGeom = new THREE.PlaneGeometry(160, 160, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // 2. Cyber Cadastre Grid Lines
    const grid = new THREE.GridHelper(140, 70, 0x3b82f6, 0x1e293b);
    grid.position.y = 0.05;
    scene.add(grid);

    // 3. Cadastre Plot Boundary Perimeter (BND-1245/8)
    const parcelBoundaryGeom = new THREE.BufferGeometry();
    const boundPoints = [
      new THREE.Vector3(-12, 0.1, -12),
      new THREE.Vector3(12, 0.1, -12),
      new THREE.Vector3(12, 0.1, 12),
      new THREE.Vector3(-12, 0.1, 12),
      new THREE.Vector3(-12, 0.1, -12),
    ];
    parcelBoundaryGeom.setFromPoints(boundPoints);
    const parcelBoundaryMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, linewidth: 3 });
    const parcelBoundary = new THREE.Line(parcelBoundaryGeom, parcelBoundaryMat);
    scene.add(parcelBoundary);

    // 4. Survey Corner Beacon Markers
    const beaconGeom = new THREE.ConeGeometry(0.5, 1.8, 4);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    [[-12, -12], [12, -12], [12, 12], [-12, 12]].forEach(([x, z]) => {
      const beacon = new THREE.Mesh(beaconGeom, beaconMat);
      beacon.position.set(x, 0.9, z);
      scene.add(beacon);
    });
  }

  // Reset Camera View
  const resetCamera = (preset = 'DEFAULT') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    switch (preset) {
      case 'TOP':
        camera.position.set(0, 70, 0.1);
        controls.target.set(0, 16, 0);
        break;
      case 'FRONT':
        camera.position.set(0, 20, 60);
        controls.target.set(0, 18, 0);
        break;
      case 'SUBSURFACE':
        camera.position.set(25, -15, 30);
        controls.target.set(0, -6, 0);
        setShowSubsurface(true);
        break;
      case 'SANCTION_PROFILE':
        camera.position.set(50, 38, 0);
        controls.target.set(0, 38, 0);
        setShowSanctionEnvelope(true);
        break;
      default:
        camera.position.set(38, 30, 48);
        controls.target.set(0, 16, 0);
    }
    controls.update();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedUlpin(true);
    setTimeout(() => setCopiedUlpin(false), 2000);
  };

  return (
    <div className="relative w-full h-[calc(100vh-7rem)] min-h-[600px] flex overflow-hidden rounded-2xl border border-blue-500/20 bg-[#070A12] shadow-2xl">
      
      {/* 3D WebGL Canvas Area */}
      <div 
        ref={mountRef} 
        onMouseMove={handlePointerMove}
        onClick={handlePointerClick}
        className="w-full h-full relative focus:outline-none"
      />

      {/* Floating Hover Tooltip */}
      {tooltipPos.visible && hoveredUnit && (
        <div 
          className="absolute z-40 pointer-events-none p-3 rounded-xl glass-panel-glow border border-blue-400/40 text-xs shadow-2xl transition-all duration-75"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-white text-sm">{hoveredUnit.unitNumber}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              hoveredUnit.hasConflict 
                ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {hoveredUnit.hasConflict ? '⚠️ FRAUD / CLASH' : '✓ CLEAR'}
            </span>
          </div>
          <p className="text-slate-300 text-[11px]">Floor: {hoveredUnit.floorNumber} | Area: {hoveredUnit.carpetArea} m²</p>
          <p className="text-blue-300 font-mono text-[10px] mt-1">Z: {hoveredUnit.zMin.toFixed(1)}m to {hoveredUnit.zMax.toFixed(1)}m</p>
          <p className="text-slate-400 text-[10px] mt-0.5">Click to inspect 3D-ULPIN & legal deed</p>
        </div>
      )}

      {/* Top-Left Cadastre HUD Overlay */}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-2 max-w-sm">
        <div className="glass-panel p-3.5 rounded-xl border border-white/10 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{parcel.name}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                CTS: {parcel.surveyNumber} • {parcel.city}
              </p>
            </div>
            <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-400/30 text-blue-300 font-mono text-[10px] font-semibold">
              FSI MAX: {parcel.sanctionedMaxHeight}m
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-white/5 text-[11px]">
            <div>
              <span className="text-slate-500 text-[10px] block">Floors</span>
              <span className="font-bold text-white">
                {parcel.sanctionedFloors} Sanctioned
                {parcel.actualFloors > parcel.sanctionedFloors && (
                  <span className="text-rose-400 font-mono text-[10px] block">
                    (+{parcel.actualFloors - parcel.sanctionedFloors} Illegal)
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Basements</span>
              <span className="font-bold text-cyan-300">{parcel.basementLevels} Levels</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">3D Status</span>
              <span className={`font-bold ${parcel.activeDisputes > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {parcel.activeDisputes > 0 ? `${parcel.activeDisputes} Conflicts` : 'All Clear'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Camera Presets bar */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg glass-panel text-[11px]">
          <button 
            onClick={() => resetCamera('DEFAULT')}
            className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-blue-600 text-slate-300 hover:text-white transition"
          >
            3D Orbit
          </button>
          <button 
            onClick={() => resetCamera('TOP')}
            className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-blue-600 text-slate-300 hover:text-white transition"
          >
            Cadastre Top
          </button>
          <button 
            onClick={() => resetCamera('SUBSURFACE')}
            className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-cyan-600 text-slate-300 hover:text-white transition"
          >
            🚇 Metro Tunnel
          </button>
          <button 
            onClick={() => resetCamera('SANCTION_PROFILE')}
            className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-amber-600 text-slate-300 hover:text-white transition"
          >
            📐 FSI Plane
          </button>
        </div>
      </div>

      {/* Bottom Floating Controls Bar (Exploded Floor Slider, Toggles, Sunlight) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center gap-3 p-2.5 px-4 rounded-2xl glass-panel-glow border border-blue-500/30 shadow-2xl max-w-4xl w-[94%] sm:w-auto">
        
        {/* Exploded Floor Slider */}
        <div className="flex items-center gap-3 pr-3 border-r border-white/10">
          <div className="flex items-center gap-1 text-xs font-semibold text-blue-300 whitespace-nowrap">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Exploded Floor View:</span>
            <span className="font-mono text-white text-xs">{explosionFactor.toFixed(1)}x</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="3.0" 
            step="0.1"
            value={explosionFactor}
            onChange={(e) => setExplosionFactor(parseFloat(e.target.value))}
            className="w-28 sm:w-36 accent-blue-500 cursor-pointer"
          />
        </div>

        {/* Floor Filter Selector */}
        <div className="flex items-center gap-1.5 pr-3 border-r border-white/10">
          <span className="text-[11px] text-slate-400 font-medium hidden md:inline">Isolate:</span>
          <select
            value={selectedFloorFilter}
            onChange={(e) => setSelectedFloorFilter(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
            className="bg-slate-900 text-xs font-semibold text-white px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-blue-400 cursor-pointer"
          >
            <option value="ALL">🏢 All Floors</option>
            {parcel.floors.map(f => (
              <option key={f.floorNumber} value={f.floorNumber}>
                {f.name} {f.isSanctioned === false ? '⚠️ (UNAUTHORIZED)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSubsurface(!showSubsurface)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition ${
              showSubsurface ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
            title="Toggle Underground Metro & Basements"
          >
            🚇 Metro / Subsurface
          </button>

          <button
            onClick={() => setShowSanctionEnvelope(!showSanctionEnvelope)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition ${
              showSanctionEnvelope ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
            title="Toggle Municipal Sanction Height Envelope"
          >
            📐 FSI Envelope
          </button>

          <button
            onClick={() => setShowAirRights(!showAirRights)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition ${
              showAirRights ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
            title="Toggle Rooftop Air Rights & Flight Corridor"
          >
            ✈️ Air Rights
          </button>
        </div>

        {/* View Mode wireframe toggle */}
        <button
          onClick={() => setViewMode(viewMode === 'SOLID' ? 'WIREFRAME' : 'SOLID')}
          className={`p-1.5 rounded text-xs font-medium border transition ${
            viewMode === 'WIREFRAME' ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
          title="Toggle Wireframe Mesh"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right-Side Property Inspector Slide-Over Panel */}
      {selectedUnit && (
        <div className="absolute top-0 right-0 z-40 w-full sm:w-96 h-full bg-[#0B0F19]/95 backdrop-blur-2xl border-l border-blue-500/30 p-5 overflow-y-auto shadow-2xl flex flex-col justify-between transition-all duration-300">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${
                  selectedUnit.hasConflict ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {selectedUnit.hasConflict ? <ShieldAlert className="w-5 h-5 animate-pulse" /> : <Layers className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">{selectedUnit.unitNumber}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Floor {selectedUnit.floorNumber} • {selectedUnit.type}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onSelectUnit(null)}
                className="text-slate-400 hover:text-white text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Conflict Alert Banner if any */}
            {selectedUnit.hasConflict && (
              <div className="mt-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 shadow-neon-red">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 animate-bounce" />
                  <span>3D CERSAI CLASH / SANCTION VIOLATION</span>
                </div>
                <p className="text-[11px] text-red-200/90 mt-1.5 leading-relaxed font-sans">
                  {selectedUnit.conflictDetails}
                </p>
                {selectedUnit.activeLienBank && (
                  <div className="mt-2 pt-2 border-t border-red-500/30 text-[11px] font-mono text-red-300 flex justify-between">
                    <span>Lien: {selectedUnit.activeLienBank}</span>
                    <span className="font-bold">{selectedUnit.lienAmount}</span>
                  </div>
                )}
              </div>
            )}

            {/* 3D-ULPIN Unique Identifier Card */}
            <div className="mt-4 p-3 rounded-xl bg-slate-900/90 border border-blue-500/30">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span className="font-semibold text-blue-400">ISO 19152 3D-ULPIN CODE</span>
                <button
                  onClick={() => copyToClipboard(selectedUnit.ulpin3d)}
                  className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
                >
                  {copiedUlpin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUlpin ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="font-mono text-xs font-bold text-cyan-300 break-all select-all">
                {selectedUnit.ulpin3d}
              </p>
            </div>

            {/* Volumetric Spatial Metrics */}
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Volumetric Bounds (Z-Axis)
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Elevation Interval (Z)</span>
                  <span className="font-mono font-bold text-white">
                    {selectedUnit.zMin.toFixed(1)}m → {selectedUnit.zMax.toFixed(1)}m
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Clear Slab Height</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {(selectedUnit.zMax - selectedUnit.zMin).toFixed(1)} meters
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">RERA Carpet Area</span>
                  <span className="font-bold text-white">{selectedUnit.carpetArea} sq.m</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Estimated 3D Volume</span>
                  <span className="font-bold text-cyan-300">
                    {(selectedUnit.carpetArea * (selectedUnit.zMax - selectedUnit.zMin)).toFixed(1)} m³
                  </span>
                </div>
              </div>
            </div>

            {/* Legal Ownership & Encumbrance Record */}
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Legal Land Registry (Index-II)
              </h4>
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Registered Owner:</span>
                  <span className="font-semibold text-white text-right">{selectedUnit.ownerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">LADM Spatial Class:</span>
                  <span className="font-mono text-cyan-400">{selectedUnit.ladmClass}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CERSAI Charge Ref:</span>
                  <span className="font-mono text-slate-200">{selectedUnit.cersaiId || 'None (Unencumbered)'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-2">
            <button
              onClick={() => onNavigateToBanker(selectedUnit)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-neon-red transition"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Verify Mortgage in 3D CERSAI</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onNavigateToDeed(selectedUnit)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
            >
              <ExternalLink className="w-4 h-4 text-cyan-400" />
              <span>Inspect Sale Deed in Document AI</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
