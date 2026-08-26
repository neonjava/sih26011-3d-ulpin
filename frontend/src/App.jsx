import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Cadastre3DViewer from './components/Cadastre3DViewer';
import BankerPortal from './components/BankerPortal';
import DocumentAIStudio from './components/DocumentAIStudio';
import RegistrarAnalytics from './components/RegistrarAnalytics';
import ArchitectureModal from './components/ArchitectureModal';
import { PARCELS } from './data/mockCadastreData';
import { 
  Building2, 
  ShieldAlert, 
  FileText, 
  BarChart3, 
  Sparkles, 
  CheckCircle2, 
  Boxes,
  MapPin,
  ExternalLink,
  ChevronRight,
  Zap,
  Globe
} from 'lucide-react';

export default function App() {
  const [parcels, setParcels] = useState(PARCELS);
  const [selectedParcel, setSelectedParcel] = useState(PARCELS[0]);
  const [activeTab, setActiveTab] = useState('digital-twin'); // 'digital-twin', 'banker-portal', 'document-ai', 'registrar-analytics'
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [highlightConflictId, setHighlightConflictId] = useState(null);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Auto clear toast
  const showToast = (title, msg, type = 'info') => {
    setToastMessage({ title, msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Cross-component navigations
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
        // From Document AI
        const unitId = `MH-MUM-BND-1245-08-F${String(target.extractedData.floorNumber).padStart(2, '0')}-U${target.extractedData.floorNumber}02`;
        setHighlightConflictId(unitId);
        showToast('3D Voxel Extruded', `Target voxel for ${target.extractedData.unitNumber} highlighted in 3D Twin.`, 'success');
      } else {
        // Direct unit or preset
        const unitId = target.id || target.unitId;
        setHighlightConflictId(unitId);
        setSelectedUnit(target);
        showToast('3D Spatial Target Locked', `Inspecting ${target.unitNumber || target.title} in 3D digital twin.`, 'info');
      }
    }
  };

  const handleExtrudeSuccess = (deed) => {
    showToast('3D-ULPIN Minted!', `Successfully minted ${deed.extractedData.ulpin3d} under ISO 19152 standard.`, 'success');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070A12] text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      
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
          showToast('Cadastre Parcel Changed', `Switched view to ${p.name} (${p.city}).`, 'info');
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* Dynamic Tab Views */}
        {activeTab === 'digital-twin' && (
          <div className="space-y-4 animate-fadeIn">
            <Cadastre3DViewer
              parcel={selectedParcel}
              selectedUnit={selectedUnit}
              onSelectUnit={(unit) => {
                setSelectedUnit(unit);
                if (unit && unit.hasConflict) {
                  setHighlightConflictId(unit.id);
                }
              }}
              onNavigateToBanker={handleNavigateToBanker}
              onNavigateToDeed={handleNavigateToDeed}
              highlightConflictId={highlightConflictId}
            />
          </div>
        )}

        {activeTab === 'banker-portal' && (
          <BankerPortal
            activeParcel={selectedParcel}
            onNavigateTo3D={handleNavigateTo3D}
          />
        )}

        {activeTab === 'document-ai' && (
          <DocumentAIStudio
            onExtrudeSuccess={handleExtrudeSuccess}
            onNavigateTo3D={handleNavigateTo3D}
          />
        )}

        {activeTab === 'registrar-analytics' && (
          <RegistrarAnalytics />
        )}
      </main>

      {/* Interactive Architecture & Math Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      {/* Floating Interactive Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl glass-panel-glow border border-blue-400/40 shadow-2xl flex items-start gap-3 max-w-md animate-float">
          <div className={`p-2 rounded-lg ${
            toastMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-cyan-400'
          }`}>
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <h5 className="font-bold text-white text-xs">{toastMessage.title}</h5>
            <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">{toastMessage.msg}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full bg-[#070A12] border-t border-slate-800/80 py-6 px-4 text-center text-xs text-slate-500 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
          <span className="font-semibold text-slate-300">SIH26011: 3D-ULPIN Generation & Vertical Property Mapping System</span>
          <span>•</span>
          <span>Ministry of Rural Development (MoRD)</span>
          <span>•</span>
          <span>Department of Land Resources (DoLR)</span>
          <span>•</span>
          <span className="text-cyan-400 font-mono">ISO 19152 LADM 3D Cadastre Standard</span>
        </div>
        <p className="text-[11px] text-slate-600">
          Developed for Smart India Hackathon 2026. Real-time 3D WebGL Digital Twin, AI Deed Extrusion & Anti-Fraud CERSAI Registry.
        </p>
      </footer>
    </div>
  );
}
