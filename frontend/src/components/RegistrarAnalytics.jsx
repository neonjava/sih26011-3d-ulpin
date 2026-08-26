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
  RefreshCw,
  Search,
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
    }, 400);
  };

  const filteredFraudStream = stats.liveFraudStream.filter(item => {
    const matchesSearch = item.ulpin.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          item.city.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          item.fraudType.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Title Banner (Clean Light Theme) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                Sub-Registrar & DoLR Central Portal
              </span>
              <span className="text-slate-300 text-xs">•</span>
              <span className="text-emerald-700 font-mono text-xs font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Pan-India 3D Cadastre Stream
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              3D Cadastre Governance & Fraud Prevention Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Real-time monitoring of volumetric land administration, illegal phantom floor detections, and cross-bank mortgage deduplication under ISO 19152 LADM standards.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 shadow-sm transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sync SRO Feed</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (5 Key Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total 3D-ULPINs Issued</span>
            <Building2 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{stats.totalUlpinsIssued}</p>
          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" /> +14.2% MoM Growth
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Vertical Frauds Blocked</span>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-rose-600 font-mono">{stats.verticalDisputesPrevented}</p>
          <span className="text-[11px] font-semibold text-rose-700 flex items-center gap-1 mt-1">
            41,200+ Multi-Mortgages
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Assets Unlocked</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{stats.assetsUnlockedInrCr}</p>
          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mt-1">
            Clean High-Rise Titles
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ISO 19152 Compliance</span>
            <BarChart3 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-purple-700 font-mono">{stats.isoComplianceScore}</p>
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-1">
            OGC 3D Cadastre Standard
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-cyan-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Avg SRO Processing</span>
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{stats.averageRegistrationTime}</p>
          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mt-1">
            Down from 45 days
          </span>
        </div>

      </div>

      {/* Real-Time Prevented Fraud Audit Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Live National Fraud Interception Log
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated spatial clash detection alerts intercepted across Indian Sub-Registrar Offices and Banks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search ULPIN or City..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="clean-input pl-8 py-1.5 text-xs w-56"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] bg-slate-50">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">City & SRO</th>
                <th className="py-2.5 px-3">Target 3D-ULPIN</th>
                <th className="py-2.5 px-3">Fraud Type</th>
                <th className="py-2.5 px-3">Attempted Exposure</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFraudStream.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-mono text-slate-500">{item.timestamp}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{item.city} ({item.sro})</td>
                  <td className="py-2.5 px-3 font-mono text-blue-700 font-bold">{item.ulpin}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.fraudType === 'DUPLICATE_MORTGAGE'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                    }`}>
                      {item.fraudType === 'DUPLICATE_MORTGAGE' ? 'DUPLICATE MORTGAGE' : 'PHANTOM FLOOR BREACH'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">{item.amountInr}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      <AlertOctagon className="w-3 h-3 text-rose-600" />
                      BLOCKED
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
