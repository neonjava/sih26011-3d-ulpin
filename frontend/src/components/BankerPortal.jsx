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
      }, 500);
    } catch (err) {
      console.error(err);
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner (Clean Light Theme) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                Next-Gen 3D CERSAI Anti-Fraud Engine
              </span>
              <span className="text-slate-300 text-xs">•</span>
              <span className="text-blue-700 font-mono text-xs font-semibold">SARFAESI Section 26D Compliant</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              3D Volumetric Mortgage & Title Verification
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Eliminate double mortgages and phantom floor fraud across Indian banking. Query the real-time ISO 19152 3D Cadastre registry to detect spatial overlaps in vertical space before disbursing loans.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleApplyPreset(DEMO_PRESETS[0])}
              className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-sm transition"
            >
              Demo: Trigger Double Mortgage
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Loan Application Inputs & Quick Presets */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Quick Scenario Presets Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              ⚡ 1-Click Test Scenarios (Indian Banking)
            </h3>
            <div className="space-y-2">
              {DEMO_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                    selectedPresetId === preset.id
                      ? 'bg-blue-50/70 border-blue-400 text-blue-900 font-medium'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{preset.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      preset.expectedOutcome === 'CLASH_DETECTED'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : (preset.expectedOutcome === 'PHANTOM_FLOOR' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200')
                    }`}>
                      {preset.expectedOutcome === 'CLASH_DETECTED' ? 'DUPLICATE MORTGAGE' : (preset.expectedOutcome === 'PHANTOM_FLOOR' ? 'PHANTOM FLOOR' : 'CLEAR TITLE')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Loan Underwriting Form */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Loan Application Details
            </h3>

            {/* Target Parcel */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cadastral Property (2D Land Base)
              </label>
              <select
                value={selectedParcelId}
                onChange={(e) => {
                  setSelectedParcelId(e.target.value);
                  const p = PARCELS.find(x => x.id === e.target.value);
                  if (p) setSelectedUnitId(p.floors[0].units[0].id);
                }}
                className="w-full clean-input text-xs"
              >
                {PARCELS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.city}: {p.property_name} (CTS: {p.cts_number})
                  </option>
                ))}
              </select>
            </div>

            {/* Target 3D Spatial Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pledged 3D Spatial Unit (Apartment / Floor)
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full clean-input text-xs font-mono"
              >
                {allUnitsInParcel.map((u) => (
                  <option key={u.id} value={u.id}>
                    Unit {u.unitNumber} (Floor {u.floorNumber}) — {u.ulpin_3d}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Lending Bank
                </label>
                <input 
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full clean-input text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sanction Amount (INR)
                </label>
                <input 
                  type="text"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full clean-input text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Applicant / Borrower Name
              </label>
              <input 
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="w-full clean-input text-xs"
              />
            </div>

            {/* Run Verification Button */}
            <button
              onClick={handleRunVerification}
              disabled={isVerifying}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Running 3D Spatial Intersection Query...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Run 3D Spatial Conflict & Anti-Fraud Check</span>
                </>
              )}
            </button>

          </div>

        </div>

        {/* Right Column: Verification Results Display */}
        <div className="lg:col-span-7">
          {verificationResult ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 animate-fadeIn">
              
              {/* Status Header Alert */}
              <div className={`p-4 rounded-xl border ${
                verificationResult.status === 'CRITICAL_FRAUD_DETECTED' || verificationResult.status === 'DUPLICATE_MORTGAGE'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : (verificationResult.status === 'SANCTION_BREACH' ? 'bg-purple-50 border-purple-200 text-purple-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900')
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {verificationResult.status === 'CLEAR' ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <ShieldAlert className="w-8 h-8 text-rose-600 flex-shrink-0" />
                    )}
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-80">
                        Volumetric Cadastre Decision
                      </span>
                      <h2 className="text-xl font-black">
                        {verificationResult.status === 'CLEAR' ? 'TITLE CLEAR: APPROVED FOR LOAN' : 'CRITICAL 3D CONFLICT: LOAN REJECTED'}
                      </h2>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] font-semibold opacity-70">Fraud Risk Score</div>
                    <div className={`text-2xl font-black ${
                      verificationResult.riskScore > 70 ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {verificationResult.riskScore}/100
                    </div>
                  </div>
                </div>

                <p className="text-xs mt-3 pt-2 border-t border-current/10 leading-relaxed font-medium">
                  {verificationResult.message}
                </p>
              </div>

              {/* Conflict Forensic Breakdown if Clashed */}
              {verificationResult.conflicts && verificationResult.conflicts.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Forensic 3D Spatial Collision Report
                  </h4>

                  {verificationResult.conflicts.map((c, i) => (
                    <div key={i} className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-700 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Conflicting Lien Holder: {c.conflictingBank}</span>
                        </span>
                        <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {c.conflictingCersaiId}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                        <div>
                          <div className="text-slate-500">Overlap Volume:</div>
                          <div className="font-bold text-slate-800">{c.overlapVolumeCum || 270.0} m³ (100%)</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Registered Borrower:</div>
                          <div className="font-bold text-slate-800">{c.conflictingBorrower || 'Vikramaditya Roy'}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Original Sanction:</div>
                          <div className="font-bold text-slate-800">{c.sanctionDate || '20 Nov 2023'}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Prior Loan Value:</div>
                          <div className="font-bold text-slate-800">₹ {(c.loanAmountInr / 10000000).toFixed(2)} Cr</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setShowCertificateModal(true)}
                  className="flex-1 min-w-[200px] py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official 3D Title Certificate</span>
                </button>

                <button
                  onClick={() => onNavigateTo3D(allUnitsInParcel.find(u => u.id === selectedUnitId))}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                >
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>View in 3D Twin</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center min-h-[420px]">
              <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Ready for 3D Spatial Title Verification
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                Select an Indian banking scenario preset on the left or enter a candidate property to perform an instant volumetric clash query.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Official Certificate Modal */}
      {showCertificateModal && (
        <LoanCertificateModal 
          result={verificationResult}
          applicantName={applicantName}
          bankName={bankName}
          parcel={currentParcel}
          unit={allUnitsInParcel.find(u => u.id === selectedUnitId)}
          onClose={() => setShowCertificateModal(false)}
        />
      )}

    </div>
  );
}
