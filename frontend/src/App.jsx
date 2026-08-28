import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import Building3DScene from './components/Building3DScene';
import SidebarPanel from './components/SidebarPanel';
import ControlsDock from './components/ControlsDock';
import ContractSpecsModal from './components/ContractSpecsModal';
import TopologyResultModal from './components/TopologyResultModal';
import {
  fetchBuildingData,
  getAvailableBuildings,
  runTopologyValidation,
  simulateTopologyConflictDemo,
  USE_MOCK_DATA
} from './services/api';
import { MOCK_BUILDING_DATA } from './data/mockBuildingData';

export default function App() {
  const [selectedBuildingId, setSelectedBuildingId] = useState('B001');
  // Initialize with fallback so 3D Canvas mounts immediately with zero layout lag
  const [buildingData, setBuildingData] = useState(() => MOCK_BUILDING_DATA['B001']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Interactive 3D States
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [showUnderground, setShowUnderground] = useState(true);
  const [explosionFactor, setExplosionFactor] = useState(0.0);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cameraTrigger, setCameraTrigger] = useState(null);
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // AI Topology Validation States
  const [topologyResult, setTopologyResult] = useState(null);
  const [isValidatingTopology, setIsValidatingTopology] = useState(false);
  const [violatingUlpins, setViolatingUlpins] = useState([]);
  const [isTopologyModalOpen, setIsTopologyModalOpen] = useState(false);

  const availableBuildings = useMemo(() => getAvailableBuildings(), []);

  // Show Toast helper
  const showToast = (title, msg, type = 'info') => {
    setToast({ title, msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Fetch Building Data on Mount or Building Change
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await fetchBuildingData(selectedBuildingId);
        if (isMounted && data) {
          setBuildingData(data);
          // Clear any previous conflict highlights on building switch
          setViolatingUlpins([]);
          setTopologyResult(null);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[3D-ULPIN] Fetch error:', err.message);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedBuildingId]);

  // 2. Unit Selection Handlers
  const handleSelectUnit = (unit) => {
    setSelectedUnit(unit);
    if (unit) {
      const isConflict = violatingUlpins.includes(unit.ulpin);
      showToast(
        `${unit.unit_number || 'Unit Selected'}${isConflict ? ' [SPATIAL CLASH]' : ''}`,
        `ULPIN: ${unit.ulpin} • Owner: ${unit.owner}`,
        isConflict ? 'error' : 'info'
      );
    }
  };

  const handleFocusUnit = (unit) => {
    setCameraTrigger({ mode: 'FOCUS_UNIT', targetUnit: unit, timestamp: Date.now() });
    showToast('Camera Focused', `Centered view on ${unit.unit_number || 'target unit'}.`, 'info');
  };

  const handleResetCamera = () => {
    setCameraTrigger({ mode: 'RESET', timestamp: Date.now() });
    showToast('Camera Reset', 'Returned to default 3D orbit angle.', 'info');
  };

  const handleCameraPreset = ({ mode }) => {
    setCameraTrigger({ mode, timestamp: Date.now() });
  };

  // 3. AI Topology Check Handler
  const handleRunTopologyCheck = async () => {
    setIsValidatingTopology(true);
    showToast('AI Spatial Topology Check', 'Analyzing 3D geometry & non-overlap constraints...', 'info');

    try {
      const result = await runTopologyValidation(selectedBuildingId);
      setTopologyResult(result);
      setIsValidatingTopology(false);

      if (result.valid) {
        setViolatingUlpins([]);
        showToast(
          '✅ Topology Check Passed',
          '100% Consistent: All 18 parcels conform to ISO 19152 without spatial overlaps.',
          'success'
        );
        setIsTopologyModalOpen(true);
      } else {
        // Extract violating ULPINs
        const violating = [];
        result.overlap_violations?.forEach((v) => {
          if (v.unit_a) violating.push(v.unit_a);
          if (v.unit_b) violating.push(v.unit_b);
        });
        result.z_violations?.forEach((z) => {
          if (z.unit) violating.push(z.unit);
        });
        const uniqueViolators = [...new Set(violating)];
        setViolatingUlpins(uniqueViolators);
        setIsTopologyModalOpen(true);

        showToast(
          '🚨 Topology Conflict Detected!',
          `${result.overlap_violations?.length || 1} volumetric overlaps found. Units highlighted in red in 3D.`,
          'error'
        );
      }
    } catch (err) {
      setIsValidatingTopology(false);
      showToast('Validation Error', err.message, 'error');
    }
  };

  // 4. Simulate Conflict Handler (for Judge Demo)
  const handleSimulateConflict = () => {
    const syntheticResult = simulateTopologyConflictDemo(buildingData);
    setTopologyResult(syntheticResult);
    const violating = [
      syntheticResult.overlap_violations[0].unit_a,
      syntheticResult.overlap_violations[0].unit_b
    ];
    setViolatingUlpins(violating);
    setIsTopologyModalOpen(true);

    showToast(
      '🚨 Synthetic Conflict Injected (Demo)',
      'Simulated overlapping unit title deeds on Floor 2. Violating voxels glowing red in 3D!',
      'error'
    );
  };

  // 5. Highlight & Focus Conflicted Units
  const handleHighlightConflicts = () => {
    if (violatingUlpins.length > 0) {
      const targetUlpin = violatingUlpins[0];
      setCameraTrigger({
        mode: 'FOCUS_UNIT',
        targetUnit: { ulpin: targetUlpin },
        timestamp: Date.now()
      });
      showToast('Camera Centered on Conflict', 'Targeting overlapping volumetric voxel in 3D viewport.', 'info');
    }
  };

  // 6. Clear Highlights
  const handleClearConflicts = () => {
    setViolatingUlpins([]);
    setTopologyResult(null);
    showToast('Conflict Reset', 'Restored default cadastre visualization.', 'info');
  };

  // 7. Compute Unit Counts for Quick Filters
  const unitCounts = useMemo(() => {
    if (!buildingData) return { total: 0, residential: 0, commercial: 0, parking: 0, utility: 0 };
    const aboveGroundUnits = buildingData.floors?.flatMap((f) => f.units || []) || [];
    const undergroundUnits = buildingData.underground || [];
    const all = [...aboveGroundUnits, ...undergroundUnits];

    return {
      total: all.length,
      residential: all.filter((u) => (u.type || '').toLowerCase() === 'residential').length,
      commercial: all.filter((u) => (u.type || '').toLowerCase() === 'commercial').length,
      parking: all.filter((u) => (u.type || '').toLowerCase() === 'parking').length,
      utility: all.filter((u) => (u.type || '').toLowerCase() === 'utility').length
    };
  }, [buildingData]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 text-slate-900 font-sans antialiased overflow-hidden">
      
      {/* Top Navbar with Building Selector & Mock Data Indicator */}
      <Navbar
        selectedBuildingId={selectedBuildingId}
        onSelectBuilding={(id) => {
          setSelectedBuildingId(id);
          showToast('Building Changed', `Switched to Building ${id}.`, 'info');
        }}
        availableBuildings={availableBuildings}
        onResetView={handleResetCamera}
        onOpenSpecsModal={() => setIsSpecsModalOpen(true)}
      />

      {/* Main 3D Workspace */}
      <main className="flex-1 flex relative overflow-hidden min-h-0">
        
        {/* 3D WebGL Canvas & Overlay Controls */}
        <div className="flex-1 relative h-full bg-slate-50 min-h-0 min-w-0">
          {/* Three.js Scene Viewport */}
          <Building3DScene
            buildingData={buildingData}
            selectedUnit={selectedUnit}
            onSelectUnit={handleSelectUnit}
            showUnderground={showUnderground}
            explosionFactor={explosionFactor}
            filterType={filterType}
            searchQuery={searchQuery}
            cameraTrigger={cameraTrigger}
            violatingUlpins={violatingUlpins}
          />

          {/* Floating Controls Dock (Search, Filters, Explode Slider, Camera, Underground Toggle, AI Topology Check) */}
          <ControlsDock
            showUnderground={showUnderground}
            onToggleUnderground={() => {
              setShowUnderground(!showUnderground);
              showToast(
                !showUnderground ? 'Underground Layer Enabled' : 'Underground Layer Hidden',
                !showUnderground ? 'Subsurface parking & utility level is now visible.' : 'Subsurface level hidden.',
                'info'
              );
            }}
            explosionFactor={explosionFactor}
            onChangeExplosion={setExplosionFactor}
            filterType={filterType}
            onSelectFilter={setFilterType}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onTriggerCamera={handleCameraPreset}
            unitCounts={unitCounts}
            onRunTopologyCheck={handleRunTopologyCheck}
            isValidatingTopology={isValidatingTopology}
            violatingUlpins={violatingUlpins}
            onOpenTopologyModal={() => setIsTopologyModalOpen(true)}
          />
        </div>

        {/* Right Slide-over / Sidebar Panel */}
        <SidebarPanel
          selectedUnit={selectedUnit}
          onClose={() => setSelectedUnit(null)}
          buildingData={buildingData}
          onFocusUnit={handleFocusUnit}
        />

      </main>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-3 rounded-xl border shadow-2xl text-xs flex items-center gap-3 max-w-sm backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-rose-950/95 text-white border-rose-600 shadow-rose-900/30'
                : toast.type === 'success'
                ? 'bg-emerald-950/95 text-white border-emerald-600 shadow-emerald-900/30'
                : 'bg-slate-900/95 text-white border-slate-700 shadow-black/40'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 animate-ping ${
                toast.type === 'error'
                  ? 'bg-rose-400'
                  : toast.type === 'success'
                  ? 'bg-emerald-400'
                  : 'bg-blue-400'
              }`}
            ></span>
            <div>
              <div className="font-bold text-slate-100">{toast.title}</div>
              <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{toast.msg}</div>
            </div>
          </div>
        </div>
      )}

      {/* AI Topology Validation Result Modal */}
      <TopologyResultModal
        isOpen={isTopologyModalOpen}
        onClose={() => setIsTopologyModalOpen(false)}
        topologyResult={topologyResult}
        buildingId={selectedBuildingId}
        onHighlightConflicts={handleHighlightConflicts}
        onClearConflicts={handleClearConflicts}
        onSimulateConflict={handleSimulateConflict}
        violatingUlpins={violatingUlpins}
      />

      {/* Contract & API Swap Guide Modal */}
      <ContractSpecsModal
        isOpen={isSpecsModalOpen}
        onClose={() => setIsSpecsModalOpen(false)}
      />

    </div>
  );
}
