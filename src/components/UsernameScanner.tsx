import React, { useState, useEffect, useRef } from 'react';
import { 
  UserCheck, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Square, 
  Download, 
  PlusCircle, 
  Filter, 
  Github, 
  Layers, 
  Sparkles,
  RefreshCw,
  FolderGit2
} from 'lucide-react';
import { WMNTarget, InvestigationEntity } from '../types';
import { DEFAULT_WMN_TARGETS } from '../data/wmnSites';

interface CheckResult {
  name: string;
  category: string;
  url: string;
  exists: boolean;
  status: number;
  reason?: string;
  error?: string;
}

interface UsernameScannerProps {
  initialUsername?: string;
  onAddToCase: (entity: Omit<InvestigationEntity, 'id' | 'timestamp'>) => void;
  customTargets?: WMNTarget[];
  onOpenGitHubHub: () => void;
}

export const UsernameScanner: React.FC<UsernameScannerProps> = ({
  initialUsername = '',
  onAddToCase,
  customTargets = [],
  onOpenGitHubHub,
}) => {
  const [username, setUsername] = useState(initialUsername);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<'all' | 'found' | 'not_found'>('all');
  const [progress, setProgress] = useState(0);
  const [githubDetails, setGithubDetails] = useState<any>(null);
  const [githubLoading, setGithubLoading] = useState(false);

  const abortControllerRef = useRef<boolean>(false);

  useEffect(() => {
    if (initialUsername && initialUsername !== username) {
      setUsername(initialUsername);
    }
  }, [initialUsername]);

  const allTargets = [...DEFAULT_WMN_TARGETS, ...customTargets];
  
  // Categories available
  const categories = ['All', ...Array.from(new Set(allTargets.map(t => t.category)))];

  const handleStartScan = async () => {
    if (!username.trim()) return;
    setIsScanning(true);
    setResults([]);
    setProgress(0);
    setGithubDetails(null);
    abortControllerRef.current = false;

    // Filter targets by selected category if not "All"
    const targetsToScan = selectedCategory === 'All' 
      ? allTargets 
      : allTargets.filter(t => t.category === selectedCategory);

    // Concurrently fetch GitHub deep recon in parallel if github exists
    fetchGitHubRecon(username.trim());

    const total = targetsToScan.length;
    let completed = 0;
    const tempResults: CheckResult[] = [];

    // Worker pool for concurrency (6 concurrent requests)
    const concurrency = 6;
    const queue = [...targetsToScan];

    const worker = async () => {
      while (queue.length > 0 && !abortControllerRef.current) {
        const target = queue.shift();
        if (!target) break;

        try {
          const res = await fetch('/api/osint/username-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username.trim(), target }),
          });

          const data = await res.json();
          const result: CheckResult = {
            name: target.name,
            category: target.category,
            url: data.url || target.uri_check.replace(/\{account\}/g, username.trim()),
            exists: !!data.exists,
            status: data.status || 0,
            reason: data.reason,
            error: data.error,
          };

          tempResults.push(result);
          setResults([...tempResults]);
        } catch (err: any) {
          tempResults.push({
            name: target.name,
            category: target.category,
            url: target.uri_check.replace(/\{account\}/g, username.trim()),
            exists: false,
            status: 500,
            error: err.message,
          });
          setResults([...tempResults]);
        } finally {
          completed++;
          setProgress(Math.round((completed / total) * 100));
        }
      }
    };

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);
    setIsScanning(false);
  };

  const handleStopScan = () => {
    abortControllerRef.current = true;
    setIsScanning(false);
  };

  const fetchGitHubRecon = async (user: string) => {
    setGithubLoading(true);
    try {
      const resp = await fetch('/api/osint/github-recon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user }),
      });
      const data = await resp.json();
      if (data.success) {
        setGithubDetails(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGithubLoading(false);
    }
  };

  const foundCount = results.filter(r => r.exists).length;
  const filteredResults = results.filter(r => {
    if (filterStatus === 'found') return r.exists;
    if (filterStatus === 'not_found') return !r.exists;
    return true;
  });

  const exportJSON = () => {
    const dataStr = JSON.stringify({
      targetUsername: username,
      scanDate: new Date().toISOString(),
      foundCount,
      totalScanned: results.length,
      results: results.filter(r => r.exists),
    }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint_username_${username}_${Date.now()}.json`;
    a.click();
  };

  const exportCSV = () => {
    const headers = ['Platform', 'Category', 'Found', 'Status', 'Profile URL'];
    const rows = results.map(r => [
      `"${r.name}"`,
      `"${r.category}"`,
      r.exists ? 'YES' : 'NO',
      r.status,
      `"${r.url}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint_username_${username}_${Date.now()}.csv`;
    a.click();
  };

  const addAllFoundToCase = () => {
    const found = results.filter(r => r.exists);
    found.forEach(r => {
      onAddToCase({
        type: 'username',
        value: `${r.name}: ${username}`,
        label: `${r.name} Profile (@${username})`,
        category: r.category,
        metadata: { url: r.url, platform: r.name, statusCode: r.status },
        tags: ['username', r.name.toLowerCase(), r.category.toLowerCase()],
      });
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-slate-100">Multi-Platform Username Reconnaissance</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Checks digital footprint across <strong>{allTargets.length}</strong> top web platforms using WhatsMyName & Sherlock schemas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenGitHubHub}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-medium transition-colors"
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Import GitHub JSON Scripts</span>
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-3 text-slate-500 font-mono text-sm">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. torvalds, satoshi, johndoe"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-8 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 font-mono"
              onKeyDown={(e) => e.key === 'Enter' && !isScanning && handleStartScan()}
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={isScanning}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
              ))}
            </select>

            {!isScanning ? (
              <button
                onClick={handleStartScan}
                disabled={!username.trim()}
                className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-cyan-950"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Start Hunt</span>
              </button>
            ) : (
              <button
                onClick={handleStopScan}
                className="bg-red-500 hover:bg-red-400 text-white font-semibold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Stop</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Progress Bar */}
        {isScanning && (
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                Scanning targets ({results.length} / {selectedCategory === 'All' ? allTargets.length : allTargets.filter(t => t.category === selectedCategory).length})...
              </span>
              <span className="font-mono font-semibold text-cyan-400">{progress}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* GitHub Deep Profile Recon (if found) */}
      {githubDetails?.user && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Github className="w-4 h-4 text-cyan-400" />
              <span>GitHub Deep Intelligence Report</span>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              Live Profile Verified
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-5 items-start">
            <img
              src={githubDetails.user.avatarUrl}
              alt="Avatar"
              className="w-20 h-20 rounded-2xl border-2 border-slate-700 shadow-md object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 space-y-2 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-base font-bold text-slate-100">{githubDetails.user.name || githubDetails.user.login}</h3>
                <span className="text-slate-400 font-mono">@{githubDetails.user.login}</span>
                {githubDetails.user.location && (
                  <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded">📍 {githubDetails.user.location}</span>
                )}
                {githubDetails.user.company && (
                  <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded">🏢 {githubDetails.user.company}</span>
                )}
              </div>

              {githubDetails.user.bio && (
                <p className="text-slate-300 text-xs italic">{githubDetails.user.bio}</p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-slate-300 font-mono">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Public Repos</span>
                  <strong className="text-sm text-cyan-400">{githubDetails.user.publicRepos}</strong>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Followers</span>
                  <strong className="text-sm text-cyan-400">{githubDetails.user.followers}</strong>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Account Created</span>
                  <strong className="text-xs text-slate-200">{new Date(githubDetails.user.createdAt).toLocaleDateString()}</strong>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Blog / Link</span>
                  <span className="text-xs text-cyan-400 truncate block">
                    {githubDetails.user.blog ? (
                      <a href={githubDetails.user.blog.startsWith('http') ? githubDetails.user.blog : `https://${githubDetails.user.blog}`} target="_blank" rel="noreferrer" className="hover:underline">
                        {githubDetails.user.blog}
                      </a>
                    ) : 'None'}
                  </span>
                </div>
              </div>

              {/* Repos snippet */}
              {githubDetails.repos && githubDetails.repos.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Recent Public Repositories:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {githubDetails.repos.slice(0, 5).map((repo: any) => (
                      <a
                        key={repo.name}
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-cyan-300 flex items-center gap-1 transition-colors font-mono"
                      >
                        <span>{repo.name}</span>
                        {repo.language && <span className="text-slate-500">({repo.language})</span>}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Header & Filters */}
      {results.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-300">
              Total Scanned: <strong>{results.length}</strong>
            </span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
              {foundCount} Accounts Discovered
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter status */}
            <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${filterStatus === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'}`}
              >
                All ({results.length})
              </button>
              <button
                onClick={() => setFilterStatus('found')}
                className={`px-2.5 py-1 rounded-md transition-colors ${filterStatus === 'found' ? 'bg-emerald-950 text-emerald-300 font-medium' : 'text-slate-400'}`}
              >
                Found ({foundCount})
              </button>
              <button
                onClick={() => setFilterStatus('not_found')}
                className={`px-2.5 py-1 rounded-md transition-colors ${filterStatus === 'not_found' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'}`}
              >
                Not Found
              </button>
            </div>

            {/* Actions */}
            {foundCount > 0 && (
              <>
                <button
                  onClick={addAllFoundToCase}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Save All to Case</span>
                </button>
                <button
                  onClick={exportJSON}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
                  title="Export JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Results Grid */}
      {filteredResults.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredResults.map((r, idx) => (
            <div
              key={`${r.name}-${idx}`}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                r.exists
                  ? 'bg-slate-900/90 border-emerald-800/60 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-950/60 border-slate-800/80 opacity-70 hover:opacity-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {r.exists ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : r.error ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    )}
                    <span className="font-semibold text-sm text-slate-200">{r.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {r.category}
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-mono truncate mb-2" title={r.url}>
                  {r.url}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                <span className={`text-[11px] font-mono ${r.exists ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {r.exists ? `Found (${r.status})` : r.error ? 'Timeout/Error' : 'Not Found (404)'}
                </span>

                <div className="flex items-center gap-1.5">
                  {r.exists && (
                    <button
                      onClick={() => onAddToCase({
                        type: 'username',
                        value: `${r.name}: ${username}`,
                        label: `${r.name} (@${username})`,
                        category: r.category,
                        metadata: { url: r.url, platform: r.name },
                        tags: ['username', r.name.toLowerCase()],
                      })}
                      className="p-1 rounded hover:bg-slate-800 text-cyan-400 hover:text-cyan-300"
                      title="Add to Investigation Case"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  )}
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isScanning && results.length === 0 && (
          <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
            <UserCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">Ready to Scan Digital Footprints</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Enter a username above to cross-reference with our database of verified platforms across developer registries, social networks, and forums.
            </p>
          </div>
        )
      )}
    </div>
  );
};
