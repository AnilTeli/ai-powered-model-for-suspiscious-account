import React from 'react';
import { Clock, ShieldAlert, AlertTriangle, ShieldCheck, ChevronRight, History, RefreshCw } from 'lucide-react';

/**
 * Formats an ISO date string into a friendly display.
 */
function formatTimestamp(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date}, ${time}`;
  } catch {
    return iso;
  }
}

/**
 * Returns config (color, icon, label) based on risk level.
 */
function getRiskBadge(riskLevel, riskScore) {
  if (riskScore >= 70 || riskLevel === 'High Risk') {
    return {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-100',
      icon: <ShieldAlert size={13} className="stroke-[2.5]" />,
      label: 'High',
    };
  }
  if (riskScore >= 30 || riskLevel === 'Medium Risk') {
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      icon: <AlertTriangle size={13} className="stroke-[2.5]" />,
      label: 'Medium',
    };
  }
  return {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-100',
    icon: <ShieldCheck size={13} className="stroke-[2.5]" />,
    label: 'Low',
  };
}

export default function AuditHistory({
  logs,
  isLoading,
  onSelectLog,
  selectedLogId,
  onRefresh,
}) {
  return (
    <div className="bg-white rounded-xl border border-dashboard-border p-6 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
            <History size={15} className="text-slate-500 stroke-[2.5]" />
          </div>
          <span className="font-bold text-[12px] text-slate-400 tracking-wider">
            AUDIT HISTORY
          </span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary-blue hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-40"
            title="Refresh audit logs"
          >
            <RefreshCw size={14} className={`stroke-[2.5] ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-grow overflow-y-auto -mx-2 px-2 space-y-1.5" style={{ maxHeight: '420px' }}>
        {isLoading && !logs.length && (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <div className="w-5 h-5 rounded-full border-[2.5px] border-primary-blue border-t-transparent animate-spin" />
            <span className="text-[12px] text-slate-400 font-medium">Loading history…</span>
          </div>
        )}

        {!isLoading && !logs.length && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
              <Clock size={22} className="text-slate-300 stroke-[1.5]" />
            </div>
            <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
              No predictions yet.<br />
              Upload a CSV and analyze an account to get started.
            </p>
          </div>
        )}

        {logs.map((log) => {
          const badge = getRiskBadge(log.risk_level, log.risk_score);
          const isActive = selectedLogId === log.id;

          return (
            <button
              key={log.id}
              onClick={() => onSelectLog(log)}
              className={`
                w-full text-left p-3 rounded-lg border transition-all duration-150 cursor-pointer
                flex items-center gap-3 group
                ${isActive
                  ? 'border-primary-blue/30 bg-blue-50/50 shadow-sm'
                  : 'border-transparent hover:border-dashboard-border hover:bg-slate-50/70'
                }
              `}
            >
              {/* Risk badge icon */}
              <div className={`
                w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                ${badge.bg} ${badge.text}
              `}>
                {badge.icon}
              </div>

              {/* Info */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-slate-700 truncate">
                    {log.prediction || 'Prediction'}
                  </span>
                  {log.fraud_alert && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded tracking-wide">
                      ALERT
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[11px] font-bold ${badge.text} ${badge.bg} px-1.5 py-0.5 rounded`}>
                    {log.risk_score ?? '—'}%
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium truncate">
                    {formatTimestamp(log.createdAt)}
                  </span>
                </div>
              </div>

              {/* Chevron */}
              <ChevronRight
                size={14}
                className={`
                  flex-shrink-0 transition-colors stroke-[2.5]
                  ${isActive ? 'text-primary-blue' : 'text-slate-300 group-hover:text-slate-400'}
                `}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
