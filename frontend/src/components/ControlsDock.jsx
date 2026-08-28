import React from 'react';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Camera, 
  Search, 
  Home, 
  Car, 
  Wrench, 
  Sliders,
  Compass,
  Maximize2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Flame,
  AlertTriangle
} from 'lucide-react';
import { UNIT_COLORS } from './Building3DScene';

export default function ControlsDock({
  showUnderground,
  onToggleUnderground,
  explosionFactor,
  onChangeExplosion,
  filterType,
  onSelectFilter,
  searchQuery,
  onSearchChange,
  onTriggerCamera,
  unitCounts = {},
  onRunTopologyCheck,
  isValidatingTopology = false,
  violatingUlpins = [],
  onOpenTopologyModal
}) {
  return (
    <>
      {/* ================================================================== */}
      {/* 1. TOP-LEFT: SEARCH & QUICK FILTER BAR                             */}
      {/* ================================================================== */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-sm w-full">
        {/* Search Input */}
        <div className="relative w-full bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-md transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ULPIN, Owner, Unit #..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 pl-9 pr-8 py-2.5 rounded-xl outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1 py-0.5 rounded"
            >
              ✕
            </button>
          )}
        </div>

        {/* Unit Type Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-md text-xs">
          <button
            onClick={() => onSelectFilter('ALL')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition ${
              filterType === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All {unitCounts.total ? `(${unitCounts.total})` : ''}
          </button>

          <button
            onClick={() => onSelectFilter('RESIDENTIAL')}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg font-semibold transition ${
              filterType === 'RESIDENTIAL'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Home className="w-3 h-3 text-sky-500" />
            <span>Residential {unitCounts.residential ? `(${unitCounts.residential})` : ''}</span>
          </button>

          <button
            onClick={() => onSelectFilter('PARKING')}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg font-semibold transition ${
              filterType === 'PARKING'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Car className="w-3 h-3 text-amber-500" />
            <span>Parking {unitCounts.parking ? `(${unitCounts.parking})` : ''}</span>
          </button>

          <button
            onClick={() => onSelectFilter('UTILITY')}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg font-semibold transition ${
              filterType === 'UTILITY'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Wrench className="w-3 h-3 text-purple-500" />
            <span>Utility {unitCounts.utility ? `(${unitCounts.utility})` : ''}</span>
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. TOP-RIGHT: 3D CADASTRE LEGEND & AI TOPOLOGY BADGE                */}
      {/* ================================================================== */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
        
        {/* Topology Status Alert Badge (if conflicts active) */}
        {violatingUlpins.length > 0 && (
          <button
            onClick={onOpenTopologyModal}
            className="flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white shadow-lg rounded-xl text-xs font-bold animate-bounce transition border border-rose-500"
          >
            <AlertTriangle className="w-4 h-4 text-white" />
            <span>{violatingUlpins.length} Conflicted ULPINs (Click to View)</span>
          </button>
        )}

        <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-md rounded-xl p-3 text-xs text-slate-700 space-y-1.5 min-w-[175px]">
          <div className="text-[11px] font-bold text-slate-800 border-b border-slate-100 pb-1 flex items-center justify-between">
            <span>3D Cadastre Legend</span>
            <span className="text-[9px] text-slate-400 font-mono">ISO 19152</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-sky-500 border border-sky-600 shadow-xs"></span>
            <span className="text-slate-700 font-medium">Residential Units</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-500 border border-amber-600 shadow-xs"></span>
            <span className="text-slate-700 font-medium">Subsurface Parking</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-purple-500 border border-purple-600 shadow-xs"></span>
            <span className="text-slate-700 font-medium">Utility Infrastructure</span>
          </div>

          {violatingUlpins.length > 0 && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
              <span className="w-3 h-3 rounded bg-rose-600 border border-rose-700 shadow-xs animate-pulse"></span>
              <span className="text-rose-600 font-bold">Spatial Clash (Red Glow)</span>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. BOTTOM-CENTER: INTERACTIVE CONTROLS DOCK                        */}
      {/* ================================================================== */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 w-11/12 max-w-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-3.5 space-y-2.5 transition-all">
        
        {/* Row 1: Exploded View Slider, Underground Toggle & AI Topology Check Button */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Exploded Floor Slider */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 whitespace-nowrap">
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Exploded View:</span>
              <span className="sm:hidden">Explode:</span>
              <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px] border border-blue-200">
                {explosionFactor.toFixed(1)}x
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="2.0"
              step="0.1"
              value={explosionFactor}
              onChange={(e) => onChangeExplosion(parseFloat(e.target.value))}
              className="flex-1 cursor-pointer accent-blue-600"
              title="Drag to separate stacked floors vertically"
            />

            <button
              onClick={() => onChangeExplosion(explosionFactor > 0 ? 0 : 1.2)}
              className="px-2 py-1 text-[10px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              {explosionFactor > 0 ? 'Collapse' : 'Explode'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Underground Layer Button */}
            <button
              onClick={onToggleUnderground}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                showUnderground
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
              title="Toggle Subsurface Underground Parking Layer"
            >
              {showUnderground ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showUnderground ? 'B1 Level' : 'B1 Hidden'}</span>
            </button>

            {/* AI Topology Check Button (Requirement 2) */}
            <button
              onClick={onRunTopologyCheck}
              disabled={isValidatingTopology}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition active:scale-95 ${
                violatingUlpins.length > 0
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25'
              } ${isValidatingTopology ? 'opacity-80 cursor-wait' : ''}`}
              title="Run AI 3D Computational Geometry & Overlap Validation"
            >
              {isValidatingTopology ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : violatingUlpins.length > 0 ? (
                <ShieldAlert className="w-3.5 h-3.5" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>
                {isValidatingTopology
                  ? 'Validating 3D...'
                  : violatingUlpins.length > 0
                  ? 'Topology Clash!'
                  : 'Run Topology Check'}
              </span>
            </button>
          </div>

        </div>

        {/* Row 2: Camera Presets & Navigation Quick Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">Camera:</span>
            
            <button
              onClick={() => onTriggerCamera({ mode: 'RESET' })}
              className="flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition"
              title="Reset 3D Orbit Camera"
            >
              <RotateCcw className="w-3 h-3" />
              <span>3D Orbit</span>
            </button>

            <button
              onClick={() => onTriggerCamera({ mode: 'FRONT' })}
              className="flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition"
              title="Front Elevation View"
            >
              <Camera className="w-3 h-3" />
              <span>Front</span>
            </button>

            <button
              onClick={() => onTriggerCamera({ mode: 'TOP' })}
              className="flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition"
              title="Top 2D Plan View"
            >
              <Compass className="w-3 h-3" />
              <span>Top 2D</span>
            </button>

            <button
              onClick={() => onTriggerCamera({ mode: 'SIDE' })}
              className="flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition"
              title="Side Elevation View"
            >
              <span>Side</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden md:block">
            <span>Left-click: Rotate • Right-click: Pan • Scroll: Zoom</span>
          </div>

        </div>

      </div>
    </>
  );
}
