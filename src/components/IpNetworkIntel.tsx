import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Search, 
  MapPin, 
  Server, 
  ShieldAlert, 
  PlusCircle, 
  ExternalLink, 
  RefreshCw, 
  Cpu, 
  Activity,
  Globe2
} from 'lucide-react';
import { InvestigationEntity } from '../types';

interface IpNetworkIntelProps {
  initialIp?: string;
  onAddToCase: (entity: Omit<InvestigationEntity, 'id' | 'timestamp'>) => void;
}

export const IpNetworkIntel: React.FC<IpNetworkIntelProps> = ({
  initialIp = '',
  onAddToCase,
}) => {
  const [ip, setIp] = useState(initialIp);
  const [loading, setLoading] = useState(false);
  const [ipData, setIpData] = useState<any>(null);

  useEffect(() => {
    if (initialIp && initialIp !== ip) {
      setIp(initialIp);
    }
  }, [initialIp]);

  const handleLookup = async () => {
    if (!ip.trim()) return;
    setLoading(true);
    setIpData(null);

    try {
      const res = await fetch('/api/osint/ip-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: ip.trim() }),
      });
      const data = await res.json();
      setIpData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addIpToCase = () => {
    if (!ipData?.data) return;
    onAddToCase({
      type: 'ip',
      value: ip.trim(),
      label: `IP: ${ip.trim()} (${ipData.data.asname || ipData.data.org || 'Host'})`,
      category: 'Network',
      metadata: {
        location: `${ipData.data.city}, ${ipData.data.country}`,
        asn: ipData.data.as,
        isp: ipData.data.isp,
        reverseDns: ipData.data.reverseDns,
      },
      tags: ['ip', 'network', ipData.data.countryCode?.toLowerCase() || 'geo'],
    });
  };

  const quickEngines = [
    { name: 'Shodan Host Scan', url: `https://www.shodan.io/host/${ip.trim()}` },
    { name: 'Censys Host View', url: `https://search.censys.io/hosts/${ip.trim()}` },
    { name: 'GreyNoise Visualizer', url: `https://viz.greynoise.io/ip/${ip.trim()}` },
    { name: 'AbuseIPDB Reputation', url: `https://www.abuseipdb.com/check/${ip.trim()}` },
    { name: 'BGPView Prefix Routing', url: `https://bgpview.io/ip/${ip.trim()}` },
    { name: 'IPinfo Deep Profile', url: `https://ipinfo.io/${ip.trim()}` },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <Network className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-slate-100">IP Geolocation, ASN & Network Intelligence</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Query IP addresses for Autonomous System Numbers (ASN), ISP carrier, reverse DNS PTR, hosting tags, and threat feeds.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Network className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="e.g. 1.1.1.1, 8.8.8.8, 140.82.121.4"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-mono"
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleLookup()}
            />
          </div>

          <button
            onClick={handleLookup}
            disabled={loading || !ip.trim()}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold px-6 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Locating IP...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Query IP Intel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {ipData?.success && ipData.data && (
        <div className="space-y-4">
          {/* Main Info Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-slate-100">{ipData.ip}</span>
                  {ipData.data.countryCode && (
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                      {ipData.data.countryCode} ({ipData.data.country})
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{ipData.data.reverseDns || 'No reverse DNS PTR'}</p>
              </div>

              <button
                onClick={addIpToCase}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Save IP to Case Dossier</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Physical Location</span>
                </span>
                <p className="text-sm font-bold text-slate-100">{ipData.data.city || 'Unknown City'}, {ipData.data.region}</p>
                <p className="text-xs text-slate-400 font-mono mt-1">Lat: {ipData.data.lat}, Lon: {ipData.data.lon}</p>
                <span className="text-[11px] text-slate-500 block mt-1">TZ: {ipData.data.timezone}</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1 mb-1">
                  <Server className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ISP & Carrier</span>
                </span>
                <p className="text-sm font-bold text-slate-100 truncate" title={ipData.data.isp}>{ipData.data.isp}</p>
                <p className="text-xs text-slate-400 truncate mt-1">Org: {ipData.data.org}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1 mb-1">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Autonomous System (ASN)</span>
                </span>
                <p className="text-sm font-bold text-emerald-400 font-mono">{ipData.data.as || 'Unknown'}</p>
                <p className="text-xs text-slate-400 mt-1 font-mono truncate">{ipData.data.asname}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1 mb-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Infrastructure Type</span>
                </span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded font-mono ${ipData.data.isHosting ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-900 text-slate-400'}`}>
                    {ipData.data.isHosting ? 'Datacenter / Hosting' : 'Residential / Enterprise'}
                  </span>
                  {ipData.data.isProxy && (
                    <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-red-950 text-red-300 border border-red-800">
                      VPN / Proxy
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick External Deep Dive Search Links */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
              <Globe2 className="w-4 h-4 text-emerald-400" />
              <span>One-Click External OSINT Scanner Pivots for {ipData.ip}:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {quickEngines.map((engine, idx) => (
                <a
                  key={idx}
                  href={engine.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-xs font-medium text-slate-300 flex items-center justify-between transition-colors group"
                >
                  <span className="group-hover:text-emerald-300">{engine.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
