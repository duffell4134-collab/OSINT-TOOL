import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Cpu, 
  Activity, 
  Layers, 
  Zap, 
  ShieldCheck, 
  Radio, 
  CheckCircle2, 
  Search, 
  ArrowRight,
  Globe,
  UserCheck,
  Network,
  Sparkles,
  ChevronRight,
  Database
} from 'lucide-react';
import { InvestigationCase, InvestigationEntity } from '../types';
import { ActiveTab } from './Navbar';

interface BentoDashboardOverviewProps {
  currentCase: InvestigationCase;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onExecuteGlobalRecon: (query: string) => void;
  onAddToCase: (entity: Omit<InvestigationEntity, 'id' | 'timestamp'>) => void;
}

export const BentoDashboardOverview: React.FC<BentoDashboardOverviewProps> = ({
  currentCase,
  activeTab,
  setActiveTab,
  onExecuteGlobalRecon,
  onAddToCase,
}) => {
  const [consoleQuery, setConsoleQuery] = useState(currentCase.target || 'target_entity');
  const [consoleLogIndex, setConsoleLogIndex] = useState(0);

  const consoleLogs = [
    {
      module: 'Sherlock_Engine_v2',
      target: currentCase.target || 'target_recon',
      output: `{\n  "status": "success",\n  "target": "${currentCase.target || 'target_entity'}",\n  "matched_nodes": ${currentCase.entities.length},\n  "active_engines": ["Cloudflare_DoH", "crt_sh_miner", "WhatsMyName_v4", "RDAP_Registry"],\n  "meta": { "latency": "16ms", "threat_risk": "MEDIUM", "dossier_id": "${currentCase.id}" }\n}`,
      action: 'Crawling DNS PTR & Certificate Transparency tree...'
    },
    {
      module: 'Cloudflare_DoH_Miner',
      target: currentCase.target || 'target_recon',
      output: `{\n  "dns_records": {\n    "A": ["104.21.48.1", "172.67.182.202"],\n    "MX": ["mail.${currentCase.target || 'target.org'}"],\n    "TXT": ["v=spf1 include:_spf.google.com ~all"]\n  },\n  "security": { "dmarc": "ENFORCED", "spf": "VALID" }\n}`,
      action: 'Analyzing autonomous system routing tables & ASNs...'
    },
    {
      module: 'Gemini_OSINT_Analyst',
      target: currentCase.target || 'target_recon',
      output: `{\n  "ai_copilot_verdict": "Correlated ${currentCase.entities.length} nodes across 4 domains",\n  "recommended_pivots": [\n    "Execute historical Wayback archive diff",\n    "Search leaked credential git dorks",\n    "Map reverse DNS to sibling hosting tenants"\n  ]\n}`,
      action: 'Ready for deep intelligence correlation.'
    }
  ];

  const currentLog = consoleLogs[consoleLogIndex % consoleLogs.length];

  const modules = [
    { name: 'SpiderFoot_Core.py', status: 'Ready', statusColor: 'text-emerald-400', border: 'border-cyan-500', desc: 'Automated footprinting of IP addresses and domains.', tab: 'domain' as ActiveTab },
    { name: 'WhatsMyName_Hunter', status: 'Working...', statusColor: 'text-cyan-400', border: 'border-slate-700', desc: 'Searching 500+ platforms for username footprint matches.', tab: 'scanner' as ActiveTab },
    { name: 'Shodan_Censys_Bridge', status: 'Ready', statusColor: 'text-emerald-400', border: 'border-slate-700', desc: 'Direct query feeds from device & port databases.', tab: 'ip' as ActiveTab },
    { name: 'GitHub_GitDorker', status: 'Live', statusColor: 'text-emerald-400', border: 'border-amber-500', desc: 'Live dork engines targeting leaked keys and env files.', tab: 'dorks' as ActiveTab },
  ];

  return (
    <div className="grid grid-cols-12 gap-4 mb-6">
      {/* Bento 1: Integrated Modules Deck (col-span-12 lg:col-span-4) */}
      <div className="col-span-12 lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xl backdrop-blur">
        <div>
          <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Integrated Modules</h2>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
              10 ENGINES ACTIVE
            </span>
          </div>

          <div className="space-y-2.5">
            {modules.map((m) => (
              <div 
                key={m.name}
                onClick={() => setActiveTab(m.tab)}
                className={`p-3 bg-slate-900/90 border-l-2 ${m.border} border-t border-r border-b border-slate-800/80 rounded-r-lg shadow-sm hover:border-slate-700 cursor-pointer transition-all group`}
              >
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-slate-200 group-hover:text-cyan-300 transition-colors flex items-center gap-1.5 font-mono text-[11px]">
                    {m.name}
                  </span>
                  <span className={`text-[11px] font-mono font-semibold ${m.statusColor}`}>{m.status}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Schema: <strong>WhatsMyName + Sherlock</strong></span>
          <button 
            onClick={() => setActiveTab('github')}
            className="text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
          >
            <span>Hub</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Bento 2: Live Output JSON / Telemetry Console (col-span-12 lg:col-span-8) */}
      <div className="col-span-12 lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl flex flex-col font-mono text-xs shadow-2xl overflow-hidden min-h-[340px]">
        {/* Terminal Header */}
        <div className="bg-slate-800/60 px-4 py-2.5 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300 font-mono text-[11px]">live_recon_telemetry.json</span>
            <span className="text-[10px] text-slate-500">[{currentLog.module}]</span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setConsoleLogIndex(prev => prev + 1)}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono"
            >
              Cycle Stream
            </button>
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500/80 animate-pulse"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-4 sm:p-5 overflow-x-auto text-cyan-300/90 leading-relaxed bg-black/50 flex-1 font-mono text-[11px] sm:text-xs">
          <div className="mb-2 text-slate-500">
            // Executing continuous telemetry bridge for target: <span className="text-cyan-400 font-bold">&quot;{currentCase.target || 'target_entity'}&quot;</span>
          </div>
          <div className="mb-2 text-slate-300">
            [<span className="text-emerald-400 font-bold">+</span>] Active Node: <span className="text-white font-semibold">&quot;{currentCase.target || 'target_entity'}&quot;</span> | Linked Entities: <span className="text-cyan-400 font-bold">{currentCase.entities.length}</span>
          </div>
          <pre className="text-cyan-200/90 whitespace-pre-wrap font-mono my-2 p-2.5 bg-black/40 rounded border border-slate-800/80">
            {currentLog.output}
          </pre>
          <div className="text-slate-400 mt-3 flex items-center gap-2">
            <span className="text-emerald-400 font-bold">»</span>
            <span>{currentLog.action}</span>
            <span className="animate-pulse text-cyan-400 font-bold">_</span>
          </div>
        </div>
      </div>

      {/* Bento 3: System Stats (col-span-12 sm:col-span-6 lg:col-span-3) */}
      <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Stats</h3>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-[10px] mb-1 font-mono">
                <span className="text-slate-400 uppercase">Memory Cache</span>
                <span className="text-cyan-400 font-bold">4.2 GB / 8 GB</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full w-[52%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-1 font-mono">
                <span className="text-slate-400 uppercase">Concurrent Workers</span>
                <span className="text-emerald-400 font-bold">6 Threads (Live)</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[85%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-1 font-mono">
                <span className="text-slate-400 uppercase">API Quota (GitHub/crt.sh)</span>
                <span className="text-amber-400 font-bold">Unlimited (Public APIs)</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full w-[18%]"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex justify-between">
          <span>LATENCY: 14ms</span>
          <span className="text-emerald-400 font-bold">ONLINE</span>
        </div>
      </div>

      {/* Bento 4: Recent Leads & Signals (col-span-12 sm:col-span-6 lg:col-span-3) */}
      <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Leads & Signals</h3>
            <span className="text-[10px] font-mono text-cyan-400">{currentCase.entities.length} items</span>
          </div>

          <div className="space-y-2">
            {currentCase.entities.slice(0, 3).map((ent) => (
              <div 
                key={ent.id}
                onClick={() => setActiveTab('case')}
                className="flex items-center text-[11px] text-slate-300 bg-slate-800/40 hover:bg-slate-800/80 p-2 rounded-lg border border-slate-800 cursor-pointer transition-colors"
              >
                <div className={`w-2 h-2 rounded-full mr-2.5 flex-shrink-0 ${
                  ent.type === 'ip' ? 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]' :
                  ent.type === 'email' ? 'bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.6)]' :
                  ent.type === 'domain' ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]' :
                  'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                }`}></div>
                <span className="truncate font-mono">{ent.label || ent.value}</span>
              </div>
            ))}

            {currentCase.entities.length === 0 && (
              <div className="text-[11px] text-slate-500 italic p-3 text-center bg-slate-950/40 rounded">
                No active entities yet. Run a hunt to populate dossier.
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => setActiveTab('case')}
          className="mt-3 w-full py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-300 text-[11px] font-mono flex items-center justify-center gap-1 border border-slate-700/60 transition-colors"
        >
          <span>View Dossier Graph ({currentCase.entities.length})</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Bento 5: Automated Discovery Mode Action Box (col-span-12 lg:col-span-6) */}
      <div className="col-span-12 lg:col-span-6 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xl">
        <div className="flex items-start mb-3">
          <div className="p-2.5 bg-cyan-500/10 rounded-lg border border-cyan-500/20 mr-3 flex-shrink-0">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">Automated Multi-Vector Footprint Mode</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                PRO PIVOT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Passive & active footprinting pipeline enabled. Launches cross-vector reconnaissance across DNS, Certificates, Usernames, and Network ASNs.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <button
            onClick={() => onExecuteGlobalRecon(currentCase.target || 'example.com')}
            className="w-full sm:w-auto flex-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 py-2.5 px-4 rounded-lg text-xs font-bold transition-all shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 font-mono"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>EXECUTE GLOBAL FOOTPRINT ({currentCase.target || 'target'})</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className="w-full sm:w-auto bg-slate-800/90 hover:bg-slate-700 text-slate-200 py-2.5 px-4 rounded-lg text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Copilot Briefing</span>
          </button>
        </div>
      </div>
    </div>
  );
};
