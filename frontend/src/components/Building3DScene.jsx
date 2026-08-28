import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Color palette for unit types (Crisp Architectural Theme)
export const UNIT_COLORS = {
  residential: {
    base: 0x0284c7,     // Crisp Sky Blue
    emissive: 0x0369a1,
    glow: '#0284c7',
    edge: 0x38bdf8,
    label: 'Residential'
  },
  commercial: {
    base: 0x059669,     // Emerald Green
    emissive: 0x047857,
    glow: '#059669',
    edge: 0x34d399,
    label: 'Commercial'
  },
  parking: {
    base: 0xd97706,     // Warm Amber / Gold
    emissive: 0xb45309,
    glow: '#d97706',
    edge: 0xfbbf24,
    label: 'Parking'
  },
  utility: {
    base: 0x7c3aed,     // Tech Violet
    emissive: 0x6d28d9,
    glow: '#7c3aed',
    edge: 0xa78bfa,
    label: 'Utility'
  }
};

export default function Building3DScene({
  buildingData,
  selectedUnit,
  onSelectUnit,
  showUnderground = true,
  explosionFactor = 0.0,
  filterType = 'ALL',
  searchQuery = '',
  cameraTrigger,
  violatingUlpins = [],
  viewMode = '3D',
  isDroneScanning = false
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameRef = useRef(null);
  const resizeObserverRef = useRef(null);

  // References to meshes and groups
  const unitMeshesMapRef = useRef(new Map()); // ulpin -> Mesh
  const floorGroupsMapRef = useRef(new Map()); // floor_no -> Group
  const undergroundGroupRef = useRef(null);
  const groundGroupRef = useRef(null);
  const legacy2DGroupRef = useRef(null);
  const buildingRootGroupRef = useRef(null);

  // Raycasting & Interaction
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const hoveredMeshRef = useRef(null);

  const [hoveredUnitData, setHoveredUnitData] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false });

  // Helper: Create 3D Unit Mesh Box with Stylized Glass/Translucent Shading
  function createUnitMesh(unit, geom, slabThickness, floorNo) {
    const typeKey = (unit.type || 'residential').toLowerCase();
    const typeConfig = UNIT_COLORS[typeKey] || UNIT_COLORS.residential;

    const uWidth = Math.max(geom.width || 7.2, 1);
    const uHeight = Math.max(geom.height || 2.7, 1);
    const uDepth = Math.max(geom.depth || 7.2, 1);

    const unitBoxGeom = new THREE.BoxGeometry(uWidth, uHeight, uDepth);
    const isViolating = violatingUlpins.includes(unit.ulpin);

    const unitMat = new THREE.MeshStandardMaterial({
      color: isViolating ? 0xef4444 : typeConfig.base,
      emissive: isViolating ? 0xdc2626 : typeConfig.emissive,
      emissiveIntensity: isViolating ? 0.7 : 0.08,
      transparent: true,
      opacity: isViolating ? 0.92 : (floorNo < 0 ? 0.85 : 0.78),
      roughness: 0.25,
      metalness: 0.15
    });

    const unitMesh = new THREE.Mesh(unitBoxGeom, unitMat);
    unitMesh.position.set(geom.x || 0, slabThickness + uHeight / 2, geom.z || 0);
    unitMesh.castShadow = true;
    unitMesh.receiveShadow = true;

    // Unit Edge Wireframe for Sharp Architectural Definition
    const unitEdges = new THREE.EdgesGeometry(unitBoxGeom);
    const edgeMat = new THREE.LineBasicMaterial({
      color: isViolating ? 0xffffff : typeConfig.edge,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.95
    });
    const edgeLines = new THREE.LineSegments(unitEdges, edgeMat);
    unitMesh.add(edgeLines);

    // Attach complete metadata
    unitMesh.userData = {
      ...unit,
      floor_no: floorNo,
      typeConfig,
      originalColor: typeConfig.base,
      originalEmissive: typeConfig.emissive,
      originalEdgeColor: typeConfig.edge,
      isSelected: false,
      isViolating: isViolating
    };

    return unitMesh;
  }

  // Helper: Build Clean Ground Surface, 2D Legacy Footprints & 3D Building Meshes
  const buildBuilding = useCallback((scene, data) => {
    if (!scene || !data) return;

    // Remove existing building root group if present
    if (buildingRootGroupRef.current) {
      scene.remove(buildingRootGroupRef.current);
    }
    const buildingRoot = new THREE.Group();
    buildingRoot.name = 'BuildingRoot';
    buildingRootGroupRef.current = buildingRoot;

    // Remove existing 2D legacy group
    if (legacy2DGroupRef.current) {
      scene.remove(legacy2DGroupRef.current);
    }
    const legacy2DGroup = new THREE.Group();
    legacy2DGroup.name = 'Legacy2DGroup';
    legacy2DGroupRef.current = legacy2DGroup;

    floorGroupsMapRef.current.clear();
    unitMeshesMapRef.current.clear();

    const slabThickness = 0.3;
    const slabSize = 16.5;

    // --- A. Build Above-Ground Floors (Floors 1 to 5) ---
    data.floors?.forEach((floor) => {
      const floorNo = floor.floor_no ?? (floor.floorNumber || 1);
      const floorGroup = new THREE.Group();
      floorGroup.name = `Floor_${floorNo}`;
      floorGroup.userData = {
        floor_no: floorNo,
        baseElevation: (floorNo - 1) * 3.0
      };

      // 1. Structural Floor Slab
      const slabGeom = new THREE.BoxGeometry(slabSize, slabThickness, slabSize);
      const slabMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.45,
        metalness: 0.1
      });
      const slab = new THREE.Mesh(slabGeom, slabMat);
      slab.position.set(0, slabThickness / 2, 0);
      slab.receiveShadow = true;
      slab.castShadow = true;
      floorGroup.add(slab);

      // Slab Edge Outlines
      const slabEdges = new THREE.EdgesGeometry(slabGeom);
      const slabEdgeMat = new THREE.LineBasicMaterial({ color: 0xcbd5e1 });
      const slabEdgeLines = new THREE.LineSegments(slabEdges, slabEdgeMat);
      slabEdgeLines.position.copy(slab.position);
      floorGroup.add(slabEdgeLines);

      // 2. Floor Units (2-3 units per floor)
      floor.units?.forEach((unit, idx) => {
        const geom = unit.geometry || {
          x: idx === 0 ? -3.8 : (idx === 1 ? 3.8 : 0.0),
          z: idx === 2 ? 3.8 : -3.8,
          width: idx === 2 ? 14.8 : 7.2,
          depth: 7.2,
          height: 2.7,
          z_min: (floorNo - 1) * 3.0,
          z_max: floorNo * 3.0
        };

        const unitMesh = createUnitMesh(unit, geom, slabThickness, floorNo);
        floorGroup.add(unitMesh);
        unitMeshesMapRef.current.set(unit.ulpin, unitMesh);
      });

      // Place floor group at appropriate Y elevation
      const baseY = (floorNo - 1) * 3.0;
      floorGroup.position.set(0, baseY, 0);
      floorGroupsMapRef.current.set(floorNo, floorGroup);
      buildingRoot.add(floorGroup);
    });

    // --- B. Build Underground Level (B1) ---
    if (data.underground && data.underground.length > 0) {
      const ugGroup = new THREE.Group();
      ugGroup.name = 'UndergroundGroup';
      ugGroup.userData = { floor_no: -1, baseElevation: -3.0 };
      undergroundGroupRef.current = ugGroup;

      // Underground Foundation Slab
      const ugSlabGeom = new THREE.BoxGeometry(slabSize, slabThickness, slabSize);
      const ugSlabMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.6,
        metalness: 0.2
      });
      const ugSlab = new THREE.Mesh(ugSlabGeom, ugSlabMat);
      ugSlab.position.set(0, slabThickness / 2, 0);
      ugSlab.receiveShadow = true;
      ugGroup.add(ugSlab);

      const ugSlabEdges = new THREE.EdgesGeometry(ugSlabGeom);
      const ugSlabEdgeMat = new THREE.LineBasicMaterial({ color: 0x64748b });
      const ugSlabEdgeLines = new THREE.LineSegments(ugSlabEdges, ugSlabEdgeMat);
      ugSlabEdgeLines.position.copy(ugSlab.position);
      ugGroup.add(ugSlabEdgeLines);

      // Underground Units (Parking & Utilities)
      data.underground.forEach((unit, idx) => {
        const geom = unit.geometry || {
          x: idx === 0 ? -3.8 : (idx === 1 ? 3.8 : 0.0),
          z: idx === 2 ? 3.8 : -3.8,
          width: idx === 2 ? 14.8 : 7.2,
          depth: 7.2,
          height: 2.7,
          z_min: -3.0,
          z_max: 0.0
        };

        const unitMesh = createUnitMesh(unit, geom, slabThickness, -1);
        ugGroup.add(unitMesh);
        unitMeshesMapRef.current.set(unit.ulpin, unitMesh);
      });

      ugGroup.position.set(0, -3.0, 0);
      ugGroup.visible = showUnderground;
      buildingRoot.add(ugGroup);
    }

    // --- C. Build 2D Legacy Cadastre Footprint Map (for 2D Mode) ---
    const parcelFootprintGeom = new THREE.PlaneGeometry(18, 18);
    const parcelFootprintMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe, // Light Sky Blue 2D Parcel Tint
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    const parcelFootprint = new THREE.Mesh(parcelFootprintGeom, parcelFootprintMat);
    parcelFootprint.rotation.x = -Math.PI / 2;
    parcelFootprint.position.y = 0.03;
    parcelFootprint.receiveShadow = true;
    legacy2DGroup.add(parcelFootprint);

    // 2D Unit Footprint Subdivisions on Ground
    const floor1Units = data.floors?.[0]?.units || [];
    floor1Units.forEach((unit, idx) => {
      const geom = unit.geometry || {
        x: idx === 0 ? -3.8 : (idx === 1 ? 3.8 : 0.0),
        z: idx === 2 ? 3.8 : -3.8,
        width: idx === 2 ? 14.8 : 7.2,
        depth: 7.2
      };

      const unitPlaneGeom = new THREE.PlaneGeometry(geom.width - 0.2, geom.depth - 0.2);
      const unitPlaneMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0xbae6fd : (idx === 1 ? 0xa7f3d0 : 0xfde68a),
        side: THREE.DoubleSide
      });
      const unitPlane = new THREE.Mesh(unitPlaneGeom, unitPlaneMat);
      unitPlane.rotation.x = -Math.PI / 2;
      unitPlane.position.set(geom.x || 0, 0.04, geom.z || 0);
      legacy2DGroup.add(unitPlane);

      // Unit 2D Edge Outline
      const unitEdgeGeom = new THREE.EdgesGeometry(new THREE.BoxGeometry(geom.width - 0.2, 0.01, geom.depth - 0.2));
      const unitEdgeMat = new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 });
      const unitEdgeLine = new THREE.LineSegments(unitEdgeGeom, unitEdgeMat);
      unitEdgeLine.position.set(geom.x || 0, 0.05, geom.z || 0);
      legacy2DGroup.add(unitEdgeLine);
    });

    // Add Groups to Scene
    scene.add(buildingRoot);
    scene.add(legacy2DGroup);

    // Set initial visibility according to viewMode
    buildingRoot.visible = viewMode === '3D' && !isDroneScanning;
    legacy2DGroup.visible = viewMode === '2D' && !isDroneScanning;

  }, [showUnderground, violatingUlpins, viewMode, isDroneScanning]);

  // Helper: Build Clean Ground Surface and Cadastral Grid
  function buildGround(scene) {
    if (groundGroupRef.current) {
      scene.remove(groundGroupRef.current);
    }

    const groundGroup = new THREE.Group();
    groundGroup.name = 'GroundGroup';
    groundGroupRef.current = groundGroup;

    // 1. Off-white Ground Surface Plane
    const groundGeom = new THREE.PlaneGeometry(140, 140);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0.0,
      transparent: true,
      opacity: 0.85
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.0;
    ground.receiveShadow = true;
    groundGroup.add(ground);

    // 2. Clean Cadastral Grid Helper
    const grid = new THREE.GridHelper(90, 45, 0x94a3b8, 0xe2e8f0);
    grid.position.y = 0.01;
    groundGroup.add(grid);

    // 3. Cadastral Parcel Base Footprint Boundary (Clean Blue Polygon)
    const parcelBoundsGeom = new THREE.BoxGeometry(18, 0.08, 18);
    const parcelEdges = new THREE.EdgesGeometry(parcelBoundsGeom);
    const parcelLineMat = new THREE.LineBasicMaterial({ color: 0x2563eb, linewidth: 2.5 });
    const parcelLine = new THREE.LineSegments(parcelEdges, parcelLineMat);
    parcelLine.position.set(0, 0.04, 0);
    groundGroup.add(parcelLine);

    // 4. Subsurface Excavation Chamber Outline (Visible below ground)
    const subChamberGeom = new THREE.BoxGeometry(17, 3.5, 17);
    const subChamberEdges = new THREE.EdgesGeometry(subChamberGeom);
    const subChamberLineMat = new THREE.LineDashedMaterial({
      color: 0x94a3b8,
      dashSize: 0.5,
      gapSize: 0.3,
      transparent: true,
      opacity: 0.6
    });
    const subChamberLines = new THREE.LineSegments(subChamberEdges, subChamberLineMat);
    subChamberLines.computeLineDistances();
    subChamberLines.position.set(0, -1.75, 0);
    groundGroup.add(subChamberLines);

    scene.add(groundGroup);
  }

  // 1. Initialize Scene, Camera, Renderer, Controls & Setup ResizeObserver
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const initialW = Math.max(container.clientWidth || container.offsetWidth || 800, 100);
    const initialH = Math.max(container.clientHeight || container.offsetHeight || 600, 100);

    // --- Scene ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Clean slate-50 background
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.008);
    sceneRef.current = scene;

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(45, initialW / initialH, 0.5, 500);
    camera.position.set(26, 20, 30);
    camera.lookAt(0, 6.5, 0);
    cameraRef.current = camera;

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(initialW, initialH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // --- OrbitControls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 90;
    controls.minDistance = 6;
    controls.maxPolarAngle = Math.PI / 2 + 0.15; // Allow slight under-angle view
    controls.target.set(0, 6.5, 0);
    controls.update();
    controlsRef.current = controls;

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffdf5, 1.8);
    sunLight.position.set(25, 40, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0001;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.8);
    fillLight.position.set(-25, 15, -20);
    scene.add(fillLight);

    const bottomGlow = new THREE.PointLight(0x38bdf8, 0.8, 30);
    bottomGlow.position.set(0, -4, 0);
    scene.add(bottomGlow);

    // --- Ground & Cadastral Grid ---
    buildGround(scene);

    // --- Build Building Geometry immediately if data is already available ---
    if (buildingData) {
      buildBuilding(scene, buildingData);
    }

    // --- Resize Handler ---
    const updateSize = (w, h) => {
      if (!cameraRef.current || !rendererRef.current) return;
      const validW = Math.max(w, 100);
      const validH = Math.max(h, 100);
      cameraRef.current.aspect = validW / validH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(validW, validH, false);
    };

    // Use ResizeObserver for accurate sizing on initial mount & layout changes
    if (window.ResizeObserver) {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            updateSize(width, height);
          }
        }
      });
      ro.observe(container);
      resizeObserverRef.current = ro;
    }

    const handleWindowResize = () => {
      if (container) {
        updateSize(container.clientWidth, container.clientHeight);
      }
    };
    window.addEventListener('resize', handleWindowResize);

    // --- Render Loop ---
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Flashing pulse effect for violating/conflicted units and selected units
      unitMeshesMapRef.current.forEach((mesh) => {
        const isViolating = mesh.userData?.isViolating;
        const isSelected = mesh.userData?.isSelected;

        if (isViolating) {
          const clashPulse = (Math.sin(elapsedTime * 6) + 1) / 2;
          if (mesh.material && mesh.material.emissive) {
            mesh.material.emissiveIntensity = 0.4 + clashPulse * 0.7;
          }
        } else if (isSelected) {
          const selectPulse = (Math.sin(elapsedTime * 4) + 1) / 2;
          if (mesh.material && mesh.material.emissive) {
            mesh.material.emissiveIntensity = 0.5 + selectPulse * 0.5;
          }
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // 2. Re-build Building Geometry whenever buildingData changes
  useEffect(() => {
    if (sceneRef.current && buildingData) {
      buildBuilding(sceneRef.current, buildingData);
    }
  }, [buildingData, buildBuilding]);

  // 3. Handle View Mode Switching (2D Legacy vs 3D Volumetric ULPIN) & Drone Scan State
  useEffect(() => {
    if (buildingRootGroupRef.current) {
      buildingRootGroupRef.current.visible = viewMode === '3D' && !isDroneScanning;
    }
    if (legacy2DGroupRef.current) {
      legacy2DGroupRef.current.visible = viewMode === '2D' && !isDroneScanning;
    }

    // Auto-adjust camera when entering 2D mode vs 3D mode
    if (controlsRef.current && cameraRef.current && !isDroneScanning) {
      if (viewMode === '2D') {
        cameraRef.current.position.set(0, 36, 0.1);
        controlsRef.current.target.set(0, 0, 0);
      } else {
        cameraRef.current.position.set(26, 20, 30);
        controlsRef.current.target.set(0, 6.5, 0);
      }
      controlsRef.current.update();
    }
  }, [viewMode, isDroneScanning]);

  // 4. Handle Violating ULPINs (Topology Check Highlights)
  useEffect(() => {
    unitMeshesMapRef.current.forEach((mesh, ulpin) => {
      const isViolating = violatingUlpins.includes(ulpin);
      mesh.userData.isViolating = isViolating;

      if (mesh.material) {
        if (isViolating) {
          mesh.material.color.setHex(0xef4444); // Bold Red
          mesh.material.emissive.setHex(0xdc2626);
          mesh.material.emissiveIntensity = 0.8;
          mesh.material.opacity = 0.92;
        } else {
          mesh.material.color.setHex(mesh.userData.originalColor);
          mesh.material.emissive.setHex(mesh.userData.originalEmissive);
          mesh.material.emissiveIntensity = mesh.userData.isSelected ? 0.6 : 0.08;
          mesh.material.opacity = mesh.userData.floor_no < 0 ? 0.85 : 0.78;
        }
      }
    });
  }, [violatingUlpins]);

  // 5. Handle Exploded Floor View Slider
  useEffect(() => {
    floorGroupsMapRef.current.forEach((group, floorNo) => {
      const baseElev = group.userData.baseElevation;
      const offset = (floorNo - 1) * explosionFactor * 3.5;
      group.position.y = baseElev + offset;
    });

    if (undergroundGroupRef.current) {
      const offset = explosionFactor * 3.0;
      undergroundGroupRef.current.position.y = -3.0 - offset;
    }
  }, [explosionFactor]);

  // 6. Handle Show/Hide Underground Toggle
  useEffect(() => {
    if (undergroundGroupRef.current) {
      undergroundGroupRef.current.visible = showUnderground && viewMode === '3D';
    }
    if (groundGroupRef.current) {
      const groundMesh = groundGroupRef.current.children[0];
      if (groundMesh && groundMesh.material) {
        groundMesh.material.opacity = showUnderground ? 0.65 : 0.95;
      }
    }
  }, [showUnderground, viewMode]);

  // 7. Handle Selection Highlighting & Pulse
  useEffect(() => {
    unitMeshesMapRef.current.forEach((mesh, ulpin) => {
      const isCurrentSelected = selectedUnit && selectedUnit.ulpin === ulpin;
      mesh.userData.isSelected = isCurrentSelected;

      if (mesh.material && !mesh.userData.isViolating) {
        if (isCurrentSelected) {
          mesh.material.opacity = 0.95;
          mesh.material.emissiveIntensity = 0.6;
        } else {
          mesh.material.opacity = mesh.userData.floor_no < 0 ? 0.85 : 0.78;
          mesh.material.emissiveIntensity = 0.08;
        }
      }
    });
  }, [selectedUnit]);

  // 8. Handle Type Filtering & Search Highlight
  useEffect(() => {
    unitMeshesMapRef.current.forEach((mesh) => {
      const unitType = (mesh.userData.type || 'residential').toLowerCase();
      const ulpin = (mesh.userData.ulpin || '').toLowerCase();
      const owner = (mesh.userData.owner || '').toLowerCase();
      const unitNum = (mesh.userData.unit_number || '').toLowerCase();

      const matchesFilter = filterType === 'ALL' || unitType === filterType.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        ulpin.includes(searchQuery.toLowerCase()) ||
        owner.includes(searchQuery.toLowerCase()) ||
        unitNum.includes(searchQuery.toLowerCase());

      const isDimmed = !matchesFilter || !matchesSearch;

      if (mesh.material && !mesh.userData.isViolating) {
        mesh.material.opacity = isDimmed ? 0.15 : (mesh.userData.floor_no < 0 ? 0.85 : 0.78);
        mesh.material.transparent = true;
      }
    });
  }, [filterType, searchQuery]);

  // 9. Handle Camera Presets & Focus Trigger
  useEffect(() => {
    if (!cameraTrigger || !cameraRef.current || !controlsRef.current) return;
    const { mode, targetUnit } = cameraTrigger;

    if (mode === 'RESET') {
      cameraRef.current.position.set(26, 20, 30);
      controlsRef.current.target.set(0, 6.5, 0);
    } else if (mode === 'FRONT') {
      cameraRef.current.position.set(0, 10, 36);
      controlsRef.current.target.set(0, 6.5, 0);
    } else if (mode === 'TOP') {
      cameraRef.current.position.set(0, 42, 0.1);
      controlsRef.current.target.set(0, 0, 0);
    } else if (mode === 'SIDE') {
      cameraRef.current.position.set(36, 10, 0);
      controlsRef.current.target.set(0, 6.5, 0);
    } else if (mode === 'FOCUS_UNIT' && targetUnit) {
      const mesh = unitMeshesMapRef.current.get(targetUnit.ulpin);
      if (mesh) {
        const worldPos = new THREE.Vector3();
        mesh.getWorldPosition(worldPos);
        controlsRef.current.target.copy(worldPos);
        cameraRef.current.position.set(worldPos.x + 10, worldPos.y + 8, worldPos.z + 12);
      }
    }
    controlsRef.current.update();
  }, [cameraTrigger]);

  // 10. Raycasting: Mouse Hover Handler
  const handlePointerMove = useCallback((e) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current || isDroneScanning) return;
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    // Raycast only against visible unit meshes
    const meshes = Array.from(unitMeshesMapRef.current.values()).filter(
      (m) => m.parent && m.parent.visible && m.parent.parent && m.parent.parent.visible
    );
    const intersects = raycasterRef.current.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      if (hoveredMeshRef.current !== hitMesh) {
        if (hoveredMeshRef.current && !hoveredMeshRef.current.userData.isSelected && !hoveredMeshRef.current.userData.isViolating) {
          hoveredMeshRef.current.material.emissiveIntensity = 0.08;
        }
        hoveredMeshRef.current = hitMesh;
        if (!hitMesh.userData.isSelected && !hitMesh.userData.isViolating) {
          hitMesh.material.emissiveIntensity = 0.35;
        }
      }

      setHoveredUnitData(hitMesh.userData);
      setTooltipPos({
        x: e.clientX - rect.left + 14,
        y: e.clientY - rect.top + 14,
        visible: true
      });
    } else {
      if (hoveredMeshRef.current && !hoveredMeshRef.current.userData.isSelected && !hoveredMeshRef.current.userData.isViolating) {
        hoveredMeshRef.current.material.emissiveIntensity = 0.08;
      }
      hoveredMeshRef.current = null;
      setHoveredUnitData(null);
      setTooltipPos((prev) => ({ ...prev, visible: false }));
    }
  }, [isDroneScanning]);

  // 11. Raycasting: Mouse Click Handler
  const handlePointerClick = useCallback(
    (e) => {
      if (!mountRef.current || !cameraRef.current || isDroneScanning) return;
      const rect = mountRef.current.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const meshes = Array.from(unitMeshesMapRef.current.values()).filter(
        (m) => m.parent && m.parent.visible && m.parent.parent && m.parent.parent.visible
      );
      const intersects = raycasterRef.current.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        onSelectUnit(hit.userData);
      }
    },
    [onSelectUnit, isDroneScanning]
  );

  return (
    <div className="absolute inset-0 select-none overflow-hidden">
      {/* WebGL Canvas Viewport */}
      <div
        ref={mountRef}
        onMouseMove={handlePointerMove}
        onClick={handlePointerClick}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Dynamic Hover Tooltip */}
      {tooltipPos.visible && hoveredUnitData && !isDroneScanning && (
        <div
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          className={`absolute z-30 pointer-events-none text-white shadow-2xl rounded-xl px-3.5 py-2.5 text-xs border max-w-xs transition-opacity duration-150 animate-in fade-in zoom-in-95 ${
            hoveredUnitData.isViolating
              ? 'bg-rose-950/95 border-rose-500 ring-2 ring-rose-500/50'
              : 'bg-slate-900/95 backdrop-blur-md border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold text-slate-100 text-sm">
              {hoveredUnitData.unit_number || 'Cadastral Unit'}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                hoveredUnitData.isViolating
                  ? 'bg-rose-500 text-white animate-pulse'
                  : hoveredUnitData.type === 'residential'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : hoveredUnitData.type === 'commercial'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : hoveredUnitData.type === 'parking'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              }`}
            >
              {hoveredUnitData.isViolating ? '⚠️ CLASH' : hoveredUnitData.type}
            </span>
          </div>

          {hoveredUnitData.isViolating && (
            <div className="mt-1 text-[11px] font-bold text-rose-300 bg-rose-900/80 p-1.5 rounded border border-rose-700/60">
              🚨 3D Spatial Topology Conflict: Overlapping Unit Deed!
            </div>
          )}

          <div className="text-slate-300 text-[11px] mt-1.5 space-y-0.5">
            <div className="text-slate-400">
              Floor: <span className="text-white font-medium">{hoveredUnitData.floor_no < 0 ? 'Underground (B1)' : `Floor ${hoveredUnitData.floor_no}`}</span> • Owner: <span className="text-white font-medium">{hoveredUnitData.owner}</span>
            </div>
            <div className="font-mono text-[10px] text-blue-300 truncate bg-slate-800/80 px-1.5 py-0.5 rounded mt-1">
              {hoveredUnitData.ulpin}
            </div>
          </div>
          <div className="text-[9px] text-slate-400 mt-1 italic">
            Click unit to inspect volumetric record
          </div>
        </div>
      )}
    </div>
  );
}
