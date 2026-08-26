import React from 'react';
import { 
  Building2, 
  ShieldAlert, 
  FileText, 
  BarChart3, 
  Cpu, 
  Boxes, 
  CheckCircle2, 
  Radio, 
  Layers, 
  Compass, 
  ExternalLink,
  ChevronDown,
  Sparkles
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
    <header className="sticky top-0 z-50 w-full border-b border-blue-500/20 bg-[#0B0F19]/90 backdrop-blur-xl transition-all">
      {/* Top micro-bar: Government of India & DoLR Official Bar */}
      <div className="w-full bg-[#070A12]/95 border-b border-white/5 px-4 py-1 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium tracking-wider text-slate-300 uppercase">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Ministry of Rural Development (MoRD) • Department of Land Resources (DoLR)
          </div>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline text-blue-400/90 font-mono">
            SIH26011: 3D-ULPIN Vertical Cadastre System
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
            <Radio className="w-3 h-3 animate-spin text-emerald-400" />
            <span>MESH STREAM: LIVE (12ms)</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-slate-400">
            <span>CRS:</span>
            <span className="text-blue-300 font-semibold">EPSG:7760 (3D-LADM)</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => setActiveTab('digital-twin')}>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative flex items-center justify-center w-11 h-11 rounded-lg bg-[#0E1626] border border-blue-400/40 text-blue-400 shadow-neon-blue">
                <Boxes className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-100 to-cyan-400 bg-clip-text text-transparent">
                  3D-ULPIN
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold font-mono tracking-wide bg-blue-500/20 text-blue-300 rounded border border-blue-400/30">
                  v3.4-ISO19152
                </span>
              </div>
              <p className="text-[11px] text-slate-400 tracking-wide font-medium flex items-center gap-1">
                <span>Vertical Property & Anti-Fraud Cadastre</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
            <button
              onClick={() => setActiveTab('digital-twin')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === 'digital-twin'
                  ? 'bg-blue-600 text-white shadow-neon-blue'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>3D Digital Twin</span>
            </button>

            <button
              onClick={() => setActiveTab('banker-portal')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 relative ${
                activeTab === 'banker-portal'
                  ? 'bg-rose-600 text-white shadow-neon-red'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Banker Fraud Check (3D CERSAI)</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('document-ai')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === 'document-ai'
                  ? 'bg-cyan-600 text-white shadow-neon-cyan'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Document AI Extruder</span>
            </button>

            <button
              onClick={() => setActiveTab('registrar-analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === 'registrar-analytics'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>SRO Analytics</span>
            </button>
          </nav>

          {/* Right Actions & Architecture Modal Trigger */}
          <div className="flex items-center gap-2.5">
            {/* Parcel Quick Selector */}
            <div className="relative">
              <select
                value={selectedParcel?.id || ''}
                onChange={(e) => {
                  const p = parcels.find(item => item.id === e.target.value);
                  if (p) onSelectParcel(p);
                }}
                className="appearance-none bg-slate-900/90 text-slate-200 text-xs font-medium pl-3 pr-8 py-2 rounded-lg border border-slate-700 hover:border-blue-500/50 focus:outline-none focus:border-blue-500 transition cursor-pointer"
              >
                {parcels.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    📍 {p.city}: {p.name.slice(0, 22)}...
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Architecture Modal Button */}
            <button
              onClick={onOpenArchitecture}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-900/60 to-purple-900/60 hover:from-blue-800/80 hover:to-purple-800/80 text-blue-200 border border-blue-500/30 hover:border-blue-400 shadow-sm transition"
              title="View ISO 19152 LADM 3D Cadastre Architecture"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">ISO 19152 Specs</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="lg:hidden flex items-center justify-between overflow-x-auto py-2 border-t border-slate-800/80 gap-2 no-scrollbar">
          <button
            onClick={() => setActiveTab('digital-twin')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'digital-twin' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Digital Twin</span>
          </button>
          <button
            onClick={() => setActiveTab('banker-portal')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'banker-portal' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Banker 3D CERSAI</span>
          </button>
          <button
            onClick={() => setActiveTab('document-ai')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'document-ai' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Document AI</span>
          </button>
          <button
            onClick={() => setActiveTab('registrar-analytics')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'registrar-analytics' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>SRO Analytics</span>
          </button>
        </div>
      </div>
    </header>
  );
}
