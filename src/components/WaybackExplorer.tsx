import React, { useState } from 'react';
import { History, Search, ExternalLink, PlusCircle, RefreshCw, Calendar, FileText, Filter } from 'lucide-react';
import { InvestigationEntity } from '../types';

interface WaybackExplorerProps {
  initialUrl?: string;
  onAddToCase: (entity: Omit<InvestigationEntity, 'id' | 'timestamp'>) => void;
}

export const WaybackExplorer: React.FC<WaybackExplorerProps> = ({
  initialUrl = '',
  onAddToCase,
}) => {
  const [targetUrl, setTargetUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [archiveData, setArchiveData] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleSearch = async () => {
    if (!targetUrl.trim()) return;
    setLoading(true);
    setArchiveData(null);

    try {
      const res = await fetch('/api/osint/wayback-snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });
      const data = await res.json();
      setArchiveData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (ts: string) => {
    if (!ts || ts.length < 8) return ts;
    const year = ts.substring(0, 4);
    const month = ts.substring(4, 6);
    const day = ts.substring(6, 8);
    const hour = ts.length >= 10 ? ts.substring(8, 10) : '00';
    const min = ts.length >= 12 ? ts.substring(10, 12) : '00';
    return `${year}-${month}-${day} ${hour}:${min} UTC`;
  };

  const filteredSnapshots = (archiveData?.snapshots || []).filter((s: any) => {
    if (statusFilter === '200') return s.statusCode === '200';
    if (statusFilter === 'redirect') return s.statusCode.startsWith('3');
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <History className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-slate-100">Wayback Machine Historical CDX Archive</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Directly queries the Internet Archive CDX index to reconstruct past iterations, deleted pages, and historical document artifacts.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <History className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="e.g. example.com, target.org/team, blog.company.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-mono"
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleSearch()}
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || !targetUrl.trim()}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold px-6 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-950"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Querying Archive...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search Archives</span>
              </>
            )}
          </button>
        </div>
      </div>

      {archiveData && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-200 font-mono">
                {archiveData.url}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                {archiveData.total} Historic Snapshots Found
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300"
              >
                <option value="all">All Status Codes</option>
                <option value="200">200 OK Only</option>
                <option value="redirect">3xx Redirects</option>
              </select>
            </div>
          </div>

          {filteredSnapshots.length > 0 ? (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {filteredSnapshots.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatTimestamp(item.timestamp)}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                        item.statusCode === '200' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                      }`}>
                        HTTP {item.statusCode}
                      </span>
                      <span className="text-slate-500 text-[11px]">{item.mimeType}</span>
                    </div>
                    <p className="text-slate-300 truncate max-w-xl" title={item.originalUrl}>
                      {item.originalUrl}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAddToCase({
                        type: 'note',
                        value: item.archiveUrl,
                        label: `Wayback Snapshot: ${formatTimestamp(item.timestamp)}`,
                        metadata: { originalUrl: item.originalUrl, timestamp: item.timestamp },
                        tags: ['archive', 'wayback', targetUrl],
                      })}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add to Case</span>
                    </button>

                    <a
                      href={item.archiveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>Open Snapshot</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-6">No snapshots match the selected filter.</p>
          )}
        </div>
      )}
    </div>
  );
};
