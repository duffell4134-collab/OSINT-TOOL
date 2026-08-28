import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Terminal, 
  Globe, 
  UserCheck, 
  Network, 
  Mail, 
  History, 
  FileCode2, 
  Compass, 
  FolderGit2, 
  Briefcase, 
  Bot, 
  Sparkles,
  LayoutGrid
} from 'lucide-react';

export type ActiveTab = 
  | 'scanner' 
  | 'domain' 
  | 'ip' 
  | 'email' 
  | 'wayback' 
  | 'dorks' 
  | 'catalog' 
  | 'github' 
  | 'case' 
  | 'ai';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  caseEntityCount: number;
  onQuickSearch?: (query: string) => void;
}

interface NavTabItem {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
  count?: number;
  highlight?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  caseEntityCount,
  onQuickSearch,
}) => {
  const [quickQuery, setQuickQuery] = useState('');

  const tabs: NavTabItem[] = [
    { id: 'scanner', label: 'Username Hunter', icon: UserCheck, badge: 'Live' },
    { id: 'domain', label: 'Domain & DNS Recon', icon: Globe },
    { id: 'ip', label: 'IP & Network Intel', icon: Network },
    { id: 'email', label: 'Email & Identity', icon: Mail },
    { id: 'wayback', label: 'Wayback Archive', icon: History },
    { id: 'dorks', label: 'Dork Engine', icon: Search },
    { id: 'catalog', label: 'OSINT Framework', icon: Compass },
    { id: 'github', label: 'GitHub JSON Hub', icon: FolderGit2, badge: 'Research' },
    { id: 'case', label: 'Case Dossier & Graph', icon: Briefcase, count: caseEntityCount },
    { id: 'ai', label: 'AI Intelligence Copilot', icon: Bot, highlight: true },
  ];

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuery.trim()) return;
    if (onQuickSearch) {
      onQuickSearch(quickQuery.trim());
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bento Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3.5 gap-4 border-b border-slate-800/80">
          {/* Brand Identity */}
          <div 
            className="flex items-center space-x-3 cursor-pointer select-none" 
            onClick={() => setActiveTab('scanner')}
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-900/40 border border-cyan-400/40">
              <Terminal className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-cyan-400 font-sans">
                  OSINT_NEXUS
                </h1>
                <span className="text-slate-500 font-mono text-xs ml-1 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  v1.0.4-stable
                </span>
              </div>
              <p className="text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest font-mono mt-0.5">
                Multi-Source Intelligence Aggregator &amp; Research Workbench
              </p>
            </div>
          </div>

          {/* Quick Command Input & Status Indicators */}
          <div className="flex items-center space-x-4">
            <form 
              onSubmit={handleQuickSubmit}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 flex items-center w-full sm:w-80 md:w-96 shadow-inner focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/30 transition-all"
            >
              <span className="text-slate-500 mr-2 text-xs font-mono font-bold tracking-wider">QUERY:</span>
              <input
                type="text"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-cyan-100 placeholder-slate-500 font-mono"
                placeholder="Username, Domain, IP, or CIDR..."
              />
              <button 
                type="submit"
                className="text-cyan-500 hover:text-cyan-400 text-xs font-mono ml-2 font-bold transition-colors"
                title="Press Enter or Click to Query"
              >
                [ENT]
              </button>
            </form>

            <div className="hidden sm:flex items-center space-x-2 pl-1">
              <div 
                className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" 
                title="Recon Engines Online"
              />
              <div 
                className="w-3 h-3 rounded-full bg-slate-700" 
                title="Node Gateway Synced"
              />
            </div>
          </div>
        </div>

        {/* Bento Nav Tabs Strip */}
        <div className="flex space-x-1.5 overflow-x-auto py-2.5 scrollbar-thin scrollbar-thumb-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 font-mono ${
                  isActive
                    ? 'bg-slate-900 text-cyan-300 border-b-2 border-cyan-400 shadow-md shadow-cyan-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border-b-2 border-transparent'
                } ${tab.highlight && !isActive ? 'text-amber-300 hover:text-amber-200' : ''}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                    {tab.badge}
                  </span>
                )}
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 font-bold">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
