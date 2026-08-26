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
  Cpu, 
  ShieldCheck, 
  QrCode, 
  Maximize2,
  Check,
  Zap,
  Building2
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

    // Simulated multi-stage AI Extrusion Pipeline
    setTimeout(() => setExtrusionStep(2), 600); // 2D polygon normalization
    setTimeout(() => setExtrusionStep(3), 1200); // Z-axis extrusion
    setTimeout(() => setExtrusionStep(4), 1800); // Topological intersection check
    setTimeout(async () => {
      const res = await extrudeDocument(selectedDeed);
      setExtrusionResult(res);
      setIsExtruding(false);
      setExtrusionStep(5);
      if (onExtrudeSuccess) {
        onExtrudeSuccess(selectedDeed);
      }
    }, 2400);
  };

  const extracted = selectedDeed.extractedData;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                AI Deed-to-3D Extrusion Engine
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-blue-400 font-mono text-xs">Vision LLM + Geometric Topology</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Legal Deed Inspection & 3D Extrusion Workbench
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Upload Indian Sale Deeds, Sub-Registrar Index-II extracts, and architectural blueprints. Our Vision Transformer extracts vertical coordinates ($Z_{min}, Z_{max}$, Slab Height, Carpet Area) and automatically extrudes 2D boundary polygons into ISO 19152 3D-ULPIN spatial voxels.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Deed Preset Switcher */}
            <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
              {SAMPLE_DEEDS.map((deed) => (
                <button
                  key={deed.id}
                  onClick={() => handleSelectDeed(deed)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedDeed.id === deed.id
                      ? 'bg-cyan-600 text-white shadow-neon-cyan'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {deed.title.includes('Bandra') ? '📍 Mumbai Bandra Flat 402' : '📍 Delhi Dwarka Flat 702'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (6 Cols): Interactive Legal Document Viewer with Highlighted Entities */}
        <div className="lg:col-span-6 glass-panel p-5 sm:p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            {/* Document Header & File Upload */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Registered Deed Viewer (Index-II)
                </h2>
              </div>
              
              <label className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition">
                <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                <span>Upload PDF</span>
                <input type="file" accept=".pdf,.png,.jpg" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>

            {uploadedFileName && (
              <div className="mt-2 p-2 rounded-lg bg-blue-950/40 border border-blue-500/30 text-xs text-cyan-300 flex items-center justify-between">
                <span>Loaded file: {uploadedFileName}</span>
                <span className="text-[10px] font-bold text-emerald-400">OCR PARSED ✓</span>
              </div>
            )}

            {/* Simulated Legal Document Canvas */}
            <div className="mt-4 p-5 sm:p-6 rounded-xl bg-slate-950 border border-slate-800 font-serif text-slate-300 text-xs leading-relaxed max-h-[480px] overflow-y-auto space-y-3 relative shadow-inner">
              
              {/* Official Stamp Duty Seal & Watermark */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-[11px] font-sans">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-yellow-500/50 flex items-center justify-center font-bold text-yellow-400 text-[9px] text-center">
                    SRO
                  </div>
                  <div>
                    <span className="font-bold text-white block">SUB-REGISTRAR OFFICE • {selectedDeed.sroOffice}</span>
                    <span className="text-slate-400 font-mono">Reg No: {selectedDeed.registrationNumber} • Date: {selectedDeed.registrationDate}</span>
                  </div>
                </div>
                <span className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 font-mono text-[10px] rounded">
                  Stamp: {extracted.stampDutyPaid}
                </span>
              </div>

              {/* Legal Text Paragraphs with Highlighted OCR Spans */}
              <p>
                THIS DEED OF CONVEYANCE is made on this <span className="text-white font-semibold">{selectedDeed.registrationDate}</span> between the Vendor and the Purchasers, <mark className="bg-blue-500/30 text-cyan-200 px-1 rounded border border-cyan-400/40 font-sans font-bold">{extracted.ownerName}</mark> (PAN: {extracted.panApplicant}).
              </p>

              <p>
                WHEREAS the Vendor is the absolute owner of the premises known as <span className="text-white font-semibold">{selectedDeed.title}</span>, situated on Land Bearing Survey / CTS No. <mark className="bg-purple-500/30 text-purple-200 px-1 rounded border border-purple-400/40 font-mono font-bold">{extracted.surveyNo}</mark>.
              </p>

              <p>
                AND WHEREAS the Vendor agrees to convey unto the Purchasers all that residential premises designated as <mark className="bg-emerald-500/30 text-emerald-200 px-1 rounded border border-emerald-400/40 font-bold">{extracted.unitNumber}</mark>, situated on the <mark className="bg-emerald-500/30 text-emerald-200 px-1 rounded border border-emerald-400/40 font-bold">Floor No. {extracted.floorNumber}</mark> having an exact RERA Carpet Area of <mark className="bg-cyan-500/30 text-cyan-200 px-1 rounded border border-cyan-400/40 font-mono font-bold">{extracted.carpetArea} sq. metres</mark> (Built-up Area: {extracted.builtUpArea} sq.m).
              </p>

              {/* Vertical Cadastre Elevation Clause (Key SIH Innovation) */}
              <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-500/30 font-sans text-xs space-y-1">
                <span className="font-bold text-blue-300 block text-[11px] uppercase">
                  SCHEDULE 'C' - 3D VOLUMETRIC SPATIAL BOUNDARIES (ISO 19152):
                </span>
                <p className="text-slate-300 text-[11px]">
                  Vertical Elevation: <mark className="bg-blue-500/40 text-white px-1 font-mono font-bold rounded">Z_min = {extracted.elevationZMinMeters}m</mark> to <mark className="bg-blue-500/40 text-white px-1 font-mono font-bold rounded">Z_max = {extracted.elevationZMaxMeters}m</mark> above Mean Sea Level datum (Clear Slab Height: <span className="text-emerald-300 font-mono">{extracted.slabHeightMeters}m</span>).
                </p>
                <p className="text-slate-300 text-[11px]">
                  Assigned 3D-ULPIN: <mark className="bg-cyan-500/40 text-cyan-200 px-1 font-mono font-bold rounded">{extracted.ulpin3d}</mark>
                </p>
              </div>

              {/* Boundary Schedule */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-sans">
                <span className="font-bold text-slate-400 block mb-1">FOUR SIDES PROPERTY BOUNDARIES:</span>
                <ul className="grid grid-cols-2 gap-2 text-slate-300">
                  <li>• North: {extracted.boundaryDescription.north}</li>
                  <li>• South: {extracted.boundaryDescription.south}</li>
                  <li>• East: {extracted.boundaryDescription.east}</li>
                  <li>• West: {extracted.boundaryDescription.west}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* AI OCR Extraction Meta */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs font-mono">
            <div className="flex items-center gap-2 text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span>Vision Transformer OCR: {extracted.ocrConfidence}% Confidence</span>
            </div>
            <span className="text-blue-300 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-400/30">
              {extracted.ladmValidation}
            </span>
          </div>
        </div>

        {/* Right Column (6 Cols): AI Extracted Structured JSON & Extrude Trigger */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-400" />
                <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Extracted 3D Cadastral Entities
                </h2>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-semibold">ISO 19152 LADM Model</span>
            </div>

            {/* Entity Key-Value Cards */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Unit & Floor</span>
                <span className="text-white font-bold text-sm">{extracted.unitNumber}</span>
                <span className="text-slate-500 text-[11px] block">Floor {extracted.floorNumber}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Primary Owner(s)</span>
                <span className="text-white font-bold text-xs truncate block">{extracted.ownerName}</span>
                <span className="text-slate-500 text-[10px] block font-mono">{extracted.aadhaarRef}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">RERA Carpet Area</span>
                <span className="text-cyan-300 font-mono font-extrabold text-sm">{extracted.carpetArea} m²</span>
                <span className="text-slate-500 text-[10px] block">Built-up: {extracted.builtUpArea} m²</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Vertical Elevation (Z-Interval)</span>
                <span className="text-emerald-400 font-mono font-extrabold text-xs">
                  {extracted.elevationZMinMeters}m → {extracted.elevationZMaxMeters}m
                </span>
                <span className="text-slate-500 text-[10px] block font-mono">Slab: {extracted.slabHeightMeters}m</span>
              </div>
            </div>

            {/* Generated 3D-ULPIN Unique Hash */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/60 to-cyan-950/60 border border-blue-500/40">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  MINTED 3D-ULPIN (Volumetric Identifier)
                </span>
              </div>
              <p className="font-mono text-xs font-black text-cyan-300 break-all select-all">
                {extracted.ulpin3d}
              </p>
            </div>

            {/* Extrusion Pipeline Status */}
            {isExtruding && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-blue-500/40 space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-white flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    3D Volumetric Extrusion Pipeline...
                  </span>
                  <span className="text-cyan-400 font-mono">{extrusionStep * 20}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${extrusionStep * 20}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-300 font-mono">
                  {extrusionStep === 1 && '1/5 Parsing 2D boundary polygon from Deed Schedule C...'}
                  {extrusionStep === 2 && '2/5 Normalizing local coordinates to UTM EPSG:7760...'}
                  {extrusionStep === 3 && `3/5 Extruding Z-axis prism [${extracted.elevationZMinMeters}m → ${extracted.elevationZMaxMeters}m]...`}
                  {extrusionStep === 4 && '4/5 Executing 3D Octree topological non-intersection check...'}
                  {extrusionStep === 5 && '5/5 Minting ISO 19152 3D Cadastre spatial unit!'}
                </p>
              </div>
            )}

            {/* Extrusion Success Alert */}
            {extrusionResult && !isExtruding && (
              <div className="p-4 rounded-xl glass-panel-success border border-emerald-500/40 space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>3D CADASTRE VOXEL GENERATED SUCCESSFULLY</span>
                </div>
                <p className="text-xs text-slate-200">
                  {extrusionResult.message} Volume: <span className="font-mono font-bold text-emerald-300">{extrusionResult.volumeM3} m³</span>
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => onNavigateTo3D(selectedDeed)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-neon-green transition"
                  >
                    <Boxes className="w-4 h-4" />
                    <span>View Extruded Voxel in 3D Twin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Main Action Button */}
            {!isExtruding && !extrusionResult && (
              <button
                onClick={handleStartExtrusion}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-neon-cyan transition-all duration-300"
              >
                <Boxes className="w-4 h-4" />
                <span>Extrude Deed into 3D-ULPIN Cadastral Voxel</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
