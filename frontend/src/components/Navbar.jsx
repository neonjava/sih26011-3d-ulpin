import React from 'react';
import { 
  Building2, 
  ShieldAlert, 
  FileText, 
  BarChart3, 
  Boxes, 
  Radio, 
  Layers, 
  ChevronDown,
  Info
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onOpenArchitecture, 
  selectedParcel, 
  parcels, 
  onSelectParcel 
}) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm transition-all">
      {/* Top official government bar */}
      <div className="w-full bg-slate-100 border-b border-slate-200 px-4 py-1.5 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Ministry of Rural Development (MoRD) • Department of Land Resources (DoLR)
          </div>
          <span className="hidden md:inline text-slate-300">|</span>
          <span className="hidden md:inline text-blue-700 font-medium font-mono text-[11px]">
            SIH26011: 3D-ULPIN Vertical Cadastre System
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5 font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SYSTEM ACTIVE (12ms)</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 font-mono text-slate-500">
            <span>Standard:</span>
            <span className="text-slate-800 font-semibold">ISO 19152 (3D-LADM)</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('digital-twin')}>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white shadow-sm">
              <Boxes className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900 tracking-tight">
                  3D-ULPIN
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-blue-50 text-blue-700 rounded border border-blue-200">
                  ISO 19152
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Vertical Property & Anti-Fraud Cadastre
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 gap-1">
            <button
              onClick={() => setActiveTab('digital-twin')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'digital-twin'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>3D Digital Twin</span>
            </button>

            <button
              onClick={() => setActiveTab('banker-portal')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                activeTab === 'banker-portal'
                  ? 'bg-white text-rose-600 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Banker Fraud Check (3D CERSAI)</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            </button>

            <button
              onClick={() => setActiveTab('document-ai')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'document-ai'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Document AI Extruder</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>SRO Analytics</span>
            </button>
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {/* Property Selector */}
            <div className="relative">
              <select
                value={selectedParcel?.ulpin_2d || ''}
                onChange={(e) => {
                  const p = parcels.find(x => x.ulpin_2d === e.target.value);
                  if (p) onSelectParcel(p);
                }}
                className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-medium rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
              >
                {parcels?.map((p) => (
                  <option key={p.ulpin_2d} value={p.ulpin_2d}>
                    📍 {p.city}: {p.property_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Architecture Specs Button */}
            <button
              onClick={onOpenArchitecture}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg shadow-sm transition-all"
              title="View ISO 19152 LADM System Specs"
            >
              <Info className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">ISO Specs</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile navigation row */}
      <div className="lg:hidden flex items-center justify-around bg-slate-50 border-t border-slate-200 px-2 py-1.5 text-[11px] overflow-x-auto">
        <button
          onClick={() => setActiveTab('digital-twin')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-semibold whitespace-nowrap ${
            activeTab === 'digital-twin' ? 'bg-blue-600 text-white' : 'text-slate-600'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>3D Twin</span>
        </button>
        <button
          onClick={() => setActiveTab('banker-portal')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-semibold whitespace-nowrap ${
            activeTab === 'banker-portal' ? 'bg-rose-600 text-white' : 'text-slate-600'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Fraud Check</span>
        </button>
        <button
          onClick={() => setActiveTab('document-ai')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-semibold whitespace-nowrap ${
            activeTab === 'document-ai' ? 'bg-blue-600 text-white' : 'text-slate-600'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Doc AI</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-semibold whitespace-nowrap ${
            activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'text-slate-600'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Analytics</span>
        </button>
      </div>
    </header>
  );
}
