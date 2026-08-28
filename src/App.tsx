import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { BentoDashboardOverview } from './components/BentoDashboardOverview';
import { OmniSearch } from './components/OmniSearch';
import { UsernameScanner } from './components/UsernameScanner';
import { DomainDnsRecon } from './components/DomainDnsRecon';
import { IpNetworkIntel } from './components/IpNetworkIntel';
import { EmailIdentityRecon } from './components/EmailIdentityRecon';
import { WaybackExplorer } from './components/WaybackExplorer';
import { DorkBuilder } from './components/DorkBuilder';
import { OsintFrameworkCatalog } from './components/OsintFrameworkCatalog';
import { GitHubResearchHub } from './components/GitHubResearchHub';
import { CaseDossierGraph } from './components/CaseDossierGraph';
import { AiAnalystCopilot } from './components/AiAnalystCopilot';
import { InvestigationCase, InvestigationEntity, WMNTarget } from './types';
import { 
  ShieldCheck, 
  Terminal, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink,
  Plus,
  Briefcase,
  LayoutGrid,
  ChevronDown,
  Layers
} from 'lucide-react';

const STORAGE_KEY_CASES = 'osint_suite_cases_v1';
const STORAGE_KEY_CUSTOM_TARGETS = 'osint_suite_custom_targets_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [showBentoOverview, setShowBentoOverview] = useState<boolean>(true);
  
  // Custom WMN/Sherlock targets imported via GitHub hub
  const [customTargets, setCustomTargets] = useState<WMNTarget[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_TARGETS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active investigation cases
  const [cases, setCases] = useState<InvestigationCase[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CASES);
      if (saved) return JSON.parse(saved);
    } catch {}

    // Default starter case
    return [{
      id: 'case-nexus-01',
      title: 'Target Entity Initial Recon',
      target: 'example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: 'Initial reconnaissance case dossier collecting discovered usernames, domains, subdomains, IPs, and historical artifacts.',
      entities: [
        {
          id: 'ent-seed-1',
          type: 'domain',
          value: 'example.com',
          label: 'Primary Domain (example.com)',
          timestamp: new Date().toISOString(),
          tags: ['domain', 'target'],
        },
      ],
      notes: [],
    }];
  });

  const [activeCaseId, setActiveCaseId] = useState<string>(cases[0]?.id || 'case-nexus-01');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync cases to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(cases));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [cases]);

  // Sync custom targets
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_TARGETS, JSON.stringify(customTargets));
    } catch (e) {
      console.error('Custom targets storage error:', e);
    }
  }, [customTargets]);

  const activeCase = cases.find(c => c.id === activeCaseId) || cases[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddToCase = (entityData: Omit<InvestigationEntity, 'id' | 'timestamp'>) => {
    const newEntity: InvestigationEntity = {
      ...entityData,
      id: `ent-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
    };

    setCases((prevCases) =>
      prevCases.map((c) => {
        if (c.id === activeCaseId) {
          // Check for duplicate value
          const exists = c.entities.some(e => e.value.toLowerCase() === newEntity.value.toLowerCase());
          if (exists) {
            showToast(`Already in dossier: ${newEntity.label}`);
            return c;
          }
          showToast(`Added to active case: ${newEntity.label}`);
          return {
            ...c,
            entities: [...c.entities, newEntity],
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
  };

  const handleUpdateCase = (updated: InvestigationCase) => {
    setCases((prev) => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleCreateNewCase = () => {
    const targetName = prompt('Enter primary target name/domain for new case dossier:', 'target.org');
    if (!targetName) return;

    const newCase: InvestigationCase = {
      id: `case-${Date.now()}`,
      title: `Investigation: ${targetName}`,
      target: targetName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: `Active intelligence dossier for ${targetName}`,
      entities: [
        {
          id: `ent-${Date.now()}`,
          type: targetName.includes('@') ? 'email' : targetName.includes('.') ? 'domain' : 'username',
          value: targetName,
          label: `Primary Target: ${targetName}`,
          timestamp: new Date().toISOString(),
          tags: ['root', targetName],
        },
      ],
      notes: [],
    };

    setCases([newCase, ...cases]);
    setActiveCaseId(newCase.id);
    showToast(`Created new case: ${newCase.title}`);
  };

  const handleImportCustomTargets = (newTargets: WMNTarget[]) => {
    setCustomTargets((prev) => {
      const existingNames = new Set(prev.map(t => t.name.toLowerCase()));
      const filtered = newTargets.filter(t => !existingNames.has(t.name.toLowerCase()));
      return [...prev, ...filtered];
    });
    showToast(`Successfully added ${newTargets.length} target schemas!`);
  };

  const handleOmniSearch = (query: string, detectedType: 'username' | 'domain' | 'ip' | 'email') => {
    setCurrentQuery(query);
  };

  const handleExecuteGlobalRecon = (targetQuery: string) => {
    setCurrentQuery(targetQuery);
    if (targetQuery.includes('.') && !targetQuery.includes('@')) {
      setActiveTab('domain');
    } else if (targetQuery.includes('@')) {
      setActiveTab('email');
    } else {
      setActiveTab('scanner');
    }
    showToast(`Initiating recon pipeline on: ${targetQuery}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Bento Header & Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        caseEntityCount={activeCase?.entities?.length || 0}
        onQuickSearch={(q) => handleOmniSearch(q, q.includes('@') ? 'email' : q.includes('.') ? 'domain' : 'username')}
      />

      {/* Main Workbench Layout Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Bento Top Control Strip & Case Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-slate-900/70 p-3.5 sm:px-4 rounded-xl border border-slate-800 shadow-md text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider">Active Dossier:</span>
              <select
                value={activeCaseId}
                onChange={(e) => setActiveCaseId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 font-mono font-semibold rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.entities.length} items)
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-600 hidden sm:inline">|</span>

            <div className="text-[11px] font-mono text-slate-400 hidden md:flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>Root Target: <strong className="text-cyan-300">{activeCase.target}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBentoOverview(!showBentoOverview)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 border transition-all ${
                showBentoOverview 
                  ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
              }`}
              title="Toggle Bento Telemetry Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Bento Grid Control</span>
            </button>

            <button
              onClick={handleCreateNewCase}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium flex items-center gap-1 transition-colors text-xs font-mono"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Dossier</span>
            </button>
          </div>
        </div>

        {/* Bento Grid Executive Telemetry Deck */}
        {showBentoOverview && (
          <BentoDashboardOverview
            currentCase={activeCase}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onExecuteGlobalRecon={handleExecuteGlobalRecon}
            onAddToCase={handleAddToCase}
          />
        )}

        {/* Global OmniSearch Bar */}
        <OmniSearch onSearch={handleOmniSearch} setActiveTab={setActiveTab} />

        {/* Dynamic Tab Views Styled within Bento Grid Frames */}
        <div className="mt-6">
          {activeTab === 'scanner' && (
            <UsernameScanner
              initialUsername={currentQuery}
              onAddToCase={handleAddToCase}
              customTargets={customTargets}
              onOpenGitHubHub={() => setActiveTab('github')}
            />
          )}

          {activeTab === 'domain' && (
            <DomainDnsRecon
              initialDomain={currentQuery}
              onAddToCase={handleAddToCase}
            />
          )}

          {activeTab === 'ip' && (
            <IpNetworkIntel
              initialIp={currentQuery}
              onAddToCase={handleAddToCase}
            />
          )}

          {activeTab === 'email' && (
            <EmailIdentityRecon
              initialEmail={currentQuery}
              onAddToCase={handleAddToCase}
            />
          )}

          {activeTab === 'wayback' && (
            <WaybackExplorer
              initialUrl={currentQuery}
              onAddToCase={handleAddToCase}
            />
          )}

          {activeTab === 'dorks' && (
            <DorkBuilder
              initialTarget={currentQuery || activeCase.target}
              onAddToCase={handleAddToCase}
            />
          )}

          {activeTab === 'catalog' && (
            <OsintFrameworkCatalog onAddToCase={handleAddToCase} />
          )}

          {activeTab === 'github' && (
            <GitHubResearchHub
              onImportCustomTargets={handleImportCustomTargets}
              importedCount={customTargets.length}
            />
          )}

          {activeTab === 'case' && (
            <CaseDossierGraph
              currentCase={activeCase}
              onUpdateCase={handleUpdateCase}
              onSwitchToAiTab={() => setActiveTab('ai')}
            />
          )}

          {activeTab === 'ai' && (
            <AiAnalystCopilot
              currentCase={activeCase}
              onAddToCase={handleAddToCase}
            />
          )}
        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-cyan-500/80 text-cyan-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-mono backdrop-blur animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Bento Telemetry Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-5 mt-12 text-[10px] text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <span className="text-slate-400">LATENCY: 14ms</span>
            <span className="text-slate-400">ENC: TLS 1.3 / AES-256</span>
            <span className="text-slate-400">USER: SecOps-Analyst</span>
            <span className="text-emerald-400 font-semibold">STATUS: SYSTEMS OPERATIONAL</span>
          </div>
          <div className="text-slate-400 uppercase tracking-wider">
            MADE FOR INDEPENDENT RESEARCH &amp; ANALYTICS • OSINT_NEXUS
          </div>
        </div>
      </footer>
    </div>
  );
}
