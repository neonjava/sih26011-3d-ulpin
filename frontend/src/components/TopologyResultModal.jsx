import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  Copy,
  Check,
  Maximize2,
  Sparkles,
  Layers,
  Flame,
  RotateCcw
} from 'lucide-react';

export default function TopologyResultModal({
  isOpen,
  onClose,
  topologyResult,
  onHighlightConflicts,
  onClearConflicts,
  onSimulateConflict,
  buildingId = 'B001',
  violatingUlpins = []
}) {
  const [copiedKey, setCopiedKey] = useState(null);

  if (!isOpen || !topologyResult) return null;

  const isValid = topologyResult.valid;
  const overlaps = [
    ...(topologyResult.overlap_violations || []),
    ...(topologyResult.violations || []).map((v) => ({
      unit_a: v.ulpin1 || v.unit_a,
      unit_b: v.ulpin2 || v.unit_b,
      overlap_volume: v.overlap_volume,
      overlap_area: v.overlap_area,
      reason: v.reason,
      floor: v.floor
    }))
  ];
  const zViolations = topologyResult.z_violations || [];

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`p-5 text-white flex items-start justify-between ${
            isValid
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
              : 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md">
              {isValid ? (
                <ShieldCheck className="w-7 h-7 text-white" />
              ) : (
                <ShieldAlert className="w-7 h-7 text-white animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-white/20 rounded-full">
                  AI Spatial Engine • ISO 19152
                </span>
                <span className="text-xs font-semibold opacity-90">Building {buildingId}</span>
              </div>
              <h2 className="text-xl font-black mt-1">
                {isValid
                  ? 'Topology Validation: 100% Consistent'
                  : '⚠️ Critical Spatial Conflict Detected!'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          
          {/* Summary Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isValid
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            {isValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 leading-relaxed">
              <div className="font-bold text-sm">
                {isValid
                  ? 'Zero 3D Volumetric Overlaps Detected'
                  : `${overlaps.length} Volumetric Encroachment Clashes Found`}
              </div>
              <p className="opacity-90">
                {topologyResult.summary ||
                  (isValid
                    ? 'All unit voxels and floor boundaries adhere strictly to volumetric non-overlapping cadastre topology rules.'
                    : 'The spatial topology engine identified overlapping deed volumes and height envelope breaches.')}
              </p>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Spatial Status</div>
              <div
                className={`text-sm font-black mt-1 ${
                  isValid ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {isValid ? 'VERIFIED' : 'CLASH DETECTED'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">ISO 19152 Cadastre</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-500 font-bold uppercase">3D Overlaps</div>
              <div
                className={`text-sm font-black mt-1 ${
                  overlaps.length === 0 ? 'text-emerald-700' : 'text-rose-700 animate-pulse'
                }`}
              >
                {overlaps.length} Pairs
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Volumetric Collision</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Z-Envelope</div>
              <div
                className={`text-sm font-black mt-1 ${
                  zViolations.length === 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {zViolations.length} Breaches
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Municipal Height Cap</div>
            </div>
          </div>

          {/* Detailed Overlap List (When Invalid) */}
          {overlaps.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Violating 3D ULPIN Pairs</span>
                <span className="text-[10px] font-normal text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Volumetric Encroachment
                </span>
              </div>

              {overlaps.map((v, i) => (
                <div
                  key={i}
                  className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-rose-900 border-b border-rose-200/80 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-rose-600" />
                      <span>Conflict #{i + 1} {v.floor ? `(Floor ${v.floor})` : ''}</span>
                    </span>
                    <span className="font-mono text-[11px] bg-rose-100 px-2 py-0.5 rounded text-rose-800">
                      Overlap Volume: {v.overlap_volume ? `${v.overlap_volume.toFixed(2)} m³` : 'Clash'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Unit A */}
                    <div className="p-2.5 bg-white rounded-lg border border-rose-200 shadow-xs space-y-1">
                      <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center justify-between">
                        <span>Unit A (Deed 1)</span>
                        {v.unit_a && (
                          <button
                            onClick={() => handleCopy(v.unit_a, `a_${i}`)}
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-0.5 text-[10px]"
                          >
                            {copiedKey === `a_${i}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedKey === `a_${i}` ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                      </div>
                      <div className="font-mono text-[11px] font-bold text-slate-800 break-all select-all">
                        {v.unit_a || 'Unknown Unit'}
                      </div>
                    </div>

                    {/* Unit B */}
                    <div className="p-2.5 bg-white rounded-lg border border-rose-200 shadow-xs space-y-1">
                      <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center justify-between">
                        <span>Unit B (Deed 2)</span>
                        {v.unit_b && (
                          <button
                            onClick={() => handleCopy(v.unit_b, `b_${i}`)}
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-0.5 text-[10px]"
                          >
                            {copiedKey === `b_${i}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedKey === `b_${i}` ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                      </div>
                      <div className="font-mono text-[11px] font-bold text-slate-800 break-all select-all">
                        {v.unit_b || 'Envelope Boundary'}
                      </div>
                    </div>
                  </div>

                  {v.reason && (
                    <div className="text-[11px] text-rose-800 bg-rose-100/70 p-2 rounded-lg leading-relaxed">
                      <strong>AI Topology Reason:</strong> {v.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Z-Violations list if any */}
          {zViolations.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Height Envelope Breaches
              </div>
              {zViolations.map((z, i) => (
                <div
                  key={i}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs"
                >
                  <div className="font-mono font-bold text-[11px]">{z.unit || z.ulpin}</div>
                  <div className="text-[11px] mt-1">{z.error || z.reason}</div>
                </div>
              ))}
            </div>
          )}

          {/* Hackathon Judge Tip */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-950 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Hackathon Demo Note:</strong> The AI Spatial Validation engine executes 3D
              computational geometry algorithms (Shapely 2D polygon intersection $\times$ vertical
              $Z$-datum range checks) in real-time, preventing illegal double mortgages, phantom floors, and boundary
              overlaps before registration.
            </div>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {/* Simulate conflict button for judge presentation */}
            <button
              onClick={onSimulateConflict}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition"
              title="Demonstrate how the system handles an illegal double-sale / overlapping parcel clash"
            >
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span>Simulate Conflict (Judge Demo)</span>
            </button>

            {violatingUlpins.length > 0 && (
              <button
                onClick={onClearConflicts}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Highlights</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isValid && (
              <button
                onClick={() => {
                  onHighlightConflicts && onHighlightConflicts();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 transition active:scale-95"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Highlight in 3D Scene</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
