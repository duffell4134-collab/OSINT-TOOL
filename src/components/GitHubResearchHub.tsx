import React, { useState } from 'react';
import { 
  FolderGit2, 
  Search, 
  ExternalLink, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Github, 
  Star, 
  FileCode, 
  Layers, 
  Code2,
  Sparkles,
  ArrowRight,
  Database
} from 'lucide-react';
import { POPULAR_OSINT_JSON_REPOS, OSINTRepoInfo } from '../data/githubReposData';
import { WMNTarget } from '../types';

interface GitHubResearchHubProps {
  onImportCustomTargets: (targets: WMNTarget[]) => void;
  importedCount: number;
}

export const GitHubResearchHub: React.FC<GitHubResearchHubProps> = ({
  onImportCustomTargets,
  importedCount,
}) => {
  const [customUrl, setCustomUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [jsonPreview, setJsonPreview] = useState<any>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [activeRepo, setActiveRepo] = useState<OSINTRepoInfo | null>(POPULAR_OSINT_JSON_REPOS[0]);

  const handleFetchUrl = async (urlToFetch: string) => {
    if (!urlToFetch.trim()) return;
    setFetching(true);
    setImportStatus(null);
    setJsonPreview(null);

    try {
      const resp = await fetch('/api/osint/fetch-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToFetch.trim() }),
      });
      const data = await resp.json();

      if (data.success && data.data) {
        setJsonPreview(data.data);
        setImportStatus(`Successfully retrieved JSON dataset (${Array.isArray(data.data.sites) ? `${data.data.sites.length} sites in dataset` : typeof data.data === 'object' ? `${Object.keys(data.data).length} root keys` : 'Valid JSON'})`);
      } else {
        setImportStatus(`Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      setImportStatus(`Error: ${e.message}`);
    } finally {
      setFetching(false);
    }
  };

  const handleImportIntoScanner = (parsedData: any) => {
    if (!parsedData) return;

    let targetsToImport: WMNTarget[] = [];

    // Check if WhatsMyName format: { sites: [ { name, uri_check, e_code, m_code, ... } ] }
    if (parsedData.sites && Array.isArray(parsedData.sites)) {
      targetsToImport = parsedData.sites.map((s: any) => ({
        name: s.name,
        category: s.category || 'Imported',
        uri_check: s.uri_check,
        uri_pretty: s.uri_pretty || s.uri_check,
        e_code: s.e_code || 200,
        m_code: s.m_code || 404,
        e_string: s.e_string,
        m_string: s.m_string,
        known_accounts: s.known_accounts,
      }));
    }
    // Check if Sherlock format: { "SiteName": { "errorType": "...", "url": "..." } }
    else if (typeof parsedData === 'object' && !Array.isArray(parsedData)) {
      Object.entries(parsedData).forEach(([siteName, cfg]: [string, any]) => {
        if (cfg && cfg.url) {
          targetsToImport.push({
            name: siteName,
            category: 'Sherlock Import',
            uri_check: cfg.url,
            uri_pretty: cfg.urlMain || cfg.url,
            e_code: 200,
            m_code: cfg.errorType === 'status_code' ? 404 : undefined,
            m_string: cfg.errorMsg,
            known_accounts: cfg.username_claimed ? [cfg.username_claimed] : undefined,
          });
        }
      });
    }

    if (targetsToImport.length > 0) {
      onImportCustomTargets(targetsToImport);
      setImportStatus(`Success! Imported ${targetsToImport.length} target schemas into Username Hunter.`);
    } else {
      setImportStatus('Could not automatically parse target schemas from this JSON structure.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setJsonPreview(parsed);
        setImportStatus(`Loaded local JSON file: ${file.name}`);
      } catch (err: any) {
        setImportStatus(`Invalid JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-slate-100">Free OSINT GitHub Research & JSON Script Hub</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Research community-maintained OSINT datasets, inspect live JSON schemas on GitHub, and dynamically import targets into your local scanner.
            </p>
          </div>

          {importedCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-semibold">
              {importedCount} Custom Targets Active
            </span>
          )}
        </div>
      </div>

      {/* Top Repositories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1">
            Top Open-Source OSINT Repositories
          </h3>

          <div className="space-y-2">
            {POPULAR_OSINT_JSON_REPOS.map((repo) => {
              const isSelected = activeRepo?.repo === repo.repo;
              return (
                <div
                  key={repo.repo}
                  onClick={() => {
                    setActiveRepo(repo);
                    setCustomUrl(repo.jsonEndpoint);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500/50 shadow-md'
                      : 'bg-slate-900 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-100">{repo.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-amber-400 font-mono flex items-center gap-1 border border-slate-800">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {repo.starsApprox}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 font-mono mb-2">{repo.repo}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-mono border border-cyan-900/50">
                    {repo.jsonType}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Repo Details & Live Fetcher */}
        <div className="lg:col-span-2 space-y-5">
          {activeRepo && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-100">{activeRepo.name}</h3>
                  <p className="text-xs text-slate-400">Created by {activeRepo.author}</p>
                </div>

                <a
                  href={activeRepo.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                >
                  <Github className="w-4 h-4" />
                  <span>View Repository</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{activeRepo.description}</p>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Key Capabilities:</span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {activeRepo.keyFeatures.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Raw JSON Endpoint:</span>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2 font-mono text-xs text-cyan-300">
                  <span className="truncate">{activeRepo.jsonEndpoint}</span>
                  <button
                    onClick={() => handleFetchUrl(activeRepo.jsonEndpoint)}
                    disabled={fetching}
                    className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs whitespace-nowrap flex items-center gap-1"
                  >
                    {fetching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Fetch & Preview</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Custom URL or File Upload */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Custom GitHub Raw JSON URL or Local Upload
            </h4>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://raw.githubusercontent.com/.../wmn-data.json"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleFetchUrl(customUrl)}
                disabled={fetching || !customUrl.trim()}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-1.5"
              >
                {fetching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Fetch JSON</span>
              </button>

              <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload .json</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {importStatus && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-cyan-300 font-mono">
                {importStatus}
              </div>
            )}

            {/* JSON Schema Preview & Import Action */}
            {jsonPreview && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Live JSON Inspector Preview</span>
                  <button
                    onClick={() => handleImportIntoScanner(jsonPreview)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Apply / Inject Targets into Username Hunter</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-64 overflow-y-auto font-mono text-[11px] text-slate-300">
                  <pre>{JSON.stringify(jsonPreview, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
