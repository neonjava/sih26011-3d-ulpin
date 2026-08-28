import React from 'react';
import { X, Code2, Check, Copy, ArrowRight, ShieldCheck, Database } from 'lucide-react';
import { USE_MOCK_DATA, API_BASE_URL } from '../services/api';

export default function ContractSpecsModal({ isOpen, onClose }) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const jsonSample = `{
  "building_id": "B001",
  "floors": [
    {
      "floor_no": 1,
      "units": [
        { 
          "ulpin": "KA-DVG-P001-B001-F01-U01-Z0-3", 
          "geometry": { "x": -3.8, "z": -3.8, "width": 7.2, "depth": 7.2, "height": 2.7, "z_min": 0, "z_max": 3 }, 
          "owner": "Ramesh Patil", 
          "type": "residential" 
        }
      ]
    }
  ],
  "underground": [
    { 
      "ulpin": "KA-DVG-P001-B001-FB1-U01-Z-3-0", 
      "geometry": { "x": -3.8, "z": -3.8, "width": 7.2, "depth": 7.2, "height": 2.7, "z_min": -3, "z_max": 0 }, 
      "owner": "Society Parking", 
      "type": "parking" 
    }
  ]
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonSample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                3D-ULPIN JSON Contract & API Swap Guide
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                ISO 19152 LADM 3D Profile Schema for Hackathon
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Swap Instructions */}
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 text-blue-950">
            <div className="font-bold text-xs flex items-center gap-1.5 text-blue-900">
              <Database className="w-4 h-4 text-blue-600" />
              <span>One-Line API Swap Point:</span>
            </div>
            <p className="text-xs text-blue-900/90 leading-relaxed">
              Open <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-[11px] font-bold">src/services/api.js</code> and change line 11:
            </p>
            <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto">
              {`export const USE_MOCK_DATA = false; // <-- Switch from true to false`}
            </pre>
            <p className="text-[11px] text-blue-800">
              Once toggled, <code className="font-mono font-bold">fetchBuildingData()</code> will query <code className="font-mono font-bold">http://localhost:8000/api/building/B001</code>.
            </p>
          </div>

          {/* JSON Schema Contract */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Target API Contract Schema (JSON)
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>

            <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-60 border border-slate-800">
              {jsonSample}
            </pre>
          </div>

          {/* 3D Structure Summary */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-800">Above Ground:</div>
              <div className="text-slate-600 mt-0.5">5 Floors (2-3 units per floor)</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-800">Underground:</div>
              <div className="text-slate-600 mt-0.5">1 Level (Parking & Utilities)</div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
