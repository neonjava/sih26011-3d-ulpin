import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Cadastre3DViewer from './components/Cadastre3DViewer';
import BankerPortal from './components/BankerPortal';
import DocumentAIStudio from './components/DocumentAIStudio';
import RegistrarAnalytics from './components/RegistrarAnalytics';
import ArchitectureModal from './components/ArchitectureModal';
import { PARCELS } from './data/mockCadastreData';

export default function App() {
  const [parcels, setParcels] = useState(PARCELS);
  const [selectedParcel, setSelectedParcel] = useState(PARCELS[0]);
  const [activeTab, setActiveTab] = useState('digital-twin'); // 'digital-twin', 'banker-portal', 'document-ai', 'analytics'
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [highlightConflictId, setHighlightConflictId] = useState(null);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (title, msg, type = 'info') => {
    setToastMessage({ title, msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleNavigateToBanker = (unit) => {
    setSelectedUnit(unit);
    setActiveTab('banker-portal');
    showToast('Banker Portal Linked', `Selected unit ${unit.unitNumber} loaded for 3D CERSAI inquiry.`, 'success');
  };

  const handleNavigateToDeed = (unit) => {
    setSelectedUnit(unit);
    setActiveTab('document-ai');
    showToast('Document AI Workbench', `Sale deed for ${unit.unitNumber} ready for inspection.`, 'info');
  };

  const handleNavigateTo3D = (target) => {
    setActiveTab('digital-twin');
    if (target) {
      if (target.extractedData) {
        const unitId = `MH-MUM-BND-1245-08-F${String(target.extractedData.floorNumber).padStart(2, '0')}-U${target.extractedData.floorNumber}02`;
        setHighlightConflictId(unitId);
        showToast('3D Voxel Extruded', `Target voxel for Flat ${target.extractedData.flatNumber} highlighted in 3D Twin.`, 'success');
      } else {
        const unitId = target.id || target.unitId;
        setHighlightConflictId(unitId);
        setSelectedUnit(target);
        showToast('3D Spatial Target Locked', `Inspecting ${target.unitNumber || target.title} in 3D digital twin.`, 'info');
      }
    }
  };

  const handleExtrudeSuccess = (deed) => {
    showToast('3D-ULPIN Minted!', `Successfully minted ${deed.extractedData.generatedUlpin3D} under ISO 19152 standard.`, 'success');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Official Government & System Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        selectedParcel={selectedParcel}
        parcels={parcels}
        onSelectParcel={(p) => {
          setSelectedParcel(p);
          setSelectedUnit(null);
          setHighlightConflictId(null);
          showToast('Cadastre Parcel Changed', `Switched view to ${p.property_name} (${p.city}).`, 'info');
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        
        {/* Dynamic Tab Views */}
        {activeTab === 'digital-twin' && (
          <div className="space-y-4">
            <Cadastre3DViewer
              parcel={selectedParcel}
              selectedUnit={selectedUnit}
              onSelectUnit={setSelectedUnit}
              onNavigateToBanker={handleNavigateToBanker}
              onNavigateToDeed={handleNavigateToDeed}
              highlightConflictId={highlightConflictId}
            />
          </div>
        )}

        {activeTab === 'banker-portal' && (
          <BankerPortal 
            onNavigateTo3D={handleNavigateTo3D}
            activeParcel={selectedParcel}
          />
        )}

        {activeTab === 'document-ai' && (
          <DocumentAIStudio 
            onExtrudeSuccess={handleExtrudeSuccess}
            onNavigateTo3D={handleNavigateTo3D}
          />
        )}

        {activeTab === 'analytics' && (
          <RegistrarAnalytics />
        )}

      </main>

      {/* Toast Notification (Clean Light Theme) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`p-4 rounded-xl border shadow-lg text-xs flex items-center gap-3 ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
              : 'bg-blue-50 border-blue-300 text-blue-900'
          }`}>
            <div>
              <div className="font-bold">{toastMessage.title}</div>
              <div className="text-[11px] opacity-80 mt-0.5">{toastMessage.msg}</div>
            </div>
          </div>
        </div>
      )}

      {/* Architecture Specs Modal */}
      <ArchitectureModal 
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

    </div>
  );
}
