import React from 'react';
import { Info, Target, Layers, Network, ShieldCheck } from 'lucide-react';

export default function SummaryCard({ summaryText, insights, recommendation }) {
  // Map index to different icons for insights
  const getInsightIcon = (index) => {
    switch (index) {
      case 0:
        return <Target className="text-red-500 w-4 h-4 stroke-[2.5]" />;
      case 1:
        return <Layers className="text-red-500 w-4 h-4 stroke-[2.5]" />;
      case 2:
      default:
        return <Network className="text-red-500 w-4 h-4 stroke-[2.5]" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-dashboard-border p-6 shadow-sm flex flex-col justify-between h-full select-none">
      {/* Title */}
      <div>
        <div className="flex items-center gap-1.5 mb-4">
          <span className="font-bold text-[12px] text-slate-400 tracking-wider">
            AI INVESTIGATION SUMMARY
          </span>
          <Info size={14} className="text-slate-300 stroke-[2.5] cursor-pointer hover:text-slate-400" />
        </div>

        {/* Narrative Paragraph */}
        <p className="text-[14px] text-slate-600 leading-relaxed font-normal mb-6">
          {summaryText}
        </p>
      </div>

      {/* Thin Divider */}
      <hr className="border-t border-dashboard-border my-0" />

      {/* Two Column Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 relative overflow-hidden">
        {/* Left Column: Key Insights */}
        <div className="flex flex-col gap-3">
          <h4 className="text-[13px] font-bold text-primary-blue tracking-tight mb-1">
            Key Insights
          </h4>
          <ul className="flex flex-col gap-3.5">
            {insights.map((insight, idx) => (
              <li key={idx} className="flex items-center gap-3 text-[13px] text-slate-700 font-medium">
                <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  {getInsightIcon(idx)}
                </span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column: Recommendation */}
        <div className="relative pr-12 flex flex-col justify-between">
          <div>
            <h4 className="text-[13px] font-bold text-primary-blue tracking-tight mb-2">
              Recommendation
            </h4>
            <p className="text-[13px] text-slate-600 leading-relaxed font-semibold">
              {recommendation}
            </p>
          </div>

          {/* Subtle Shield Watermark SVG */}
          <div className="absolute right-0 bottom-0 text-slate-100 opacity-80 pointer-events-none select-none">
            <svg 
              width="68" 
              height="68" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-slate-100/90"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
