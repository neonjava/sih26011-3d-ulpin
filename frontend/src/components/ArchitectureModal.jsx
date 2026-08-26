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
  BookOpen
} from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl text-slate-900 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                  ISO 19152 LADM 3D Profile
                </span>
                <span className="text-slate-300 text-xs">•</span>
                <span className="text-slate-500 text-xs font-mono">SIH26011 Technical Blueprint</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                3D-ULPIN System Architecture & Spatial Mathematics
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Section 1: ISO 19152 LADM Object Model */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-blue-700 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>1. ISO 19152:2012 Land Administration Domain Model (LADM)</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Our system models vertical properties by extending the ISO 19152 international standard into a multi-tiered 3D cadastral graph connecting parties, rights, and volumetric spatial units:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-mono text-blue-700 font-bold block mb-1">LA_SpatialUnit</span>
              <p className="text-slate-600 text-[11px]">
                Base 2D cadastre parcel bounding polygon registered with State Land Revenue Authorities.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <span className="font-mono text-blue-900 font-bold block mb-1">LA_LegalSpaceBuildingUnit</span>
              <p className="text-slate-700 text-[11px]">
                3D Volumetric prism voxel $[X, Y, Z_{min}, Z_{max}]$ assigned to apartments, offices, and parking bays.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-mono text-purple-700 font-bold block mb-1">LA_BoundaryFaceString</span>
              <p className="text-slate-600 text-[11px]">
                Vertical wall polygons and horizontal floor/ceiling slabs separating adjacent spatial units.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-mono text-emerald-700 font-bold block mb-1">LA_RRR</span>
              <p className="text-slate-600 text-[11px]">
                Rights, Restrictions & Responsibilities recording CERSAI mortgage liens and municipal caps.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: 3D-ULPIN String Specification */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-blue-700 uppercase tracking-wider flex items-center gap-2">
            <Boxes className="w-4 h-4 text-blue-600" />
            <span>2. Standardized 3D-ULPIN (Bhu-Aadhaar) Syntax</span>
          </h3>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono">
            <div className="text-slate-500 mb-2 font-sans font-semibold">Standard Codec Format:</div>
            <div className="text-sm font-bold text-slate-900 bg-white p-2.5 rounded border border-slate-200 overflow-x-auto">
              &#123;STATE_CODE&#125;&#123;DIST_CODE&#125;&#123;2D_PIN&#125;-&#123;TYPE&#125;-&#123;WING&#125;-&#123;FLOOR_Z&#125;-&#123;UNIT_ID&#125;-&#123;VOLUMETRIC_HASH&#125;
            </div>
            <div className="mt-3 text-slate-600 text-[11px] font-sans space-y-1">
              <div>• <strong>MH27-045-8912345</strong>: 14-digit state cadastral land base PIN (Maharashtra, Mumbai Suburban)</div>
              <div>• <strong>APT / BSMT / AIR / UTL</strong>: Spatial classification code</div>
              <div>• <strong>F04 / B02</strong>: Floor index level (Positive floors vs subterranean basements)</div>
              <div>• <strong>U402</strong>: Individual apartment unit identifier</div>
              <div>• <strong>D4A9</strong>: Deterministic 4-character SHA-256 slice derived from 3D bounding coordinates</div>
            </div>
          </div>
        </div>

        {/* Section 3: Mathematical Formulation */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-blue-700 uppercase tracking-wider flex items-center gap-2">
            <Code className="w-4 h-4 text-blue-600" />
            <span>3. Volumetric Extrusion & Boolean Intersection Formulation</span>
          </h3>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
            <div>
              <span className="font-bold text-slate-900 block mb-1">A. Minkowski Prism Vertical Extrusion:</span>
              <p className="text-slate-600 font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
                V_unit = P_2D x [Z_ground + H_plinth + (Floor - 1) * H_slab, Z_ground + H_plinth + Floor * H_slab]
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-900 block mb-1">B. Volumetric Clash Condition (ST_3DIntersects):</span>
              <p className="text-slate-600 font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
                Overlap(V_A, V_B) = Volume(V_A ∩ V_B) &gt; 0  ===&gt;  FLAGGED: CRITICAL_MORTGAGE_COLLISION
              </p>
            </div>
          </div>
        </div>

        {/* Close Footer */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition"
          >
            Close Documentation
          </button>
        </div>

      </div>
    </div>
  );
}
