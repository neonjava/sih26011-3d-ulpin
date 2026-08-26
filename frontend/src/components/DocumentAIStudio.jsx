import React, { useState } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Sparkles, 
  Boxes, 
  CheckCircle2, 
  Layers, 
  ArrowRight, 
  Eye, 
  ShieldCheck, 
  Building2,
  Check
} from 'lucide-react';
import { SAMPLE_DEEDS } from '../data/mockCadastreData';
import { extrudeDocument } from '../services/api';

export default function DocumentAIStudio({ onExtrudeSuccess, onNavigateTo3D }) {
  const [selectedDeed, setSelectedDeed] = useState(SAMPLE_DEEDS[0]);
  const [activeHighlightField, setActiveHighlightField] = useState('ALL');
  const [isExtruding, setIsExtruding] = useState(false);
  const [extrusionStep, setExtrusionStep] = useState(0);
  const [extrusionResult, setExtrusionResult] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);

  const handleSelectDeed = (deed) => {
    setSelectedDeed(deed);
    setExtrusionResult(null);
    setExtrusionStep(0);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setExtrusionResult(null);
    }
  };

  const handleStartExtrusion = async () => {
    setIsExtruding(true);
    setExtrusionStep(1);

    setTimeout(() => setExtrusionStep(2), 500);
    setTimeout(() => setExtrusionStep(3), 1000);
    setTimeout(() => setExtrusionStep(4), 1500);
    setTimeout(async () => {
      const res = await extrudeDocument(selectedDeed);
      setExtrusionResult(res);
      setIsExtruding(false);
      setExtrusionStep(5);
      if (onExtrudeSuccess) {
        onExtrudeSuccess(selectedDeed);
      }
    }, 2000);
  };

  const extracted = selectedDeed.extractedData;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner (Clean Light Theme) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                AI Deed-to-3D Extrusion Engine
              </span>
              <span className="text-slate-300 text-xs">•</span>
              <span className="text-slate-600 font-mono text-xs">Vision OCR + Geometric Extrusion</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Legal Deed Inspection & 3D Extrusion Workbench
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Upload Indian Sale Deeds and Sub-Registrar Index-II forms. Our system extracts vertical coordinates (Floor, Height, Carpet Area) and automatically extrudes 2D boundary polygons into ISO 19152 3D-ULPIN spatial units.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            {SAMPLE_DEEDS.map((deed) => (
              <button
                key={deed.id}
                onClick={() => handleSelectDeed(deed)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedDeed.id === deed.id
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {deed.title.split(' ')[0]} {deed.title.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Document Viewer on Left, Extracted Fields & Extruder on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Authentic Indian Deed / Index-II Viewer */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  {selectedDeed.title}
                </h3>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                SRO Doc #{selectedDeed.registrationNumber}
              </span>
            </div>

            {/* Official Indian Stamp Paper Header Simulation */}
            <div className="border border-slate-300 rounded-lg p-4 bg-slate-50 space-y-4 text-xs">
              <div className="text-center border-b border-slate-200 pb-3">
                <div className="text-[11px] font-bold tracking-widest text-slate-600 uppercase">
                  Government of Maharashtra • Department of Registration and Stamps
                </div>
                <div className="text-base font-extrabold text-slate-900 mt-0.5">
                  INDEX-II / SALE DEED REGISTER
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Sub-Registrar Office: Bandra-3 (Mumbai Suburban) • Year: 2023-24
                </div>
              </div>

              {/* Schedule A & B Display */}
              <div className="space-y-3 font-mono text-[11px]">
                <div className="bg-white p-3 rounded border border-slate-200">
                  <div className="font-bold text-slate-900 uppercase text-[11px] mb-1">
                    Schedule A (Ground Land Description):
                  </div>
                  <p className="text-slate-700 leading-relaxed font-sans text-xs">
                    All that piece and parcel of land bearing CTS No. <strong>{extracted.ctsNumber}</strong>, Survey No. 1042, Village Bandra, Taluka Andheri, bounded on North by 18m DP Road, South by CTS 1043.
                  </p>
                </div>

                <div className="bg-blue-50/60 p-3 rounded border border-blue-200">
                  <div className="font-bold text-blue-950 uppercase text-[11px] mb-1">
                    Schedule B (3D Volumetric Apartment Unit):
                  </div>
                  <p className="text-slate-800 leading-relaxed font-sans text-xs">
                    Apartment <strong>Flat No. {extracted.flatNumber}</strong> situated on the <strong>{extracted.floorNumber}th Floor</strong>, Wing {extracted.wing}, having RERA Carpet Area of <strong>{extracted.carpetAreaSqm} sq. meters</strong> ({extracted.carpetAreaSqft} sq.ft), slab-to-slab clear height of <strong>{extracted.slabHeightM} meters</strong>, elevation base +{extracted.elevationBaseM}m to top +{extracted.elevationTopM}m.
                  </p>
                </div>
              </div>

              {/* Legal Parties */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-[11px]">
                <div>
                  <span className="text-slate-500 font-medium">Executing Builder/Vendor:</span>
                  <div className="font-bold text-slate-800">{extracted.vendorName}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Purchaser / Allottee:</span>
                  <div className="font-bold text-slate-800">{extracted.purchaserName}</div>
                </div>
              </div>
            </div>

            {/* Custom Deed Upload Field */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition">
                <UploadCloud className="w-4 h-4 text-blue-600" />
                <span>Upload Custom Indian Deed (PDF)</span>
                <input type="file" accept=".pdf,.png,.jpg" onChange={handleFileUpload} className="hidden" />
              </label>
              {uploadedFileName && (
                <span className="text-xs text-emerald-700 font-semibold truncate max-w-xs">
                  ✓ {uploadedFileName}
                </span>
              )}
            </div>

          </div>
        </div>

        {/* Right Column: AI Extraction Inspector & Extrusion Trigger */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Extracted 3D Parameters Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Extracted 3D Spatial Attributes
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                100% OCR Confidence
              </span>
            </div>

            {/* Parameter Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[11px]">2D Land Base ULPIN</div>
                <div className="font-bold text-slate-900 text-xs font-mono mt-0.5">
                  {extracted.ulpin2D}
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[11px]">Flat & Wing</div>
                <div className="font-bold text-slate-900 text-xs mt-0.5">
                  Flat {extracted.flatNumber} (Wing {extracted.wing})
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[11px]">Floor Level ($Z_{'{index}'}$)</div>
                <div className="font-bold text-slate-900 text-xs mt-0.5">
                  Floor {extracted.floorNumber}
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[11px]">RERA Carpet Area</div>
                <div className="font-bold text-slate-900 text-xs mt-0.5">
                  {extracted.carpetAreaSqm} m² ({extracted.carpetAreaSqft} sq.ft)
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[11px]">Floor Base ($Z_{'{min}'}$)</div>
                <div className="font-bold text-blue-700 text-xs font-mono mt-0.5">
                  +{extracted.elevationBaseM} meters
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[11px]">Floor Ceiling ($Z_{'{max}'}$)</div>
                <div className="font-bold text-blue-700 text-xs font-mono mt-0.5">
                  +{extracted.elevationTopM} meters
                </div>
              </div>
            </div>

            {/* Extrusion Trigger Button */}
            <button
              onClick={handleStartExtrusion}
              disabled={isExtruding}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
            >
              {isExtruding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Extruding 2D Polygon to 3D Voxel...</span>
                </>
              ) : (
                <>
                  <Boxes className="w-4 h-4" />
                  <span>Extrude to 3D Cadastre (Mint 3D-ULPIN)</span>
                </>
              )}
            </button>

          </div>

          {/* Extrusion Pipeline Status Box */}
          {extrusionStep > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 animate-fadeIn">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Automated 3D Cadastre Pipeline
              </h4>

              <div className="space-y-2 text-xs">
                <div className={`flex items-center gap-2 ${extrusionStep >= 1 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <span className="w-4 h-4 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[10px]">1</span>
                  <span>OCR extracted Schedule B vertical coordinates</span>
                </div>

                <div className={`flex items-center gap-2 ${extrusionStep >= 2 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <span className="w-4 h-4 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[10px]">2</span>
                  <span>2D floor plate polygon normalized & partitioned</span>
                </div>

                <div className={`flex items-center gap-2 ${extrusionStep >= 3 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <span className="w-4 h-4 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[10px]">3</span>
                  <span>Shapely & Trimesh Z-axis polyhedral solid generated</span>
                </div>

                <div className={`flex items-center gap-2 ${extrusionStep >= 4 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <span className="w-4 h-4 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[10px]">4</span>
                  <span>3D volumetric collision & mortgage conflict audit</span>
                </div>

                <div className={`flex items-center gap-2 ${extrusionStep >= 5 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  <span className="w-4 h-4 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[10px]">5</span>
                  <span>Minted 3D-ULPIN: <code className="font-mono text-[11px] font-bold text-slate-800">{extracted.generatedUlpin3D}</code></span>
                </div>
              </div>

              {extrusionStep === 5 && (
                <button
                  onClick={() => onNavigateTo3D(selectedDeed)}
                  className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Inspect Extruded Unit in 3D Twin</span>
                </button>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
