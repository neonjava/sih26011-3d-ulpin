import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import Building3DScene from './components/Building3DScene';
import SidebarPanel from './components/SidebarPanel';
import ControlsDock from './components/ControlsDock';
import ContractSpecsModal from './components/ContractSpecsModal';
import { fetchBuildingData, getAvailableBuildings, USE_MOCK_DATA } from './services/api';
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

  const availableBuildings = useMemo(() => getAvailableBuildings(), []);

  // Show Toast helper
  const showToast = (title, msg, type = 'info') => {
    setToast({ title, msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Fetch Building Data on Mount or Building Change
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await fetchBuildingData(selectedBuildingId);
        if (isMounted && data) {
          setBuildingData(data);
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
      showToast(
        `${unit.unit_number || 'Unit Selected'}`,
        `ULPIN: ${unit.ulpin} • Owner: ${unit.owner}`,
        'info'
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

  // 3. Compute Unit Counts for Quick Filters
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
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans antialiased overflow-hidden">
      
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
      <main className="flex-1 flex relative overflow-hidden h-[calc(100vh-6.5rem)]">
        
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
          />

          {/* Floating Controls Dock (Search, Filters, Explode Slider, Camera, Underground Toggle) */}
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
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-xl border border-slate-700 shadow-2xl text-xs flex items-center gap-3 max-w-sm">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            <div>
              <div className="font-bold text-slate-100">{toast.title}</div>
              <div className="text-[11px] text-slate-300 mt-0.5">{toast.msg}</div>
            </div>
          </div>
        </div>
      )}

      {/* Contract & API Swap Guide Modal */}
      <ContractSpecsModal
        isOpen={isSpecsModalOpen}
        onClose={() => setIsSpecsModalOpen(false)}
      />

    </div>
  );
}
