import React, { useState } from 'react';
import { Search, Globe, UserCheck, Network, Mail, ArrowRight, Sparkles, Filter, Terminal } from 'lucide-react';
import { ActiveTab } from './Navbar';

interface OmniSearchProps {
  onSearch: (query: string, detectedType: 'username' | 'domain' | 'ip' | 'email') => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const OmniSearch: React.FC<OmniSearchProps> = ({ onSearch, setActiveTab }) => {
  const [input, setInput] = useState('');

  const detectType = (val: string): 'username' | 'domain' | 'ip' | 'email' => {
    const trimmed = val.trim();
    if (trimmed.includes('@') && trimmed.includes('.')) {
      return 'email';
    }
    // IPv4 pattern
    if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(trimmed)) {
      return 'ip';
    }
    // Domain pattern
    if (/^[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/.*)?$/.test(trimmed) || (trimmed.includes('.') && !trimmed.includes(' '))) {
      return 'domain';
    }
    return 'username';
  };

  const detected = input ? detectType(input) : 'username';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const type = detectType(input);
    onSearch(input.trim(), type);
    
    // Switch to corresponding tab
    if (type === 'username') setActiveTab('scanner');
    else if (type === 'domain') setActiveTab('domain');
    else if (type === 'ip') setActiveTab('ip');
    else if (type === 'email') setActiveTab('email');
  };

  const badges = {
    username: { label: 'Username Recon', icon: UserCheck, color: 'text-amber-400 bg-amber-950/60 border-amber-800/60' },
    domain: { label: 'Domain & DNS Recon', icon: Globe, color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60' },
    ip: { label: 'IP Intelligence', icon: Network, color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60' },
    email: { label: 'Email Footprint', icon: Mail, color: 'text-purple-400 bg-purple-950/60 border-purple-800/60' },
  };

  const currentBadge = badges[detected];
  const BadgeIcon = currentBadge.icon;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg backdrop-blur mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Universal Recon Target Query Engine
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Auto-parses target syntax for usernames (<span className="text-cyan-400 font-mono">torvalds</span>), domains (<span className="text-cyan-400 font-mono">github.com</span>), IPs (<span className="text-cyan-400 font-mono">8.8.8.8</span>), or emails (<span className="text-cyan-400 font-mono">sec@target.org</span>).
          </p>
        </div>

        {input.trim() && (
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium border ${currentBadge.color}`}>
            <BadgeIcon className="w-3 h-3" />
            <span>Target Mode: <strong>{currentBadge.label}</strong></span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3.5 text-slate-500 font-mono text-xs pointer-events-none font-bold">
          &gt;
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter username, domain, IP address, or email to dispatch target scan..."
          className="w-full bg-slate-950 border border-slate-700/80 rounded-lg py-2.5 pl-8 pr-32 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/60 focus:border-cyan-500 transition-all font-mono"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="absolute right-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold font-mono text-xs px-3.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all shadow-md"
        >
          <span>RUN SCAN</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Quick Launch Chips */}
      <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-400 overflow-x-auto pb-1 font-mono">
        <span className="text-slate-500 font-medium whitespace-nowrap uppercase text-[10px]">Quick Pivot Presets:</span>
        <button
          type="button"
          onClick={() => { setInput('steve'); onSearch('steve', 'username'); setActiveTab('scanner'); }}
          className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-cyan-500/50 transition-colors whitespace-nowrap"
        >
          @steve (Username)
        </button>
        <button
          type="button"
          onClick={() => { setInput('cloudflare.com'); onSearch('cloudflare.com', 'domain'); setActiveTab('domain'); }}
          className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-cyan-500/50 transition-colors whitespace-nowrap"
        >
          cloudflare.com (DNS & Subdomains)
        </button>
        <button
          type="button"
          onClick={() => { setInput('1.1.1.1'); onSearch('1.1.1.1', 'ip'); setActiveTab('ip'); }}
          className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-cyan-500/50 transition-colors whitespace-nowrap"
        >
          1.1.1.1 (Network & ASN)
        </button>
        <button
          type="button"
          onClick={() => { setInput('support@github.com'); onSearch('support@github.com', 'email'); setActiveTab('email'); }}
          className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-cyan-500/50 transition-colors whitespace-nowrap"
        >
          support@github.com (Email)
        </button>
      </div>
    </div>
  );
};
