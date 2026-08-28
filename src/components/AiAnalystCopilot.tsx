import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  RefreshCw, 
  ShieldAlert, 
  Compass, 
  CheckCircle2, 
  Copy, 
  Check, 
  Briefcase, 
  FileText,
  AlertTriangle
} from 'lucide-react';
import { InvestigationCase, InvestigationEntity } from '../types';

interface AiAnalystCopilotProps {
  currentCase: InvestigationCase;
  onAddToCase: (entity: Omit<InvestigationEntity, 'id' | 'timestamp'>) => void;
}

export const AiAnalystCopilot: React.FC<AiAnalystCopilotProps> = ({
  currentCase,
  onAddToCase,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunAiAnalysis = async (customInstruction?: string) => {
    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    const userPrompt = customInstruction || prompt || `Perform a comprehensive threat and intelligence analysis on target ${currentCase.target}.`;

    try {
      const resp = await fetch('/api/osint/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseData: currentCase,
          prompt: userPrompt,
        }),
      });

      const data = await resp.json();
      if (data.success && data.analysis) {
        setAnalysisResult(data.analysis);
      } else {
        setError(data.error || 'Failed to complete AI OSINT analysis.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error communicating with AI Copilot.');
    } finally {
      setLoading(false);
    }
  };

  const copyAnalysis = () => {
    if (!analysisResult) return;
    const text = typeof analysisResult === 'string' ? analysisResult : JSON.stringify(analysisResult, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveAiBriefingToCaseNotes = () => {
    if (!analysisResult) return;
    const content = typeof analysisResult === 'string' 
      ? analysisResult 
      : `### AI Executive Summary\n${analysisResult.executiveSummary || ''}\n\n### Pivots\n${(analysisResult.pivotVectors || []).join('\n')}`;
    
    onAddToCase({
      type: 'note',
      value: content.substring(0, 100) + '...',
      label: `AI Intelligence Briefing (${new Date().toLocaleDateString()})`,
      metadata: { aiGenerated: true },
      tags: ['ai_briefing', 'threat_intel'],
    });
  };

  const quickPrompts = [
    { label: 'Generate Full Dossier Synthesis', text: 'Generate an executive intelligence assessment summarizing all discovered entities, risk score, and correlation paths.' },
    { label: 'Identify Blind Spots & Pivots', text: 'Analyze our collected evidence and suggest 5 high-impact next pivot vectors and specific verification steps.' },
    { label: 'Generate Target-Specific Dorks', text: 'Based on the target scope and discovered domains/usernames, craft 8 customized precision Google and GitHub dorks.' },
    { label: 'OPSEC & Anonymity Audit', text: 'Provide an OPSEC checklist for investigating this specific target without triggering detection.' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-slate-100">AI Intelligence & Correlation Copilot</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Powered by Gemini 2.5 Flash to automatically correlate evidence in your active case, uncover hidden links, and recommend tactical pivots.
            </p>
          </div>

          <div className="text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 font-mono">
            Active Target: <span className="text-cyan-400 font-bold">{currentCase.target}</span> ({currentCase.entities.length} items)
          </div>
        </div>

        {/* Quick Strategy Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(qp.text);
                handleRunAiAnalysis(qp.text);
              }}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left text-xs text-slate-300 flex items-center justify-between transition-colors group"
            >
              <span className="font-semibold group-hover:text-cyan-300">{qp.label}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Custom Prompt Input */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask AI Analyst custom investigative questions regarding the evidence..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleRunAiAnalysis()}
          />
          <button
            onClick={() => handleRunAiAnalysis()}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Send className="w-4 h-4" />}
            <span>Analyze</span>
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-xs text-red-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Analysis Output Section */}
      {analysisResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100">AI Intelligence Assessment & Strategic Vectors</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={saveAiBriefingToCaseNotes}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Save to Case Notes</span>
              </button>
              <button
                onClick={copyAnalysis}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {typeof analysisResult === 'object' ? (
            <div className="space-y-6">
              {/* Executive Summary */}
              {analysisResult.executiveSummary && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">Executive Summary</span>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{analysisResult.executiveSummary}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Key Findings */}
                {analysisResult.keyFindings && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Key Discoveries & Correlations</span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {analysisResult.keyFindings.map((finding: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Pivot Vectors */}
                {analysisResult.pivotVectors && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Recommended Pivot Vectors</span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {analysisResult.pivotVectors.map((pivot: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <Compass className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{pivot}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recommended Dorks */}
              {analysisResult.recommendedDorks && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">Tailored Target Dorks</span>
                  <div className="space-y-1.5 font-mono text-xs text-cyan-300">
                    {analysisResult.recommendedDorks.map((dork: string, i: number) => (
                      <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800 break-all">
                        {dork}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OPSEC Guidance */}
              {analysisResult.opsecGuidance && (
                <div className="bg-slate-950 p-4 rounded-xl border border-amber-900/40 text-xs space-y-1">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">OPSEC & Risk Advisory</span>
                  <p className="text-slate-300 leading-relaxed">{analysisResult.opsecGuidance}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
              {analysisResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
