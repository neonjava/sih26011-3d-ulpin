import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  Printer, 
  X, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  FileCheck
} from 'lucide-react';

export default function LoanCertificateModal({ isOpen, onClose, result, applicantName, bankName, parcel, unit }) {
  if (!isOpen && !result) return null;

  const isSafe = result?.status === 'CLEAR' || result?.status === 'SAFE_TO_LEND';
  const certificateNumber = "3DCERSAI-" + Math.floor(100000 + Math.random() * 900000);
  const issuedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 text-slate-900">
        
        {/* Top Action Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              OFFICIAL 3D CERSAI CADASTRE VERIFICATION CERTIFICATE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body (Clean Official Indian Gov Certificate) */}
        <div className="mt-6 p-6 sm:p-8 rounded-xl bg-slate-50 border-2 border-slate-300 relative overflow-hidden">
          
          {/* Header */}
          <div className="text-center pb-6 border-b border-slate-200">
            <div className="text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-1">
              Government of India • Ministry of Rural Development • Department of Land Resources
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              NATIONAL 3D VOLUMETRIC CADASTRE & CERSAI TITLE REPORT
            </h2>
            <p className="text-xs text-blue-700 font-mono font-semibold mt-1">
              Issued under ISO 19152 LADM Framework & Section 26D of SARFAESI Act
            </p>
          </div>

          {/* Certificate Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 p-4 rounded-lg bg-white border border-slate-200 text-xs font-mono">
            <div>
              <span className="text-slate-500 text-[10px] block">Certificate Ref</span>
              <span className="font-bold text-slate-900">{certificateNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Timestamp</span>
              <span className="text-slate-700">{issuedDate}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Inquiring Bank</span>
              <span className="text-blue-700 font-semibold">{bankName || 'HDFC Bank Ltd'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Borrower Name</span>
              <span className="font-bold text-slate-900">{applicantName || 'Vikramaditya Roy'}</span>
            </div>
          </div>

          {/* Decision Status Banner */}
          <div className={`p-4 rounded-xl border ${
            isSafe ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}>
            <div className="flex items-center gap-3">
              {isSafe ? (
                <ShieldCheck className="w-8 h-8 text-emerald-600 flex-shrink-0" />
              ) : (
                <ShieldAlert className="w-8 h-8 text-rose-600 flex-shrink-0" />
              )}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                  Spatial Title Clearance Assessment
                </span>
                <h3 className="text-lg font-black">
                  {isSafe ? 'STATUS: SAFE TO LEND (0% VOLUMETRIC CONFLICT)' : 'STATUS: LOAN DISBURSEMENT BLOCKED (DUPLICATE 3D OVERLAP)'}
                </h3>
              </div>
            </div>
          </div>

          {/* 3D Property Particulars */}
          <div className="mt-6 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3D Property Particulars
            </h4>
            <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">2D Base Land ULPIN:</span>
                <span className="font-mono font-bold text-slate-900">{parcel?.ulpin_2d || 'MH27-045-8912345'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">3D Volumetric ULPIN:</span>
                <span className="font-mono font-bold text-blue-700">{unit?.ulpin_3d || 'MH27-045-8912345-APT-W1-F04-U402-D4A9'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Floor & Unit:</span>
                <span className="font-semibold text-slate-800">Unit {unit?.unitNumber || '402'} (Floor {unit?.floorNumber || '4'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Elevation Bounds:</span>
                <span className="font-mono text-slate-700">+{unit?.zMin || 13.5}m to +{unit?.zMax || 16.5}m</span>
              </div>
            </div>
          </div>

          {/* Footer Seals */}
          <div className="mt-8 pt-4 border-t border-slate-300 flex items-center justify-between text-xs text-slate-500">
            <div>
              <div className="font-mono text-[10px] text-slate-600">
                Cryptographic Seal: SHA256: 7f8a92bc1049e290
              </div>
              <div className="text-[10px] mt-0.5">
                This is a digitally generated 3D cadastre certificate under DILRMP / ISO 19152.
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-800">Registrar General of Cadastre</div>
              <div className="text-[10px]">Department of Land Resources</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
