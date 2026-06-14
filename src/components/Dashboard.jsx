import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Calendar, Brain, ShieldAlert, Flag, Download, Search, AlertTriangle } from 'lucide-react';
import BankOfIndiaLogo from './BankOfIndiaLogo';
import CsvUploader from './CsvUploader';
import AuditHistory from './AuditHistory';
import RiskGauge from './RiskGauge';
import FeatureImportance from './FeatureImportance';
import SummaryCard from './SummaryCard';

const API_BASE = 'http://localhost:8000';

/**
 * Maps a risk_level string to a recommended action and priority.
 */
function deriveAction(riskLevel) {
  switch (riskLevel) {
    case 'High Risk':
      return { action: 'Escalate Investigation', priority: 'High' };
    case 'Medium Risk':
      return { action: 'Enhanced Monitoring', priority: 'Medium' };
    default:
      return { action: 'No Action Required', priority: 'Low' };
  }
}

/**
 * Maps API explanation array to FeatureImportance component format.
 * Uses SHAP values as the bar values (impact on risk score).
 */
function mapExplanationToFeatures(explanation) {
  if (!explanation || !explanation.length) return [];
  return explanation.slice(0, 10).map((item) => ({
    name: item.Feature || item.feature || '?',
    value: typeof item.SHAP === 'number' ? item.SHAP : (item.shap ?? 0),
  }));
}

/**
 * Generates a summary paragraph from the prediction result.
 */
function buildSummary(result) {
  if (!result) return '';
  const { prediction, risk_score, risk_level } = result;
  if (prediction === 'Mule Account') {
    return `This account has been flagged as a ${prediction} with a risk score of ${risk_score}/100 (${risk_level}). The CatBoost model and SHAP explainer identified multiple high-impact features contributing to an elevated risk assessment. The behavioral pattern is consistent with fund layering and rapid transaction routing typical of mule account activity.`;
  }
  if (risk_score >= 30) {
    return `This account shows moderate risk indicators with a risk score of ${risk_score}/100 (${risk_level}). While not definitively classified as a mule account, several features exhibit above-baseline values that warrant monitoring. The model prediction suggests the account is currently classified as "${prediction}".`;
  }
  return `This account has been assessed as a ${prediction} with a low risk score of ${risk_score}/100. The feature profile is consistent with normal transactional behavior. No layering, velocity anomalies, or suspicious beneficiary patterns were detected by the model.`;
}

/**
 * Generates a recommendation string from risk level.
 */
function buildRecommendation(riskLevel) {
  switch (riskLevel) {
    case 'High Risk':
      return 'Escalate this account for immediate manual investigation and enhanced due diligence. Consider temporary transaction limits pending review.';
    case 'Medium Risk':
      return 'Place account under enhanced monitoring. Review recent transaction history and verify beneficiary details if activity continues to escalate.';
    default:
      return 'No action required. The account exhibits low risk and standard transactional behavior.';
  }
}

// ─── Priority color helper ───────────────────────────────────────
function getPriorityColor(priority) {
  switch (priority) {
    case 'High': return 'text-red-600';
    case 'Medium': return 'text-orange-500';
    default: return 'text-green-600';
  }
}

// ─── Format current date for header ──────────────────────────────
function formatNow() {
  const d = new Date();
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return { date, time };
}

