import React from 'react';
import { 
  X, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Boxes, 
  Code, 
  CheckCircle2, 
  ExternalLink,
  BookOpen,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl glass-panel-glow border border-blue-500/40 p-6 sm:p-8 shadow-2xl text-slate-100 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-cyan-400">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase">
                  ISO 19152 LADM 3D Profile
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs font-mono">SIH26011 Technical Blueprint</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                3D-ULPIN System Architecture & Spatial Mathematics
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Section 1: ISO 19152 LADM Object Model */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-blue-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>1. ISO 19152:2012 Land Administration Domain Model (LADM)</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Our system models vertical properties by extending the ISO 19152 international standard into a multi-tiered 3D cadastral graph connecting parties, rights, and volumetric spatial units:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="font-mono text-cyan-400 font-bold block mb-1">LA_SpatialUnit</span>
              <p className="text-slate-400 text-[11px]">
                Base 2D cadastre parcel bounding polygon registered with State Land Revenue Authorities.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-blue-500/30">
              <span className="font-mono text-blue-300 font-bold block mb-1">LA_LegalSpaceBuildingUnit</span>
              <p className="text-slate-400 text-[11px]">
                3D Volumetric prism voxel $[X, Y, Z_{min}, Z_{max}]$ assigned to apartments, offices, and parking bays.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="font-mono text-purple-400 font-bold block mb-1">LA_BoundaryFaceString</span>
              <p className="text-slate-400 text-[11px]">
                Vertical wall polygons and horizontal floor/ceiling slabs separating adjacent spatial units.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="font-mono text-emerald-400 font-bold block mb-1">LA_BAUnit & LA_RRR</span>
              <p className="text-slate-400 text-[11px]">
                Rights, Restrictions, and Responsibilities (e.g. CERSAI mortgage lien, municipal FSI cap, air-rights).
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: 3D-ULPIN 24-Character Volumetric Syntax */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <h3 className="text-sm font-extrabold text-blue-300 uppercase tracking-wider flex items-center gap-2">
            <Code className="w-4 h-4 text-cyan-400" />
            <span>2. 3D-ULPIN 24-Character Volumetric Syntax Breakdown</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            While legacy 2D ULPIN identifies only ground parcels, the 3D-ULPIN standard incorporates vertical floor, unit, and elevation interval coordinates in decimeters:
          </p>

          {/* Syntax Interactive Pills Display */}
          <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/30 overflow-x-auto">
            <div className="flex items-center gap-1 font-mono text-xs font-bold whitespace-nowrap">
              <span className="p-2 rounded bg-blue-900/40 text-blue-300 border border-blue-500/40">MH</span>
              <span className="text-slate-600">-</span>
              <span className="p-2 rounded bg-indigo-900/40 text-indigo-300 border border-indigo-500/40">27</span>
              <span className="text-slate-600">-</span>
              <span className="p-2 rounded bg-purple-900/40 text-purple-300 border border-purple-500/40">04</span>
              <span className="text-slate-600">-</span>
              <span className="p-2 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-500/40">1245</span>
              <span className="text-slate-600">-</span>
              <span className="p-2 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-500/40">08</span>
              <span className="text-slate-600">-</span>
              <span className="p-2 rounded bg-amber-900/40 text-amber-300 border border-amber-500/40">F04</span>
              <span className="text-slate-600">-</span>
              <span className="p-2 rounded bg-rose-900/40 text-rose-300 border border-rose-500/40">U402</span>
              <span className="text-slate-600">-</span>
              <span className="p-2 rounded bg-teal-900/40 text-teal-300 border border-teal-500/40">Z012015</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-[10px] font-mono text-slate-300">
              <div><span className="text-blue-400 font-bold">MH:</span> State (Maharashtra)</div>
              <div><span className="text-indigo-400 font-bold">27:</span> District (Mumbai Sub)</div>
              <div><span className="text-purple-400 font-bold">04:</span> SRO Office (Bandra-4)</div>
              <div><span className="text-cyan-400 font-bold">1245:</span> Base Survey CTS No.</div>
              <div><span className="text-emerald-400 font-bold">08:</span> Parcel Sub-division</div>
              <div><span className="text-amber-400 font-bold">F04:</span> Vertical Floor No. 4</div>
              <div><span className="text-rose-400 font-bold">U402:</span> Unit Designation 402</div>
              <div><span className="text-teal-400 font-bold">Z012015:</span> Z_min=12.0m, Z_max=15.0m</div>
            </div>
          </div>
        </div>

        {/* Section 3: Mathematical Extrusion & Octree Collision Math */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <h3 className="text-sm font-extrabold text-blue-300 uppercase tracking-wider flex items-center gap-2">
            <Boxes className="w-4 h-4 text-cyan-400" />
            <span>3. Mathematical Extrusion & Octree Collision Detection</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="font-bold text-white block">Volumetric Extrusion Integral:</span>
              <div className="p-2.5 rounded bg-slate-950 font-mono text-cyan-300 text-[11px] border border-white/5">
                V = ∫[Z_min to Z_max] ∬_Ω dx dy dz = Area(2D) × (Z_max - Z_min)
              </div>
              <p className="text-slate-400 text-[11px]">
                Converts 2D legal deed boundary coordinates into a 3D Polyhedral Prism bounded by Floor Slab and Ceiling elevations.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="font-bold text-white block">3D Overlap & Fraud Condition:</span>
              <div className="p-2.5 rounded bg-slate-950 font-mono text-rose-300 text-[11px] border border-white/5">
                Overlap(V_A, V_B) = (V_A ∩ V_B) &gt; 0 ⟹ FRAUD_FLAG
              </div>
              <p className="text-slate-400 text-[11px]">
                When two distinct loan encumbrances or registrations intersect spatially above a 0.001 m³ tolerance, the system automatically rejects transaction.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: System Integration Pipeline Flow */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 to-slate-900/60 border border-blue-500/20 text-xs">
          <div className="flex items-center gap-2 font-bold text-white mb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>End-to-End Pan-India Cadastre Pipeline</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-slate-300 text-[11px] font-mono">
            <span className="p-1.5 rounded bg-slate-800 border border-slate-700">Deed PDF / Blueprint</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
            <span className="p-1.5 rounded bg-slate-800 border border-slate-700">AI Vision Transformer</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
            <span className="p-1.5 rounded bg-slate-800 border border-slate-700">Z-Axis Extrusion Engine</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
            <span className="p-1.5 rounded bg-slate-800 border border-slate-700">3D-ULPIN Minting</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
            <span className="p-1.5 rounded bg-blue-600/30 text-cyan-300 border border-blue-400/40">Banker 3D CERSAI</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-neon-blue transition"
          >
            Close Architectural Specifications
          </button>
        </div>
      </div>
    </div>
  );
}
