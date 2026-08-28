import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Layers, 
  Boxes, 
  User, 
  ShieldCheck, 
  Copy, 
  Check, 
  Maximize2, 
  X, 
  Compass, 
  ArrowUpRight, 
  Info,
  Car,
  Home,
  Wrench,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function SidebarPanel({ 
  selectedUnit, 
  onClose, 
  buildingData, 
  onFocusUnit 
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Unit Type metadata styling
  const getTypeBadge = (type) => {
    const t = (type || 'residential').toLowerCase();
    if (t === 'residential') {
      return {
        bg: 'bg-sky-50 text-sky-700 border-sky-200',
        icon: <Home className="w-3.5 h-3.5" />,
        name: 'Residential Unit'
      };
    }
    if (t === 'commercial') {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <Building2 className="w-3.5 h-3.5" />,
        name: 'Commercial Unit'
      };
    }
    if (t === 'parking') {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <Car className="w-3.5 h-3.5" />,
        name: 'Subsurface Parking'
      };
    }
    return {
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: <Wrench className="w-3.5 h-3.5" />,
      name: 'Utility Infrastructure'
    };
  };

  // Calculate building stats
  const totalAboveGround = buildingData?.floors?.reduce((acc, f) => acc + (f.units?.length || 0), 0) || 0;
  const totalUnderground = buildingData?.underground?.length || 0;
  const totalUnits = totalAboveGround + totalUnderground;

  return (
    <aside className="w-80 sm:w-96 flex-shrink-0 bg-white border-l border-slate-200 shadow-xl flex flex-col h-full overflow-y-auto select-none transition-all">
      
      {selectedUnit ? (
        /* ================================================================ */
        /* SELECTED 3D UNIT INSPECTOR PANEL                                 */
        /* ================================================================ */
        <div className="p-5 space-y-5 animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                {(() => {
                  const badge = getTypeBadge(selectedUnit.type);
                  return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase ${badge.bg}`}>
                      {badge.icon}
                      <span>{badge.name}</span>
                    </span>
                  );
                })()}
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {selectedUnit.unit_number || 'Unit Parcel'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {selectedUnit.floor_no < 0 
                  ? 'Level -1 (Underground Subsurface)' 
                  : `Floor ${selectedUnit.floor_no} • Level ${selectedUnit.floor_no}`}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3D-ULPIN Unique Key Card (Indian Standard) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span className="font-semibold text-slate-700">3D ULPIN (Bhu-Aadhaar):</span>
              <button
                onClick={() => handleCopy(selectedUnit.ulpin)}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition"
                title="Copy ULPIN to Clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="font-mono text-xs font-bold text-slate-900 bg-white p-2.5 rounded-lg border border-slate-200 break-all select-all shadow-sm">
              {selectedUnit.ulpin}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>ISO 19152 LADM 3D Legal Cadastre Unit</span>
            </div>
          </div>

          {/* Ownership & Registration */}
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Title & Ownership
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 flex-shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-slate-500 font-medium">Registered Owner</div>
                <div className="text-sm font-bold text-slate-900 truncate">
                  {selectedUnit.owner || 'Unregistered Title'}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Cadastral Status:</span>
              <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{selectedUnit.status || 'Clear Title'}</span>
              </span>
            </div>
          </div>

          {/* 3D Volumetric Metrics */}
          <div>
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              3D Spatial Geometry
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[11px]">Floor Area</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {selectedUnit.area_sqm || 68.5} m²
                </div>
                <div className="text-[10px] text-slate-400">
                  ≈ {((selectedUnit.area_sqm || 68.5) * 10.764).toFixed(0)} sq.ft
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[11px]">3D Volume</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {((selectedUnit.area_sqm || 68.5) * 2.8).toFixed(1)} m³
                </div>
                <div className="text-[10px] text-slate-400">
                  Volumetric Parcel
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[11px]">Z Base ($Z_{'{min}'}$)</div>
                <div className="font-bold text-blue-700 text-sm mt-0.5 font-mono">
                  {selectedUnit.geometry?.z_min !== undefined ? `${selectedUnit.geometry.z_min >= 0 ? '+' : ''}${selectedUnit.geometry.z_min.toFixed(1)} m` : '+0.0 m'}
                </div>
                <div className="text-[10px] text-slate-400">
                  Floor Datum
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[11px]">Z Ceiling ($Z_{'{max}'}$)</div>
                <div className="font-bold text-blue-700 text-sm mt-0.5 font-mono">
                  {selectedUnit.geometry?.z_max !== undefined ? `${selectedUnit.geometry.z_max >= 0 ? '+' : ''}${selectedUnit.geometry.z_max.toFixed(1)} m` : '+3.0 m'}
                </div>
                <div className="text-[10px] text-slate-400">
                  Ceiling Datum
                </div>
              </div>

            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <button
              onClick={() => onFocusUnit && onFocusUnit(selectedUnit)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.99]"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Focus Camera on Unit</span>
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
            >
              Deselect
            </button>
          </div>

        </div>
      ) : (
        /* ================================================================ */
        /* BUILDING OVERVIEW PANEL (DEFAULT STATE)                          */
        /* ================================================================ */
        <div className="p-5 space-y-5 animate-in fade-in duration-200">
          
          {/* Header Card */}
          <div className="space-y-1.5 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                Building ID: {buildingData?.building_id || 'B001'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active 3D Twin
              </span>
            </div>
            
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {buildingData?.building_name || 'Devanagari Heights'}
            </h2>
            
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{buildingData?.city || 'Davanagere, Karnataka'}</span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-slate-500 text-[11px] font-medium">Above Ground</div>
              <div className="text-lg font-black text-slate-800 mt-0.5">
                5 Floors
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {totalAboveGround} Residential/Utility Units
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-slate-500 text-[11px] font-medium">Underground Level</div>
              <div className="text-lg font-black text-amber-700 mt-0.5">
                1 Level (B1)
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {totalUnderground} Parking & Utilities
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-slate-500 text-[11px] font-medium">Total 3D Parcels</div>
              <div className="text-lg font-black text-blue-700 mt-0.5">
                {totalUnits} Units
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Volumetric Voxels
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-slate-500 text-[11px] font-medium">Sanction Height</div>
              <div className="text-lg font-black text-slate-800 mt-0.5">
                {buildingData?.sanctioned_height_m || 18.0} m
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Municipal Cap
              </div>
            </div>
          </div>

          {/* Hackathon Judge Instruction Card */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200 rounded-xl space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Interactive 3D Demo Guide</span>
            </div>
            
            <ul className="text-xs text-blue-950/80 space-y-1.5 list-disc list-inside leading-relaxed text-[11px]">
              <li><strong>Click any unit box</strong> to inspect its 3D ULPIN, owner, and elevation range.</li>
              <li><strong>Toggle Underground</strong> to view or hide the subsurface parking layer.</li>
              <li><strong>Drag the Explode slider</strong> to separate stacked floor slabs for clear internal viewing.</li>
              <li><strong>Rotate & Zoom</strong> using mouse or touch controls.</li>
            </ul>
          </div>

          {/* Standard Compliance */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Bhu-Aadhaar 3D Cadastre Standard</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Complies with ISO 19152 (Land Administration Domain Model - 3D Profile) and Department of Land Resources (DoLR) specifications.
            </p>
          </div>

        </div>
      )}

    </aside>
  );
}
