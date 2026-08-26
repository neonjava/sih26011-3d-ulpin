import React, { useState } from 'react';
import { 
  BarChart3, 
  ShieldCheck, 
  ShieldAlert, 
  TrendingUp, 
  Clock, 
  Building2, 
  CheckCircle2, 
  AlertOctagon, 
  MapPin, 
  Radio, 
  Sparkles, 
  FileSpreadsheet, 
  RefreshCw,
  Search,
  Filter,
  Layers
} from 'lucide-react';
import { REGISTRAR_STATS } from '../data/mockCadastreData';

export default function RegistrarAnalytics() {
  const [stats, setStats] = useState(REGISTRAR_STATS);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const filteredFraudStream = stats.liveFraudStream.filter(item => {
    const matchesSearch = item.ulpin.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          item.city.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          item.fraudType.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Title Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                Sub-Registrar & DoLR Central Portal
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-emerald-400 font-mono text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Pan-India 3D Cadastre Stream
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              3D Cadastre Governance & Fraud Prevention Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Real-time monitoring of volumetric land administration, illegal phantom floor detections, and cross-bank mortgage deduplication under ISO 19152 LADM standards.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sync SRO Feed</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (5 Key Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="glass-panel p-4 rounded-xl border border-blue-500/20 shadow-lg">
          <div className="flex items-center justify-between text-blue-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total 3D-ULPINs Issued</span>
            <Building2 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{stats.totalUlpinsIssued}</p>
          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" /> +14.2% MoM Growth
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-rose-500/20 shadow-lg">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Vertical Frauds Blocked</span>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-rose-400 font-mono">{stats.verticalDisputesPrevented}</p>
          <span className="text-[11px] font-semibold text-rose-300 flex items-center gap-1 mt-1">
            100% Interception Rate
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-emerald-500/20 shadow-lg">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">High-Rise Assets Unlocked</span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-emerald-300 font-mono">{stats.assetsUnlockedCrores}</p>
          <span className="text-[11px] font-semibold text-slate-400 mt-1 block">Formal Bank Liquidity</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-cyan-500/20 shadow-lg">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ISO 19152 Compliance</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-cyan-300 font-mono">{stats.ladmComplianceRate}</p>
          <span className="text-[11px] font-semibold text-cyan-400 mt-1 block">LADM Profile-3 Validated</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-purple-500/20 shadow-lg">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg Verification Speed</span>
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-purple-300 font-mono">{stats.avgVerificationTime}</p>
          <span className="text-[11px] font-semibold text-emerald-400 mt-1 block">Down from 28 days legacy</span>
        </div>
      </div>

      {/* Middle Analytics Grid: Fraud Breakdown & Jurisdiction Rollout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Fraud Types Breakdown (5 Cols) */}
        <div className="lg:col-span-5 glass-panel p-5 sm:p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Prevented Frauds by Category
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Past 12 Months</span>
          </div>

          <div className="space-y-3.5">
            {stats.fraudTypes.map((item, index) => (
              <div key={index} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-semibold">{item.type}</span>
                  <span className="font-mono font-bold text-white">{item.percentage}% ({item.count.toLocaleString()})</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* State-wise 3D Rollout Progress (7 Cols) */}
        <div className="lg:col-span-7 glass-panel p-5 sm:p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                State-Wise 3D-ULPIN Cadastre Rollout
              </h3>
            </div>
            <span className="text-xs font-mono text-cyan-400">Urban Metros Target</span>
          </div>

          <div className="space-y-3">
            {stats.jurisdictionRollout.map((jur, index) => (
              <div key={index} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{jur.name}</span>
                    <span className="text-xs font-mono font-extrabold text-cyan-400">{jur.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" 
                      style={{ width: `${jur.progress}%` }}
                    />
                  </div>
                </div>

                <div className="text-right min-w-[100px]">
                  <span className="text-[10px] text-slate-400 block font-mono">{jur.parcels} Parcels</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 inline-block">
                    {jur.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-Time Live Fraud Prevention Stream */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Live Pan-India Fraud Prevention Audit Stream
            </h3>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter by ULPIN, City, or Fraud..."
              className="w-full pl-9 pr-3 py-1.5 text-xs glass-input rounded-xl focus:outline-none"
            />
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="pb-3 font-semibold">Incident Ref</th>
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold">Jurisdiction</th>
                <th className="pb-3 font-semibold">3D-ULPIN Target</th>
                <th className="pb-3 font-semibold">Fraud Pattern Detected</th>
                <th className="pb-3 font-semibold">Value Protected</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredFraudStream.map((log) => (
                <tr key={log.id} className="hover:bg-slate-850/50 transition">
                  <td className="py-3 font-mono font-bold text-slate-300">{log.id}</td>
                  <td className="py-3 text-slate-400 font-mono text-[11px]">{log.time}</td>
                  <td className="py-3 text-white font-medium">{log.city}</td>
                  <td className="py-3 font-mono text-cyan-300 text-[11px] max-w-[180px] truncate">{log.ulpin}</td>
                  <td className="py-3 text-slate-200">
                    <span className="font-semibold text-rose-300">{log.fraudType}:</span> {log.bankBlocked}
                  </td>
                  <td className="py-3 font-mono font-bold text-emerald-400">{log.preventedLoss}</td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
