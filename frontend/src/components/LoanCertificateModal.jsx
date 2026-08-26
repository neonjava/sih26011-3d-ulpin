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
  Lock,
  FileCheck
} from 'lucide-react';

export default function LoanCertificateModal({ isOpen, onClose, result, application }) {
  if (!isOpen || !result) return null;

  const isSafe = result.status === 'SAFE_TO_LEND';
  const certificateNumber = result.verificationId || "3DCERSAI-" + Math.floor(100000 + Math.random() * 900000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 text-slate-100">
        
        {/* Close Button & Actions */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-bold text-slate-300">
              OFFICIAL 3D CERSAI CADASTRE VERIFICATION CERTIFICATE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="mt-6 p-6 sm:p-8 rounded-xl bg-slate-950/90 border-2 border-slate-700/80 relative overflow-hidden">
          
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
            <span className="text-8xl font-black rotate-[-30deg]">
              {isSafe ? 'VERIFIED CLEAR' : 'FRAUD BLOCKED'}
            </span>
          </div>

          {/* Certificate Header */}
          <div className="text-center pb-6 border-b border-slate-800">
            <div className="flex justify-center items-center gap-2 mb-1">
              <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                Government of India • Ministry of Rural Development
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              NATIONAL 3D VOLUMETRIC CADASTRE & CERSAI TITLE REPORT
            </h2>
            <p className="text-xs text-blue-400 font-mono mt-1">
              Issued under ISO 19152 LADM Framework & Section 26D of SARFAESI Act
            </p>
          </div>

          {/* Certificate Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 p-4 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-500 text-[10px] block">Certificate Ref</span>
              <span className="font-bold text-white">{certificateNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Timestamp</span>
              <span className="text-slate-300">{issuedDate}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Inquiring Bank</span>
              <span className="text-cyan-300 font-semibold">{application?.bankName || 'HDFC Bank Ltd'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Risk Rating</span>
              <span className={`font-bold ${isSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isSafe ? 'LOW (Clear Title)' : 'CRITICAL FRAUD'}
              </span>
            </div>
          </div>

          {/* Status Verdict Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 my-4 ${
            isSafe 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
              : 'bg-rose-950/50 border-rose-500/50 text-rose-300 shadow-neon-red'
          }`}>
            {isSafe ? (
              <ShieldCheck className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-rose-400 flex-shrink-0 animate-bounce" />
            )}
            <div>
              <h4 className="text-sm font-extrabold uppercase tracking-wide">
                {isSafe ? 'NOC GRANTED: 100% UNENCUMBERED 3D TITLE' : 'CRITICAL LOAN BLOCKER NOTICE: 3D COLLISION DETECTED'}
              </h4>
              <p className="text-xs mt-1 text-slate-200 leading-relaxed">
                {result.conflictDetails}
              </p>
            </div>
          </div>

          {/* Detailed Verification Specs */}
          <div className="space-y-3 text-xs mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 text-[11px] block font-semibold">3D-ULPIN Unique Spatial Identifier:</span>
                <span className="font-mono text-cyan-300 font-bold text-[11px] break-all">{result.ulpin3d}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 text-[11px] block font-semibold">Applicant Name:</span>
                <span className="text-white font-bold">{application?.applicantName || 'Vikramaditya Sharma'}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Spatial Overlap Volume</span>
                <span className={`font-mono font-bold ${isSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.overlapVolume}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Prior Lien Holder</span>
                <span className="text-slate-200 font-semibold">{result.existingBank}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">CERSAI Asset ID</span>
                <span className="font-mono text-slate-200">{result.existingCersai}</span>
              </div>
            </div>
          </div>

          {/* Bottom Signatures & QR Code */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <QrCode className="w-10 h-10 text-black" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-400">Scan to verify cryptographic SHA-256 hash:</p>
                <p className="text-[9px] font-mono text-cyan-400 break-all">
                  a94f8e71b2d039...c482fe91
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block border-b border-slate-500 pb-1 px-4">
                <span className="font-mono text-xs text-blue-300 font-bold">Dr. V. K. Iyer, IAS</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Central Registrar of Securitisation & 3D Cadastre</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-neon-blue transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
