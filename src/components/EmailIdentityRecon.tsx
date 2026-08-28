import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  User, 
  Server, 
  ExternalLink, 
  PlusCircle, 
  RefreshCw, 
  Database,
  Lock
} from 'lucide-react';
import { InvestigationEntity } from '../types';

interface EmailIdentityReconProps {
  initialEmail?: string;
  onAddToCase: (entity: Omit<InvestigationEntity, 'id' | 'timestamp'>) => void;
}

export const EmailIdentityRecon: React.FC<EmailIdentityReconProps> = ({
  initialEmail = '',
  onAddToCase,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [emailData, setEmailData] = useState<any>(null);

  useEffect(() => {
    if (initialEmail && initialEmail !== email) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleRecon = async () => {
    if (!email.trim() || !email.includes('@')) return;
    setLoading(true);
    setEmailData(null);

    try {
      const res = await fetch('/api/osint/email-recon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      setEmailData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addEmailToCase = () => {
    if (!emailData) return;
    onAddToCase({
      type: 'email',
      value: emailData.email,
      label: `Email: ${emailData.email}`,
      category: 'Identity',
      metadata: {
        provider: emailData.infrastructure?.provider,
        hasGravatar: emailData.gravatar?.hasProfile,
      },
      tags: ['email', 'identity', emailData.domain],
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-slate-100">Email Reconnaissance & Identity Discovery</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Analyzes mail exchange (MX) infrastructure, Gravatar profile footprint, disposable domain classification, and direct breach query bridges.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@domain.com, security@target.org"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 font-mono"
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleRecon()}
            />
          </div>

          <button
            onClick={handleRecon}
            disabled={loading || !email.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-950"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Scanning Email...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Analyze Email</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {emailData && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                {emailData.gravatar?.avatarUrl ? (
                  <img
                    src={emailData.gravatar.avatarUrl}
                    alt="Avatar"
                    className="w-12 h-12 rounded-xl border border-purple-500/50 object-cover shadow"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-300">
                    <User className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="font-mono text-base font-bold text-slate-100">{emailData.email}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Local: <span className="text-purple-300">{emailData.username}</span> | Domain: <span className="text-cyan-300">{emailData.domain}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={addEmailToCase}
                className="px-3.5 py-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Email to Case Dossier</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1 mb-1">
                  <Server className="w-3.5 h-3.5 text-purple-400" />
                  <span>Mail Infrastructure</span>
                </span>
                <p className="text-sm font-bold text-slate-100">{emailData.infrastructure?.provider}</p>
                <span className={`text-[11px] px-2 py-0.5 rounded font-mono inline-block mt-2 ${
                  emailData.infrastructure?.hasMX ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                }`}>
                  {emailData.infrastructure?.hasMX ? '✓ Active MX Records' : '✗ No MX Configured'}
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1 mb-1">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span>Gravatar Global Avatar</span>
                </span>
                <p className="text-sm font-bold text-slate-100">
                  {emailData.gravatar?.hasProfile ? 'Profile & Avatar Found' : 'No Public Avatar'}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-1 truncate" title={emailData.gravatar?.hash}>
                  MD5: {emailData.gravatar?.hash}
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1 mb-1">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Disposable Domain Check</span>
                </span>
                <p className="text-sm font-bold text-slate-100">
                  {emailData.infrastructure?.isDisposable ? 'Disposable / Temp Mail' : 'Legitimate Corporate / ISP'}
                </p>
                <span className="text-[11px] text-slate-400 block mt-1">Verified against known temporary mail lists</span>
              </div>
            </div>
          </div>

          {/* Breach & Identity Search Bridges */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-purple-400" />
              <span>External OSINT & Data Breach Investigation Bridges:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <a
                href={emailData.breachSearchLinks?.hibp}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 text-xs font-medium text-slate-300 flex items-center justify-between transition-colors group"
              >
                <span className="group-hover:text-purple-300">Have I Been Pwned</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400" />
              </a>

              <a
                href={emailData.breachSearchLinks?.epieos}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 text-xs font-medium text-slate-300 flex items-center justify-between transition-colors group"
              >
                <span className="group-hover:text-purple-300">Epieos Google Search</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400" />
              </a>

              <a
                href={emailData.breachSearchLinks?.intelx}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 text-xs font-medium text-slate-300 flex items-center justify-between transition-colors group"
              >
                <span className="group-hover:text-purple-300">Intelligence X Search</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400" />
              </a>

              <a
                href={emailData.breachSearchLinks?.dehashed}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 text-xs font-medium text-slate-300 flex items-center justify-between transition-colors group"
              >
                <span className="group-hover:text-purple-300">DeHashed Index</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