export default function Dashboard() {
  // CSV + Row selection
  const [csvRows, setCsvRows] = useState([]);
  const [selectedRowIdx, setSelectedRowIdx] = useState(null);

  // Prediction result
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);

  // Audit history
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);

  const { date: headerDate, time: headerTime } = formatNow();

  // ─── Fetch audit logs ──────────────────────────────────────────
  const fetchAuditLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch(`${API_BASE}/audit-logs`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  // Load audit logs on mount
  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // ─── Handle Analyze (call POST /predict) ───────────────────────
  const handleAnalyze = async () => {
    if (selectedRowIdx === null || !csvRows[selectedRowIdx]) return;

    setIsAnalyzing(true);
    setAnalyzeError(null);
    setSelectedLogId(null);

    try {
      const rowData = csvRows[selectedRowIdx];
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowData),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      // Refresh audit logs after successful prediction
      fetchAuditLogs();
    } catch (err) {
      setAnalyzeError(err.message || 'Failed to analyze');
      console.error('Prediction error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─── Handle selecting a log from AuditHistory ──────────────────
  const handleSelectLog = (log) => {
    setSelectedLogId(log.id);
    // Reconstruct a result object from the audit log
    setResult({
      prediction: log.prediction,
      probability: log.probability,
      risk_score: log.risk_score,
      risk_level: log.risk_level,
      fraud_alert: log.fraud_alert,
      explanation: log.explanation || [],
      reasons: (log.explanation || [])
        .filter((f) => (f.SHAP ?? f.shap ?? 0) > 0)
        .slice(0, 3)
        .map((f) => `${f.Feature || f.feature} influenced risk`),
    });
    setAnalyzeError(null);
  };

  // ─── Handle CSV rows loaded ────────────────────────────────────
  const handleRowsLoaded = (rows) => {
    setCsvRows(rows);
    setSelectedRowIdx(null);
    setResult(null);
    setAnalyzeError(null);
    setSelectedLogId(null);
  };

  const handleDownloadReport = () => {
    window.print();
  };

  // ─── Derived display values ────────────────────────────────────
  const actionInfo = result ? deriveAction(result.risk_level) : null;
  const features = result ? mapExplanationToFeatures(result.explanation) : [];
  const summaryText = result ? buildSummary(result) : '';
  const insights = result
    ? (result.reasons && result.reasons.length
        ? result.reasons
        : ['No strong anomaly detected'])
    : [];
  const recommendation = result ? buildRecommendation(result.risk_level) : '';
  const confidencePercent = result ? Math.round(result.probability * 100) : 0;

  return (
    <div className="min-h-screen bg-dashboard-bg py-6 px-4 md:px-8 select-none print:bg-white print:p-0">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-6">

        {/* ═══ TOP HEADER ═══ */}
        <header className="bg-white rounded-xl border border-dashboard-border px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm print:border-none print:shadow-none print:px-0">
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
            <BankOfIndiaLogo />
            <div className="hidden sm:block w-[1.5px] h-9 bg-slate-200" />
            <div className="flex flex-col text-center sm:text-left">
              <h1
                className="text-[23px] font-extrabold tracking-tight"
                style={{ color: '#003B95', fontFamily: '"Outfit", sans-serif' }}
              >
                MuleShield AI
              </h1>
              <p className="text-[12px] font-medium text-slate-500 tracking-wide mt-[2px]">
                AI-Powered Mule Account Detection System
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-primary-blue tracking-wide">
              <ShieldCheck size={16} className="text-primary-blue stroke-[2.5]" />
              <span>Secure. Intelligent. Reliable.</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400">
              <Calendar size={14} className="text-slate-400" />
              <span>{headerDate}</span>
              <span className="text-slate-300">|</span>
              <span>{headerTime}</span>
            </div>
          </div>
        </header>

        {/* ═══ MAIN LAYOUT: Left Content + Right Audit Panel ═══ */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* ─── Left Column (10/12) ─── */}
          <div className="xl:col-span-9 flex flex-col gap-6">

            {/* SECTION 1: CSV Uploader */}
            <div className="print:hidden">
              <CsvUploader
                onRowsLoaded={handleRowsLoaded}
                onSelectRow={setSelectedRowIdx}
                selectedRowIdx={selectedRowIdx}
              />
            </div>

            {/* Analyze Button */}
            {csvRows.length > 0 && (
              <div className="print:hidden flex items-center gap-4 flex-wrap">
                <button
                  onClick={handleAnalyze}
                  disabled={selectedRowIdx === null || isAnalyzing}
                  className={`
                    px-6 py-[14px] bg-primary-blue text-white font-semibold rounded-lg text-[15px]
                    flex items-center justify-center gap-2 hover:bg-blue-900 active:scale-[0.98]
                    transition-all whitespace-nowrap cursor-pointer shadow-sm
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-blue
                  `}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-[2px] border-white border-t-transparent animate-spin" />
                      <span>Analyzing…</span>
                    </>
                  ) : (
                    <>
                      <Search size={18} className="stroke-[2.5]" />
                      <span>Analyze Selected Row</span>
                    </>
                  )}
                </button>

                {selectedRowIdx !== null && !isAnalyzing && (
                  <span className="text-[13px] text-slate-400 font-medium">
                    Row {selectedRowIdx + 1} of {csvRows.length} selected
                  </span>
                )}

                {analyzeError && (
                  <div className="flex items-center gap-2 text-red-500 text-[13px] font-medium">
                    <AlertTriangle size={14} className="stroke-[2.5]" />
                    <span>{analyzeError}</span>
                  </div>
                )}
              </div>
            )}

            {/* ─── Results Area ─── */}
            <div className="relative flex flex-col gap-6">

              {/* Loading overlay */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-dashboard-bg/50 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-xl">
                  <div className="bg-white border border-dashboard-border shadow-md rounded-lg py-4 px-8 flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-[2.5px] border-primary-blue border-t-transparent animate-spin" />
                    <span className="text-[14px] font-semibold text-primary-blue">
                      Running CatBoost prediction & SHAP analysis…
                    </span>
                  </div>
                </div>
              )}

              {/* Empty state — no result yet */}
              {!result && !isAnalyzing && (
                <div className="bg-white rounded-xl border border-dashboard-border p-12 shadow-sm flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                    <Brain size={28} className="text-slate-300 stroke-[1.5]" />
                  </div>
                  <div>
                    <p className="text-[16px] font-semibold text-slate-500" style={{ fontFamily: '"Outfit", sans-serif' }}>
                      {csvRows.length
                        ? 'Select a row and click "Analyze" to run prediction'
                        : 'Upload a CSV file to get started'}
                    </p>
                    <p className="text-[13px] text-slate-400 mt-1.5 max-w-sm mx-auto">
                      The AI model will analyze the account's feature vector and provide risk assessment, SHAP-based feature importance, and actionable recommendations.
                    </p>
                  </div>
                </div>
              )}

              {/* Result cards */}
              {result && (
                <>
                  {/* SECTION 2: 4 Cards in a Row */}
                  <div className="grid grid-cols-1 md:grid-cols-10 gap-6 w-full">
                    {/* CARD 1: Risk Score (4/10) */}
                    <div className="md:col-span-4 h-[240px]">
                      <RiskGauge score={Math.round(result.risk_score)} />
                    </div>

                    {/* CARD 2: Prediction (2/10) */}
                    <div className="bg-white rounded-xl border border-dashboard-border p-6 shadow-sm md:col-span-2 flex flex-col justify-between h-[240px]">
                      <div>
                        <span className="font-bold text-[12px] text-slate-400 tracking-wider">
                          PREDICTION
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 flex-grow">
                        <h3
                          className="text-[24px] font-extrabold leading-[1.2] tracking-tight"
                          style={{ color: '#003B95', fontFamily: '"Outfit", sans-serif' }}
                        >
                          {result.prediction}
                        </h3>
                        <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 self-start shadow-sm">
                          <Brain className="text-primary-blue w-5 h-5 stroke-[2]" />
                        </div>
                      </div>
                    </div>

                    {/* CARD 3: Confidence / Probability (2/10) */}
                    <div className="bg-white rounded-xl border border-dashboard-border p-6 shadow-sm md:col-span-2 flex flex-col justify-between h-[240px]">
                      <div>
                        <span className="font-bold text-[12px] text-slate-400 tracking-wider">
                          CONFIDENCE
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 flex-grow">
                        <div className="flex flex-col justify-end h-full pb-2">
                          <span
                            className="text-[38px] font-extrabold text-green-500 leading-none"
                            style={{ fontFamily: '"Outfit", sans-serif' }}
                          >
                            {confidencePercent}%
                          </span>
                          <span className="text-[12px] text-slate-400 font-semibold mt-2">
                            Model Probability
                          </span>
                        </div>
                        <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 self-start shadow-sm">
                          <ShieldCheck className="text-green-500 w-5 h-5 stroke-[2]" />
                        </div>
                      </div>
                    </div>

                    {/* CARD 4: Recommended Action (2/10) */}
                    <div className="bg-white rounded-xl border border-dashboard-border p-6 shadow-sm md:col-span-2 flex flex-col justify-between h-[240px]">
                      <div>
                        <span className="font-bold text-[12px] text-slate-400 tracking-wider">
                          RECOMMENDED ACTION
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 flex-grow">
                        <div className="flex flex-col justify-end h-full pb-2">
                          <span
                            className="text-[20px] font-extrabold text-red-500 leading-[1.2] tracking-tight"
                            style={{ fontFamily: '"Outfit", sans-serif' }}
                          >
                            {actionInfo.action}
                          </span>
                          <span className="text-[12px] text-slate-400 font-semibold mt-2">
                            Priority: <span className={`font-bold ${getPriorityColor(actionInfo.priority)}`}>{actionInfo.priority}</span>
                          </span>
                        </div>
                        <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 self-start shadow-sm">
                          <Flag className="text-red-500 w-5 h-5 stroke-[2]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: Feature Importance + Summary (50/50) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                    <div className="min-h-[300px]">
                      <FeatureImportance features={features} />
                    </div>
                    <div className="min-h-[300px]">
                      <SummaryCard
                        summaryText={summaryText}
                        insights={insights}
                        recommendation={recommendation}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Download Report button */}
            {result && (
              <div className="flex justify-center mt-2 mb-6 print:hidden">
                <button
                  onClick={handleDownloadReport}
                  className="px-6 py-3 border-[2px] border-primary-blue bg-white text-primary-blue font-bold rounded-lg text-[14px] flex items-center gap-2 hover:bg-primary-blue/5 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                  style={{ fontFamily: '"Outfit", sans-serif' }}
                >
                  <Download size={16} className="stroke-[2.5]" />
                  <span>Download Investigation Report (PDF)</span>
                </button>
              </div>
            )}
          </div>

          {/* ─── Right Column: Audit History (3/12) ─── */}
          <div className="xl:col-span-3 print:hidden">
            <AuditHistory
              logs={auditLogs}
              isLoading={isLoadingLogs}
              onSelectLog={handleSelectLog}
              selectedLogId={selectedLogId}
              onRefresh={fetchAuditLogs}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
