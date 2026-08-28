import React, { useState } from 'react';
import { 
  Search, 
  Copy, 
  ExternalLink, 
  Check, 
  Filter, 
  Terminal, 
  Sparkles, 
  Layers, 
  Key, 
  FileCode, 
  ShieldAlert, 
  PlusCircle,
  Plus
} from 'lucide-react';
import { DORK_ITEMS } from '../data/dorksData';
import { DorkItem, InvestigationEntity } from '../types';

interface DorkBuilderProps {
  initialTarget?: string;
  onAddToCase: (entity: Omit<InvestigationEntity, 'id' | 'timestamp'>) => void;
}

export const DorkBuilder: React.FC<DorkBuilderProps> = ({
  initialTarget = 'example.com',
  onAddToCase,
}) => {
  const [target, setTarget] = useState(initialTarget);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Custom query builder state
  const [customSite, setCustomSite] = useState('');
  const [customFiletype, setCustomFiletype] = useState('');
  const [customIntext, setCustomIntext] = useState('');
  const [customIntitle, setCustomIntitle] = useState('');
  const [customInurl, setCustomInurl] = useState('');

  const categories = ['All', 'Credentials & Keys', 'Sensitive Files', 'Login Portals', 'Cloud Storage', 'Vulnerable Servers', 'GitHub Code', 'Public Records & Emails'];
  const platforms = ['All', 'Google', 'GitHub', 'Shodan', 'Censys'];

  const getInterpolatedQuery = (pattern: string) => {
    const cleanTarget = target.trim() || 'target.com';
    return pattern.replace(/\{target\}/g, cleanTarget);
  };

  const handleCopy = (id: string, query: string) => {
    navigator.clipboard.writeText(query);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSearchUrl = (platform: string, query: string) => {
    switch (platform) {
      case 'Google':
        return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      case 'GitHub':
        return `https://github.com/search?q=${encodeURIComponent(query)}&type=code`;
      case 'Shodan':
        return `https://www.shodan.io/search?query=${encodeURIComponent(query)}`;
      case 'Censys':
        return `https://search.censys.io/search?resource=hosts&q=${encodeURIComponent(query)}`;
      default:
        return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
  };

  const buildCustomQuery = () => {
    const parts: string[] = [];
    if (customSite.trim()) parts.push(`site:${customSite.trim()}`);
    if (customFiletype.trim()) parts.push(`filetype:${customFiletype.trim()}`);
    if (customIntitle.trim()) parts.push(`intitle:"${customIntitle.trim()}"`);
    if (customInurl.trim()) parts.push(`inurl:"${customInurl.trim()}"`);
    if (customIntext.trim()) parts.push(`"${customIntext.trim()}"`);
    return parts.join(' ');
  };

  const customBuiltQuery = buildCustomQuery();

  const filteredDorks = DORK_ITEMS.filter((item) => {
    const matchesPlatform = selectedPlatform === 'All' || item.platform === selectedPlatform;
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.queryPattern.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Target Configuration Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-slate-100">Google, GitHub & Shodan Dork Engine</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Advanced reconnaissance queries dynamically interpolated with your target domain or organization to uncover exposed credentials, cloud buckets, and hidden administrative assets.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-3 text-slate-500 text-xs font-semibold uppercase">Target</span>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. target.org or company-name"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-16 pr-4 text-sm text-cyan-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 font-mono font-semibold"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              {platforms.map(p => (
                <option key={p} value={p}>{p === 'All' ? 'All Engines' : p}</option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Dork Categories' : c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Interactive Custom Dork Composer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Custom Visual Query Composer</h3>
          </div>
          {customBuiltQuery && (
            <span className="text-[11px] text-cyan-400 font-mono">Query Ready</span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-3">
          <div>
            <label className="text-[10px] text-slate-400 font-mono block mb-1">site:</label>
            <input
              type="text"
              value={customSite}
              onChange={(e) => setCustomSite(e.target.value)}
              placeholder="target.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-mono block mb-1">filetype:</label>
            <input
              type="text"
              value={customFiletype}
              onChange={(e) => setCustomFiletype(e.target.value)}
              placeholder="env, sql, pdf"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-mono block mb-1">inurl:</label>
            <input
              type="text"
              value={customInurl}
              onChange={(e) => setCustomInurl(e.target.value)}
              placeholder="admin, login"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-mono block mb-1">intitle:</label>
            <input
              type="text"
              value={customIntitle}
              onChange={(e) => setCustomIntitle(e.target.value)}
              placeholder="Index of /"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-mono block mb-1">intext / exact:</label>
            <input
              type="text"
              value={customIntext}
              onChange={(e) => setCustomIntext(e.target.value)}
              placeholder="password"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {customBuiltQuery ? (
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-cyan-800/50">
            <code className="text-xs text-cyan-300 font-mono">{customBuiltQuery}</code>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy('custom-dork', customBuiltQuery)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
              >
                {copiedId === 'custom-dork' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
              <a
                href={getSearchUrl('Google', customBuiltQuery)}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center gap-1"
              >
                <span>Launch Google Search</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">Fill any field above to compose a dork in real time.</p>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dorks library..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <span className="text-xs text-slate-400">
          Showing <strong>{filteredDorks.length}</strong> precision queries
        </span>
      </div>

      {/* Dorks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDorks.map((dork) => {
          const interpolated = getInterpolatedQuery(dork.queryPattern);
          const launchUrl = getSearchUrl(dork.platform, interpolated);

          const platformBadges: Record<string, string> = {
            Google: 'bg-blue-950 text-blue-400 border-blue-800',
            GitHub: 'bg-slate-800 text-slate-300 border-slate-700',
            Shodan: 'bg-red-950 text-red-400 border-red-800',
            Censys: 'bg-purple-950 text-purple-400 border-purple-800',
          };

          return (
            <div
              key={dork.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-slate-700 transition-colors space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-semibold text-sm text-slate-100 block">{dork.title}</span>
                    <span className="text-[11px] text-slate-400">{dork.category}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${platformBadges[dork.platform]}`}>
                    {dork.platform}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-3">{dork.description}</p>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 mb-2">
                  <code className="text-xs text-cyan-300 font-mono break-all line-clamp-3 block">
                    {interpolated}
                  </code>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <button
                  onClick={() => handleCopy(dork.id, interpolated)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                >
                  {copiedId === dork.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Query</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAddToCase({
                      type: 'note',
                      value: interpolated,
                      label: `Dork: ${dork.title}`,
                      metadata: { platform: dork.platform, target },
                      tags: ['dork', dork.platform.toLowerCase(), target],
                    })}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400"
                    title="Add Dork to Case"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>

                  <a
                    href={launchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Launch Search</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
