import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Layers, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  Boxes, 
  Zap,
  Activity,
  Compass,
  Scan
} from 'lucide-react';

export default function DroneScanOverlay({ isScanning, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    {
      icon: <Radio className="w-4 h-4 text-sky-400 animate-pulse" />,
      title: 'Step 1/4: Ingesting Drone LiDAR & Photogrammetry',
      detail: 'Processing 1.4M point cloud vertices • RTK GPS differential lock ±0.8cm'
    },
    {
      icon: <Scan className="w-4 h-4 text-emerald-400 animate-spin" />,
      title: 'Step 2/4: Extracting 2D Cadastral Footprint',
      detail: 'Vectorizing boundary polygon • Matching CTS Land Record #1245/8'
    },
    {
      icon: <Cpu className="w-4 h-4 text-purple-400 animate-bounce" />,
      title: 'Step 3/4: AI Multi-Floor Vertical Segmentation',
      detail: 'Detecting slab elevations Z=0m..15m • Segmenting 18 volumetric voxels'
    },
    {
      icon: <Boxes className="w-4 h-4 text-amber-400 animate-pulse" />,
      title: 'Step 4/4: Extruding 3D-ULPIN Digital Twin (ISO 19152)',
      detail: 'Generating unique 3D Bhu-Aadhaar coordinates & anti-fraud hashes'
    }
  ];

  useEffect(() => {
    if (!isScanning) {
      setProgress(0);
      setCurrentStepIndex(0);
      return;
    }

    const duration = 3000; // 3.0 seconds total simulation
    const intervalTime = 50;
    const totalSteps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min(Math.round((currentStep / totalSteps) * 100), 100);
      setProgress(currentProgress);

      if (currentProgress < 25) {
        setCurrentStepIndex(0);
      } else if (currentProgress < 50) {
        setCurrentStepIndex(1);
      } else if (currentProgress < 75) {
        setCurrentStepIndex(2);
      } else {
        setCurrentStepIndex(3);
      }

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        setTimeout(() => {
          onComplete && onComplete();
        }, 200);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isScanning, onComplete]);

  if (!isScanning) return null;

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white select-none animate-in fade-in duration-300">
      
      {/* Animated LiDAR Scanning Horizontal Beam */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] animate-pulse"></div>

      {/* Main Glass HUD Panel */}
      <div className="w-full max-w-lg bg-slate-900/90 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl shadow-cyan-500/10 space-y-6 relative overflow-hidden backdrop-blur-xl">
        
        {/* Hologram Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-inner">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  AI Photogrammetry Pipeline
                </span>
                <span className="text-[10px] font-mono text-slate-400">FPS: 60 • RTK: ACTIVE</span>
              </div>
              <h3 className="text-base font-black text-white mt-1 tracking-tight">
                Simulating AI Drone LiDAR Cadastre Survey
              </h3>
            </div>
          </div>
          
          <div className="text-right font-mono">
            <div className="text-2xl font-black text-cyan-400">{progress}%</div>
            <div className="text-[9px] text-slate-400 uppercase">Synthesizing</div>
          </div>
        </div>

        {/* Dynamic Progress Bar with Glow */}
        <div className="space-y-1.5">
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-75 shadow-[0_0_12px_#38bdf8]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>2D Legacy Deed Ingestion</span>
            <span>3D Volumetric Extrusion</span>
          </div>
        </div>

        {/* Sequential Step Logs */}
        <div className="space-y-2.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
          {steps.map((step, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            return (
              <div 
                key={idx}
                className={`flex items-start gap-3 p-2 rounded-xl transition-all duration-200 ${
                  isCurrent 
                    ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-200 translate-x-1' 
                    : isCompleted 
                    ? 'text-slate-300 opacity-80' 
                    : 'text-slate-500 opacity-40'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                    <span>{step.title}</span>
                    {isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                    )}
                  </div>
                  <div className="text-[10px] opacity-80 font-mono mt-0.5 truncate">
                    {step.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Drone Telemetry HUD */}
        <div className="grid grid-cols-4 gap-2 text-center pt-1 border-t border-slate-800 text-[10px] font-mono text-slate-400">
          <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800">
            <div className="text-slate-500">Altitude</div>
            <div className="text-cyan-300 font-bold">45.0 m</div>
          </div>
          <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800">
            <div className="text-slate-500">Sensor</div>
            <div className="text-cyan-300 font-bold">LiDAR 150kHz</div>
          </div>
          <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800">
            <div className="text-slate-500">GSD</div>
            <div className="text-cyan-300 font-bold">1.2 cm/px</div>
          </div>
          <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800">
            <div className="text-slate-500">Standard</div>
            <div className="text-emerald-400 font-bold">ISO 19152</div>
          </div>
        </div>

      </div>

    </div>
  );
}
