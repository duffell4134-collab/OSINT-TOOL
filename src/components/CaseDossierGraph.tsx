import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { 
  Briefcase, 
  Trash2, 
  Download, 
  Plus, 
  Network, 
  Globe, 
  UserCheck, 
  Mail, 
  FileText, 
  Share2, 
  Layers, 
  Eye, 
  ExternalLink,
  Edit3,
  Bot
} from 'lucide-react';
import { InvestigationCase, InvestigationEntity, CaseNote } from '../types';

interface CaseDossierGraphProps {
  currentCase: InvestigationCase;
  onUpdateCase: (updated: InvestigationCase) => void;
  onSelectEntityForAi?: (entity: InvestigationEntity) => void;
  onSwitchToAiTab: () => void;
}

export const CaseDossierGraph: React.FC<CaseDossierGraphProps> = ({
  currentCase,
  onUpdateCase,
  onSwitchToAiTab,
}) => {
  const [selectedEntity, setSelectedEntity] = useState<InvestigationEntity | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState<InvestigationEntity['type']>('username');
  const [newValue, setNewValue] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [activeSubView, setActiveSubView] = useState<'graph' | 'entities' | 'notes'>('graph');

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Render D3 Graph
  useEffect(() => {
    if (activeSubView !== 'graph' || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 450;

    const container = svg.append('g');

    // Zoom setup
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Prepare nodes and links
    const nodes = currentCase.entities.map((e) => ({
      id: e.id,
      label: e.label || e.value,
      type: e.type,
      entity: e,
    }));

    // Auto-link entities based on shared tags or domain hierarchy
    const links: Array<{ source: string; target: string }> = [];
    for (let i = 0; i < currentCase.entities.length; i++) {
      for (let j = i + 1; j < currentCase.entities.length; j++) {
        const e1 = currentCase.entities[i];
        const e2 = currentCase.entities[j];
        
        // Link if share tags or subdomain to domain
        const sharedTags = (e1.tags || []).filter(t => (e2.tags || []).includes(t));
        const isSubDomainRelation = 
          (e1.type === 'domain' && e2.type === 'subdomain' && e2.value.endsWith(e1.value)) ||
          (e2.type === 'domain' && e1.type === 'subdomain' && e1.value.endsWith(e2.value));
        
        if (sharedTags.length > 0 || isSubDomainRelation) {
          links.push({ source: e1.id, target: e2.id });
        }
      }
    }

    // Colors by entity type
    const colorMap: Record<string, string> = {
      username: '#f59e0b', // amber
      domain: '#06b6d4',   // cyan
      subdomain: '#3b82f6',// blue
      ip: '#10b981',       // emerald
      email: '#a855f7',    // purple
      note: '#94a3b8',     // slate
      default: '#64748b',
    };

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-280))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Links render
    const link = container.append('g')
      .attr('stroke', '#334155')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1.5)
      .selectAll('line')
      .data(links)
      .join('line');

    // Drag behavior
    const drag = (sim: any) => {
      function dragstarted(event: any, d: any) {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      function dragged(event: any, d: any) {
        d.fx = event.x;
        d.fy = event.y;
      }
      function dragended(event: any, d: any) {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    };

    // Node groups
    const node = container.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(drag(simulation) as any)
      .on('click', (event, d: any) => {
        setSelectedEntity(d.entity);
      });

    // Outer glow for nodes
    node.append('circle')
      .attr('r', 18)
      .attr('fill', (d: any) => colorMap[d.type] || colorMap.default)
      .attr('fill-opacity', 0.2)
      .attr('stroke', (d: any) => colorMap[d.type] || colorMap.default)
      .attr('stroke-width', 2);

    // Inner core
    node.append('circle')
      .attr('r', 8)
      .attr('fill', (d: any) => colorMap[d.type] || colorMap.default);

    // Labels
    node.append('text')
      .text((d: any) => d.label.length > 20 ? d.label.substring(0, 18) + '…' : d.label)
      .attr('x', 22)
      .attr('y', 4)
      .attr('fill', '#f1f5f9')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .attr('pointer-events', 'none');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [currentCase.entities, activeSubView]);

  const handleDeleteEntity = (id: string) => {
    const updated = {
      ...currentCase,
      entities: currentCase.entities.filter(e => e.id !== id),
      updatedAt: new Date().toISOString(),
    };
    onUpdateCase(updated);
    if (selectedEntity?.id === id) setSelectedEntity(null);
  };

  const handleAddManualEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    const newEnt: InvestigationEntity = {
      id: `ent-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: newType,
      value: newValue.trim(),
      label: newLabel.trim() || newValue.trim(),
      timestamp: new Date().toISOString(),
      tags: [newType],
    };

    onUpdateCase({
      ...currentCase,
      entities: [...currentCase.entities, newEnt],
      updatedAt: new Date().toISOString(),
    });

    setNewValue('');
    setNewLabel('');
    setShowAddModal(false);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    const note: CaseNote = {
      id: `note-${Date.now()}`,
      timestamp: new Date().toISOString(),
      content: newNoteContent.trim(),
    };

    onUpdateCase({
      ...currentCase,
      notes: [...(currentCase.notes || []), note],
      updatedAt: new Date().toISOString(),
    });

    setNewNoteContent('');
  };

  const exportCaseJSON = () => {
    const blob = new Blob([JSON.stringify(currentCase, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OSINT_Case_${currentCase.title.replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
  };

  const exportCaseMarkdown = () => {
    let md = `# OSINT Investigation Dossier: ${currentCase.title}\n\n`;
    md += `**Case ID:** ${currentCase.id}\n`;
    md += `**Target:** ${currentCase.target}\n`;
    md += `**Created:** ${currentCase.createdAt}\n`;
    md += `**Last Modified:** ${currentCase.updatedAt}\n\n`;
    md += `## Description\n${currentCase.description || 'No description provided.'}\n\n`;

    md += `## Discovered Entities & Evidence (${currentCase.entities.length})\n\n`;
    md += `| Type | Value | Label | Metadata |\n`;
    md += `| :--- | :---- | :---- | :------- |\n`;
    currentCase.entities.forEach((ent) => {
      md += `| ${ent.type.toUpperCase()} | \`${ent.value}\` | ${ent.label} | ${JSON.stringify(ent.metadata || {})} |\n`;
    });

    md += `\n## Investigation Notes\n\n`;
    (currentCase.notes || []).forEach((note) => {
      md += `### ${new Date(note.timestamp).toLocaleString()}\n${note.content}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OSINT_Report_${currentCase.title.replace(/\s+/g, '_')}.md`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Dossier Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-slate-100">{currentCase.title}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Target Scope: <span className="text-cyan-300 font-semibold">{currentCase.target}</span> • {currentCase.entities.length} Evidence Entities • {(currentCase.notes || []).length} Notes
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Entity</span>
            </button>

            <button
              onClick={onSwitchToAiTab}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-cyan-600 hover:from-amber-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Analyze with AI Copilot</span>
            </button>

            <button
              onClick={exportCaseMarkdown}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700"
              title="Export Full Markdown Intelligence Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Report (.md)</span>
            </button>

            <button
              onClick={exportCaseJSON}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
              title="Export Case JSON"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sub-view switcher */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
          <button
            onClick={() => setActiveSubView('graph')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
              activeSubView === 'graph' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Interactive Entity Graph</span>
          </button>
          <button
            onClick={() => setActiveSubView('entities')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
              activeSubView === 'entities' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Evidence Inventory ({currentCase.entities.length})</span>
          </button>
          <button
            onClick={() => setActiveSubView('notes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
              activeSubView === 'notes' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Investigative Notes ({(currentCase.notes || []).length})</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {activeSubView === 'graph' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-2xl p-4 relative min-h-[460px] overflow-hidden flex flex-col justify-between">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 text-xs bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>D3 Force-Directed Evidence Map (Click nodes to inspect)</span>
            </div>

            <svg ref={svgRef} className="w-full h-[450px]" />

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="font-semibold text-slate-300">Legend:</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Username</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> Domain</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Subdomain</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> IP Address</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Email</span>
            </div>
          </div>

          {/* Node Inspector Sidebar */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Entity Inspector</h3>

            {selectedEntity ? (
              <div className="space-y-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-cyan-400 block mb-1">{selectedEntity.type}</span>
                  <p className="font-bold text-slate-100 break-all">{selectedEntity.label}</p>
                  <p className="text-slate-400 font-mono mt-1 break-all">{selectedEntity.value}</p>
                </div>

                {selectedEntity.metadata && Object.keys(selectedEntity.metadata).length > 0 && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px]">
                    <span className="text-slate-500 block uppercase">Metadata:</span>
                    {Object.entries(selectedEntity.metadata).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-1 text-slate-300">
                        <span className="text-slate-500">{k}:</span>
                        <span className="truncate max-w-[120px]">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => handleDeleteEntity(selectedEntity.id)}
                    className="w-full py-2 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove from Case</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-8 text-center">
                Click any node on the graph to inspect its details and pivots.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Inventory View */}
      {activeSubView === 'entities' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentCase.entities.map((entity) => (
              <div
                key={entity.id}
                className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800">
                      {entity.type}
                    </span>
                    <button
                      onClick={() => handleDeleteEntity(entity.id)}
                      className="text-slate-500 hover:text-red-400 p-1"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200 truncate">{entity.label}</h4>
                  <p className="text-xs text-slate-400 font-mono truncate">{entity.value}</p>
                </div>

                <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-900 flex justify-between items-center">
                  <span>{new Date(entity.timestamp).toLocaleDateString()}</span>
                  {entity.tags && (
                    <span className="font-mono text-cyan-500">{entity.tags.join(', ')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes View */}
      {activeSubView === 'notes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <form onSubmit={handleAddNote} className="space-y-2">
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Record investigative findings, hypothesis, pivot logs..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!newNoteContent.trim()}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Note</span>
            </button>
          </form>

          <div className="space-y-3 pt-3">
            {(currentCase.notes || []).map((note) => (
              <div key={note.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono text-slate-500 block">
                  {new Date(note.timestamp).toLocaleString()}
                </span>
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Add Entity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Add Evidence Entity</h3>

            <form onSubmit={handleAddManualEntity} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Entity Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="username">Username (@handle)</option>
                  <option value="domain">Root Domain (example.com)</option>
                  <option value="subdomain">Subdomain (api.example.com)</option>
                  <option value="ip">IP Address (1.1.1.1)</option>
                  <option value="email">Email Address</option>
                  <option value="note">Key Artifact / Hash / Phone</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Value</label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="e.g. target_admin or 192.168.1.1"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Label (Optional)</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Descriptive label"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold"
                >
                  Add to Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
