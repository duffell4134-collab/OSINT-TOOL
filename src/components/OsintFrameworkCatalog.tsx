import React, { useState } from 'react';
import { 
  Compass, 
  Search, 
  ExternalLink, 
  Filter, 
  ShieldCheck, 
  Terminal, 
  Tag, 
  PlusCircle, 
  Github,
  Globe,
  Sparkles
} from 'lucide-react';
import { OSINT_TOOLS_CATALOG, OSINT_CATEGORIES } from '../data/osintFrameworkData';
import { OSINTTool, InvestigationEntity } from '../types';

interface OsintFrameworkCatalogProps {
  onAddToCase: (entity: Omit<InvestigationEntity, 'id' | 'timestamp'>) => void;
}

export const OsintFrameworkCatalog: React.FC<OsintFrameworkCatalogProps> = ({ onAddToCase }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFree, setOnlyFree] = useState(false);
  const [onlyApi, setOnlyApi] = useState(false);
  const [noRegistration, setNoRegistration] = useState(false);

  const filteredTools = OSINT_TOOLS_CATALOG.filter((tool) => {
    const matchesCat = selectedCategory === 'All' || tool.category === selectedCategory;
    const matchesSearch = 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFree = !onlyFree || tool.pricing === 'Free';
    const matchesApi = !onlyApi || tool.hasApi;
    const matchesNoReg = !noRegistration || !tool.requiresRegistration;
    return matchesCat && matchesSearch && matchesFree && matchesApi && matchesNoReg;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <Compass className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-slate-100">OSINT Framework & Tool Taxonomy</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Structured directory of the world's best free and open-source intelligence tools categorized by investigative phase.
        </p>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools by name, tag, purpose (e.g. metadata, satellite, breach, darkweb)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setOnlyFree(!onlyFree)}
              className={`px-3 py-2 rounded-xl border transition-colors ${
                onlyFree ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-semibold' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              100% Free Only
            </button>
            <button
              onClick={() => setNoRegistration(!noRegistration)}
              className={`px-3 py-2 rounded-xl border transition-colors ${
                noRegistration ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-semibold' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              No Registration
            </button>
            <button
              onClick={() => setOnlyApi(!onlyApi)}
              className={`px-3 py-2 rounded-xl border transition-colors ${
                onlyApi ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-semibold' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              Has API
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-4 scrollbar-thin scrollbar-thumb-slate-800">
          {OSINT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                  {tool.name}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                  tool.pricing === 'Free' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-300'
                }`}>
                  {tool.pricing}
                </span>
              </div>

              <span className="text-[11px] text-cyan-400 font-mono block mb-2">{tool.category}</span>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">{tool.description}</p>

              {tool.opsecConsiderations && (
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px] text-amber-300/90 mb-3 flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>OPSEC: {tool.opsecConsiderations}</span>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {tool.tags.map((tag, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-mono">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <button
                onClick={() => onAddToCase({
                  type: 'note',
                  value: tool.url,
                  label: `Tool: ${tool.name}`,
                  metadata: { category: tool.category, pricing: tool.pricing },
                  tags: ['tool', tool.category.toLowerCase()],
                })}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center gap-1 text-xs"
                title="Add to Case Dossier"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Bookmark Tool</span>
              </button>

              <div className="flex items-center gap-2">
                {tool.githubUrl && (
                  <a
                    href={tool.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="View GitHub Repository"
                  >
                    <Github className="w-3.5 h-3.5" />
                  </a>
                )}
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-semibold flex items-center gap-1.5"
                >
                  <span>Launch Tool</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
