import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Server, 
  Layers, 
  PlusCircle, 
  ExternalLink, 
  Download, 
  RefreshCw, 
  FileText,
  Calendar,
  Lock,
  Mail
} from 'lucide-react';
import { InvestigationEntity } from '../types';

interface DomainDnsReconProps {
  initialDomain?: string;
  onAddToCase: (entity: Omit<InvestigationEntity, 'id' | 'timestamp'>) => void;
}

export const DomainDnsRecon: React.FC<DomainDnsReconProps> = ({
  initialDomain = '',
  onAddToCase,
}) => {
  const [domain, setDomain] = useState(initialDomain);
  const [loading, setLoading] = useState(false);
  const [dnsData, setDnsData] = useState<any>(null);
  const [subdomainsData, setSubdomainsData] = useState<any>(null);
  const [rdapData, setRdapData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dns' | 'subdomains' | 'rdap' | 'security'>('dns');

  useEffect(() => {
    if (initialDomain && initialDomain !== domain) {
      setDomain(initialDomain);
    }
  }, [initialDomain]);

  const handleRunRecon = async () => {
    if (!domain.trim()) return;
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
    setLoading(true);
    setDnsData(null);
    setSubdomainsData(null);
    setRdapData(null);

    try {
      // Run DoH DNS, crt.sh Subdomains, and RDAP queries in parallel
      const [dnsRes, subRes, rdapRes] = await Promise.all([
        fetch('/api/osint/dns-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: cleanDomain }),
        }).then(r => r.json()).catch(() => null),
        
        fetch('/api/osint/subdomains', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: cleanDomain }),
        }).then(r => r.json()).catch(() => null),

        fetch('/api/osint/rdap-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: cleanDomain }),
        }).then(r => r.json()).catch(() => null),
      ]);

      setDnsData(dnsRes);
      setSubdomainsData(subRes);
      setRdapData(rdapRes);
    } catch (err) {
      console.error('Domain recon error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addDomainToCase = () => {
    if (!domain) return;
    onAddToCase({
      type: 'domain',
      value: domain,
      label: `Domain: ${domain}`,
      metadata: {
        registrar: rdapData?.data?.registrar,
        nameservers: rdapData?.data?.nameservers,
        subdomainsCount: subdomainsData?.totalFound || 0,
      },
      tags: ['domain', 'infrastructure', domain.split('.')[0]],
    });
  };

  const addSubdomainToCase = (sub: string) => {
    onAddToCase({
      type: 'subdomain',
      value: sub,
      label: `Subdomain: ${sub}`,
      metadata: { rootDomain: domain },
      tags: ['subdomain', domain],
    });
  };

  const exportSubdomains = () => {
    if (!subdomainsData?.subdomains) return;
    const blob = new Blob([subdomainsData.subdomains.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${domain}_subdomains.txt`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header & Input */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-slate-100">Domain, DNS & Certificate Reconnaissance</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live DNS-over-HTTPS queries, Certificate Transparency log mining (crt.sh), RDAP/WHOIS registry data, and email security headers.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. cloudflare.com, github.com, target.org"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 font-mono"
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleRunRecon()}
            />
          </div>

          <button
            onClick={handleRunRecon}
            disabled={loading || !domain.trim()}
            className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold px-6 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-950"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Querying DoH & CT Logs...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Recon Domain</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {(dnsData || subdomainsData || rdapData) && (
        <div className="space-y-4">
          {/* Quick Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono text-sm">
                <Globe className="w-4 h-4 text-cyan-400" />
                {dnsData?.domain || domain}
              </span>
              {rdapData?.data?.registrar && (
                <span className="text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                  Registrar: <strong>{rdapData.data.registrar}</strong>
                </span>
              )}
              {subdomainsData?.totalFound !== undefined && (
                <span className="text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-md border border-cyan-800">
                  Subdomains Found: <strong>{subdomainsData.totalFound}</strong>
                </span>
              )}
            </div>

            <button
              onClick={addDomainToCase}
              className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Target Domain to Case</span>
            </button>
          </div>

          {/* Sub-Tabs */}
          <div className="flex space-x-2 border-b border-slate-800 pb-2">
            {[
              { id: 'dns', label: 'DNS Records', icon: Server, count: Object.values(dnsData?.records || {}).flat().length },
              { id: 'subdomains', label: 'Certificate Subdomains (crt.sh)', icon: Layers, count: subdomainsData?.totalFound },
              { id: 'rdap', label: 'WHOIS / RDAP Registry', icon: Calendar },
              { id: 'security', label: 'Email & DNSSEC Security', icon: Lock },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === t.id
                      ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                  {typeof t.count === 'number' && (
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-[10px] text-cyan-300 font-mono">
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab 1: DNS Records */}
          {activeTab === 'dns' && dnsData?.records && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(dnsData.records).map(([type, answers]: [string, any]) => (
                  <div key={type} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5">
                      <span className="text-xs font-bold text-cyan-400 font-mono">{type} Records</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                        {answers.length} entry{answers.length !== 1 ? 'ies' : ''}
                      </span>
                    </div>

                    {answers.length > 0 ? (
                      <div className="space-y-1.5 font-mono text-xs max-h-44 overflow-y-auto pr-1">
                        {answers.map((ans: any, i: number) => (
                          <div key={i} className="p-1.5 rounded bg-slate-900/60 text-slate-300 break-all flex items-start justify-between gap-2">
                            <span>{ans.data}</span>
                            {ans.TTL && <span className="text-[10px] text-slate-500 whitespace-nowrap">TTL: {ans.TTL}s</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No {type} records resolved.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Certificate Subdomains */}
          {activeTab === 'subdomains' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Discovered Hostnames via CT Logs</h3>
                  <p className="text-xs text-slate-400">Extracted from public SSL/TLS Certificate Transparency logs without alerting the target.</p>
                </div>

                {subdomainsData?.subdomains?.length > 0 && (
                  <button
                    onClick={exportSubdomains}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Subdomains (.txt)</span>
                  </button>
                )}
              </div>

              {subdomainsData?.subdomains && subdomainsData.subdomains.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {subdomainsData.subdomains.map((sub: string, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs font-mono group hover:border-cyan-500/40 transition-colors"
                    >
                      <span className="text-slate-300 truncate" title={sub}>{sub}</span>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => addSubdomainToCase(sub)}
                          className="p-1 rounded hover:bg-slate-800 text-cyan-400"
                          title="Add to Case Dossier"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`https://${sub}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                          title="Open Subdomain"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-6 text-center">No subdomains discovered in CT logs for this domain.</p>
              )}
            </div>
          )}

          {/* Tab 3: RDAP / WHOIS */}
          {activeTab === 'rdap' && rdapData && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Registrar</span>
                  <p className="text-sm font-bold text-slate-100">{rdapData.data?.registrar || 'Unknown'}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Created Date</span>
                  <p className="text-sm font-semibold text-slate-200 font-mono">{rdapData.data?.registrationDate || 'Unknown'}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Expiration Date</span>
                  <p className="text-sm font-semibold text-slate-200 font-mono">{rdapData.data?.expirationDate || 'Unknown'}</p>
                </div>
              </div>

              {rdapData.data?.nameservers && rdapData.data.nameservers.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 block mb-2 font-mono">Authoritative Name Servers:</span>
                  <div className="flex flex-wrap gap-2">
                    {rdapData.data.nameservers.map((ns: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded bg-slate-900 text-xs text-cyan-300 font-mono border border-slate-800">
                        {ns}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {rdapData.data?.status && rdapData.data.status.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 block mb-2">Domain Status Flags (EPP Codes):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {rdapData.data.status.map((st: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-900 text-[11px] text-slate-400 font-mono border border-slate-800">
                        {st}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Security Posture */}
          {activeTab === 'security' && dnsData?.security && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">Email & Authentication Security Posture</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                  {dnsData.security.hasSPF ? (
                    <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 text-red-400 flex-shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Sender Policy Framework (SPF)</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {dnsData.security.hasSPF 
                        ? 'Valid SPF record detected in TXT entries preventing email spoofing.' 
                        : 'No SPF record found. Domain may be vulnerable to email spoofing.'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                  {dnsData.security.hasDMARC ? (
                    <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 text-amber-400 flex-shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">DMARC Policy (_dmarc TXT)</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {dnsData.security.hasDMARC 
                        ? `DMARC record active: ${dnsData.security.dmarcRecord}` 
                        : 'No DMARC policy configured on _dmarc subdomain.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
