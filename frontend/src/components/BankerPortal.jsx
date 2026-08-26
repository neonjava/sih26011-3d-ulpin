import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Boxes, 
  Building2, 
  FileText, 
  Search, 
  Sparkles, 
  ArrowRight, 
  Download, 
  Scale, 
  ExternalLink,
  Layers,
  Banknote,
  Clock,
  ChevronRight
} from 'lucide-react';
import { DEMO_PRESETS, PARCELS } from '../data/mockCadastreData';
import { verifyLoan } from '../services/api';
import LoanCertificateModal from './LoanCertificateModal';

export default function BankerPortal({ onNavigateTo3D, activeParcel }) {
  const [selectedPresetId, setSelectedPresetId] = useState(DEMO_PRESETS[0].id);
  const [bankName, setBankName] = useState('HDFC Bank Ltd');
  const [applicantName, setApplicantName] = useState('Vikramaditya Sharma');
  const [loanAmount, setLoanAmount] = useState('₹ 1,85,00,000');
  const [loanType, setLoanType] = useState('Home Loan Refinancing');
  const [selectedParcelId, setSelectedParcelId] = useState(PARCELS[0].id);
  const [selectedUnitId, setSelectedUnitId] = useState('MH-MUM-BND-1245-08-F04-U402');

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Active parcel & units list
  const currentParcel = PARCELS.find(p => p.id === selectedParcelId) || PARCELS[0];
  const allUnitsInParcel = currentParcel.floors.flatMap(f => f.units);

  // Apply a preset
  const handleApplyPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setSelectedParcelId(preset.parcelId);
    setSelectedUnitId(preset.unitId);
    setApplicantName(preset.applicantName);
    setBankName(preset.bankName);
    setLoanAmount(preset.loanAmount);
    setLoanType(preset.loanType);
    setVerificationResult(null);
  };

  // Run the Live 3D Cadastre & CERSAI Check
  const handleRunVerification = async () => {
    setIsVerifying(true);
    setVerificationResult(null);

    const payload = {
      parcelId: selectedParcelId,
      unitId: selectedUnitId,
      bankName,
      applicantName,
      loanAmount,
      loanType
    };

    try {
      const result = await verifyLoan(payload);
      setTimeout(() => {
        setVerificationResult(result);
        setIsVerifying(false);
      }, 700); // realistic spatial processing pause
    } catch (err) {
      console.error(err);
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-blue-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                Next-Gen 3D CERSAI Anti-Fraud Engine
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-blue-400 font-mono text-xs">Section 26D SARFAESI Compliant</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              3D Volumetric Mortgage & Title Verification
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Eliminate double mortgages and phantom floor fraud across Indian banking. Query the real-time ISO 19152 3D Cadastre registry to detect spatial overlaps in vertical space before disbursing loans.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/90 p-3 rounded-xl border border-slate-800 self-start md:self-auto">
            <Scale className="w-6 h-6 text-cyan-400 flex-shrink-0" />
            <div className="text-left font-mono">
              <span className="text-[10px] text-slate-400 block">Bank Failure Rate</span>
              <span className="text-xs font-extrabold text-emerald-400">0.00% (3D Guarded)</span>
            </div>
          </div>
        </div>

        {/* Demo Fraud Scenarios Presets Bar */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              1-Click Demo Fraud Scenarios (Instant Jury Verification)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {DEMO_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-3 rounded-xl text-left transition-all relative border ${
                    isSelected 
                      ? 'bg-blue-900/40 border-blue-400 shadow-neon-blue' 
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      preset.badgeColor === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                      preset.badgeColor === 'amber' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      preset.badgeColor === 'rose' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {preset.badge}
                    </span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />}
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">{preset.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{preset.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Verification Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Loan Application Form */}
        <div className="lg:col-span-5 glass-panel p-5 sm:p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Loan Application Details
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Step 1 of 2</span>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Inquiring Bank / Institution</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full glass-input rounded-xl p-2.5 text-xs cursor-pointer font-medium"
              >
                <option value="HDFC Bank Ltd">HDFC Bank Ltd (Commercial Lending)</option>
                <option value="State Bank of India">State Bank of India (Bandra Branch)</option>
                <option value="ICICI Bank Ltd">ICICI Bank Ltd (Mortgages)</option>
                <option value="Axis Bank Ltd">Axis Bank Ltd</option>
                <option value="Punjab National Bank">Punjab National Bank</option>
                <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Applicant Name</label>
              <input
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="w-full glass-input rounded-xl p-2.5 text-xs font-medium"
                placeholder="e.g. Vikramaditya Sharma"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Loan Amount (₹)</label>
                <input
                  type="text"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full glass-input rounded-xl p-2.5 text-xs font-mono font-bold text-cyan-300"
                  placeholder="₹ 1,85,00,000"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Facility Type</label>
                <select
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value)}
                  className="w-full glass-input rounded-xl p-2.5 text-xs cursor-pointer"
                >
                  <option value="Home Loan Refinancing">Home Loan Refinancing</option>
                  <option value="First-Time Homebuyer Loan">First-Time Homebuyer Loan</option>
                  <option value="Builder Project Finance">Builder Project Finance</option>
                  <option value="Ancillary Parking Unit Mortgage">Ancillary Parking Mortgage</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Select Land Parcel</label>
              <select
                value={selectedParcelId}
                onChange={(e) => {
                  setSelectedParcelId(e.target.value);
                  const p = PARCELS.find(item => item.id === e.target.value);
                  if (p && p.floors[0]?.units[0]) {
                    setSelectedUnitId(p.floors[0].units[0].id);
                  }
                  setVerificationResult(null);
                }}
                className="w-full glass-input rounded-xl p-2.5 text-xs cursor-pointer font-semibold text-white"
              >
                {PARCELS.map(p => (
                  <option key={p.id} value={p.id}>
                    📍 {p.city} - {p.name} ({p.surveyNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Target 3D Unit / Voxel (Vertical Space)
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => {
                  setSelectedUnitId(e.target.value);
                  setVerificationResult(null);
                }}
                className="w-full glass-input rounded-xl p-2.5 text-xs cursor-pointer font-mono font-bold text-blue-300"
              >
                {allUnitsInParcel.map(u => (
                  <option key={u.id} value={u.id}>
                    Floor {u.floorNumber}: {u.unitNumber} ({u.carpetArea} m²) {u.hasConflict ? '⚠️' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="pt-2">
            <button
              onClick={handleRunVerification}
              disabled={isVerifying}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-neon-blue transition-all duration-300 disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Executing 3D Spatial Octree Collision Query...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Run 3D Spatial Conflict & Anti-Fraud Check</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: 3D Conflict Verification Results Panel */}
        <div className="lg:col-span-7 space-y-4">
          {verificationResult ? (
            <div className={`p-6 rounded-2xl glass-panel border transition-all duration-500 ${
              verificationResult.status === 'SAFE_TO_LEND'
                ? 'glass-panel-success border-emerald-500/50'
                : 'glass-panel-danger border-rose-500/50 shadow-neon-red'
            }`}>
              
              {/* Verdict Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${
                    verificationResult.status === 'SAFE_TO_LEND'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400 animate-pulse'
                  }`}>
                    {verificationResult.status === 'SAFE_TO_LEND' ? (
                      <ShieldCheck className="w-8 h-8" />
                    ) : (
                      <ShieldAlert className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      3D CERSAI VERDICT
                    </span>
                    <h3 className={`text-xl font-extrabold ${
                      verificationResult.status === 'SAFE_TO_LEND' ? 'text-emerald-300' : 'text-rose-400'
                    }`}>
                      {verificationResult.status === 'SAFE_TO_LEND'
                        ? 'CLEARED: 100% SAFE TO LEND'
                        : 'REJECTED: CRITICAL 3D FRAUD DETECTED'}
                    </h3>
                  </div>
                </div>

                {/* Risk Score Gauge */}
                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
                  <span className="text-[10px] font-mono text-slate-400">FRAUD RISK INDEX</span>
                  <span className={`text-2xl font-black font-mono ${
                    verificationResult.riskScore > 50 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {verificationResult.riskScore}/100
                  </span>
                </div>
              </div>

              {/* Detailed Breakdown Cards */}
              <div className="my-5 p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-3">
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {verificationResult.conflictDetails}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Spatial Collision Volume</span>
                    <span className={`font-mono font-bold ${
                      verificationResult.overlapVolume !== '0.0 m³' ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {verificationResult.overlapVolume} ({verificationResult.overlapPercentage})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Active Encumbrance Bank</span>
                    <span className="text-slate-200 font-semibold">{verificationResult.existingBank}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">CERSAI Asset ID</span>
                    <span className="font-mono text-cyan-300">{verificationResult.existingCersai}</span>
                  </div>
                </div>
              </div>

              {/* 3D-ULPIN Spatial Target Reference */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono mb-6">
                <span className="text-slate-400 text-[10px] block">Target 3D-ULPIN Voxel Identifier:</span>
                <span className="text-blue-300 font-bold break-all">{verificationResult.ulpin3d}</span>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setShowCertificateModal(true)}
                  className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 shadow-md transition"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Download Title NOC / Blocker PDF</span>
                </button>

                <button
                  onClick={() => {
                    const unit = allUnitsInParcel.find(u => u.id === selectedUnitId);
                    onNavigateTo3D(unit || allUnitsInParcel[0]);
                  }}
                  className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-neon-blue transition"
                >
                  <Boxes className="w-4 h-4" />
                  <span>Highlight Voxel in 3D Digital Twin</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Empty State / Standby Guide */
            <div className="p-8 sm:p-12 rounded-2xl glass-panel border border-dashed border-slate-800 text-center space-y-4 flex flex-col items-center justify-center h-full min-h-[380px]">
              <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-neon-blue">
                <Boxes className="w-10 h-10 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Spatial Title Verification Engine Ready</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                  Select a demo fraud preset above or enter loan parameters to query vertical spatial intersections against existing CERSAI encumbrance registries.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 font-mono pt-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> ISO 19152 LADM</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" /> 3D Octree Raycasting</span>
              </div>
            </div>
          )}

          {/* 2D vs 3D Cadastre Comparative Comparison Card */}
          <div className="glass-panel p-4 rounded-xl border border-white/5 text-xs">
            <h4 className="font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-cyan-400" />
              <span>Why Legacy 2D CERSAI Fails in High-Rise Properties</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-300">
              <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-500/20">
                <span className="text-red-400 font-bold block mb-1">❌ Legacy 2D Cadastre (Bhulekh / CERSAI)</span>
                <p className="text-slate-400">
                  Collapses all 14 floors onto a single flat (X, Y) plot. Cannot distinguish Floor 4 Flat 402 from Floor 14 Flat 1401. Fraudsters easily register multiple loans using altered unit nomenclatures.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-500/30">
                <span className="text-cyan-300 font-bold block mb-1">✅ 3D-ULPIN Volumetric Cadastre (SIH26011)</span>
                <p className="text-slate-300">
                  Assigns exact volumetric bounding box $[X, Y, Z_{min}, Z_{max}]$. Mathematically prevents two mortgages from occupying the same 3D voxel space ($V_A \cap V_B = 0$).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Certificate Modal */}
      <LoanCertificateModal
        isOpen={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        result={verificationResult}
        application={{
          bankName,
          applicantName,
          loanAmount,
          loanType
        }}
      />
    </div>
  );
}
