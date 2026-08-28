import React from 'react';
import { 
  Boxes, 
  Building2, 
  MapPin, 
  ShieldCheck, 
  ChevronDown, 
  Info, 
  RotateCcw,
  Sparkles,
  Database,
  Code2,
  Radio,
  Layers,
  Zap,
  Compass
} from 'lucide-react';
import { USE_MOCK_DATA, API_BASE_URL } from '../services/api';

export default function Navbar({
  selectedBuildingId,
  onSelectBuilding,
  availableBuildings = [],
  onResetView,
  onOpenSpecsModal,
  onSimulateDroneScan,
  isDroneScanning,
  viewMode = '3D',
  onChangeViewMode
}) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-xs select-none">
      
      {/* Official Government & Hackathon Meta Bar */}
      <div className="w-full bg-slate-100 border-b border-slate-200 px-4 py-1 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Department of Land Resources (DoLR) • 3D Bhu-Aadhaar Cadastre</span>
          </div>
          <span className="hidden md:inline text-slate-300">|</span>
          <span className="hidden md:inline text-blue-700 font-mono text-[11px]">
            Hackathon Demo • 3D-ULPIN System
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          {/* Mock vs Real API Indicator Badge */}
          <div 
            className={`flex items-center gap-1.5 font-mono px-2 py-0.5 rounded border font-semibold ${
              USE_MOCK_DATA 
                ? 'bg-amber-50 text-amber-800 border-amber-300' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}
            title={USE_MOCK_DATA ? 'Running against local mock data contract.' : `Connected to API: ${API_BASE_URL}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${USE_MOCK_DATA ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            <span>{USE_MOCK_DATA ? 'MOCK DATA (Toggle in api.js)' : 'LIVE API: localhost:8000'}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 font-mono text-slate-500">
            <span>Standard:</span>
            <span className="text-slate-800 font-semibold">ISO 19152 (3D-LADM)</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 text-white shadow-md shadow-blue-500/20">
              <Boxes className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900 tracking-tight">
                  3D-ULPIN
                </span>
                <span className="px-2 py-0.2 text-[10px] font-extrabold font-mono bg-blue-50 text-blue-700 rounded border border-blue-200">
                  AI Drone Cadastre
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Unique Land Parcel Identification Number • 3D Vertical Cadastre
              </p>
            </div>
          </div>

          {/* Center: 2D Legacy vs 3D ULPIN View Mode Toggle Pill */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-inner">
            <button
              onClick={() => onChangeViewMode && onChangeViewMode('2D')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === '2D'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="View 2D Legacy Cadastral Footprint"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>2D Legacy View</span>
            </button>

            <button
              onClick={() => onChangeViewMode && onChangeViewMode('3D')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === '3D'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="View Full 3D Volumetric ULPIN Twin"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3D ULPIN View</span>
            </button>
          </div>

          {/* Center/Right Action Area */}
          <div className="flex items-center gap-2">
            
            {/* Prominent "Simulate AI Drone Mapping" Button (Brain Agent Phase 3 Req) */}
            <button
              onClick={onSimulateDroneScan}
              disabled={isDroneScanning}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold text-white shadow-md transition active:scale-95 ${
                isDroneScanning
                  ? 'bg-slate-400 cursor-wait'
                  : 'bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 shadow-cyan-500/25 ring-1 ring-cyan-400/40 animate-pulse'
              }`}
              title="Simulate AI Drone LiDAR Scanning & Multi-Floor 3D Extrusion"
            >
              <Radio className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Simulate AI Drone Mapping</span>
              <span className="sm:hidden">Drone Scan</span>
            </button>

            {/* Building Selection Dropdown */}
            <div className="relative hidden md:block">
              <select
                value={selectedBuildingId}
                onChange={(e) => onSelectBuilding(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition shadow-xs"
              >
                {availableBuildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    🏢 {b.name} ({b.city})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Reset Camera Button */}
            <button
              onClick={onResetView}
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl shadow-xs transition"
              title="Reset 3D Camera to Default Orbit View"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden lg:inline">Reset View</span>
            </button>

            {/* Specs / Info Modal Button */}
            {onOpenSpecsModal && (
              <button
                onClick={onOpenSpecsModal}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl shadow-xs transition"
                title="View JSON Contract & API Swap Guide"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">API Contract</span>
              </button>
            )}

          </div>

        </div>
      </div>

    </header>
  );
}
