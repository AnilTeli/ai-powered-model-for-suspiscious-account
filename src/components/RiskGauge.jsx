import React from 'react';
import { Info } from 'lucide-react';

export default function RiskGauge({ score }) {
  // SVG Dimensions
  const cx = 150;
  const cy = 130;
  const r = 90;
  const strokeWidth = 18;

  // Calculate needle rotation angle based on score (0 to 100)
  // 0 score corresponds to -90 deg (left)
  // 100 score corresponds to 90 deg (right)
  const angle = (score / 100) * 180 - 90;

  // Determine risk level config
  const getRiskConfig = (val) => {
    if (val >= 80) return { label: 'CRITICAL', color: '#EF4444', textColor: '#FFFFFF' };
    if (val >= 60) return { label: 'HIGH', color: '#F97316', textColor: '#FFFFFF' };
    if (val >= 40) return { label: 'MEDIUM', color: '#EAB308', textColor: '#0F172A' };
    return { label: 'LOW', color: '#22C55E', textColor: '#FFFFFF' };
  };

  const risk = getRiskConfig(score);

  return (
    <div className="bg-white rounded-xl border border-dashboard-border p-6 shadow-sm flex flex-col h-full select-none">
      {/* Title with Info icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[12px] text-slate-400 tracking-wider">
            RISK SCORE
          </span>
          <Info size={14} className="text-slate-300 stroke-[2.5] cursor-pointer hover:text-slate-400" />
        </div>
      </div>

      {/* Gauge & Score Visualizer Container */}
      <div className="relative flex flex-col items-center justify-center flex-grow mt-2">
        <svg 
          width="280" 
          height="160" 
          viewBox="0 0 300 160" 
          className="overflow-visible"
        >
          <defs>
            {/* Gradient for the semi-circle gauge */}
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22C55E" />    {/* Green */}
              <stop offset="35%" stopColor="#EAB308" />   {/* Yellow */}
              <stop offset="70%" stopColor="#F97316" />   {/* Orange */}
              <stop offset="100%" stopColor="#EF4444" />  {/* Red */}
            </linearGradient>
          </defs>

          {/* Background Arc - Light gray */}
          <path
            d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Color Gradient Arc */}
          {/* Note: Renders directly over the background arc */}
          <path
            d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Gauge Numeric Indicators (0, 50, 100) */}
          <text 
            x={cx - r - 18} 
            y={cy + 5} 
            fill="#94A3B8" 
            fontSize="12" 
            fontWeight="600"
            textAnchor="middle"
          >
            0
          </text>
          <text 
            x={cx} 
            y={cy - r - 12} 
            fill="#94A3B8" 
            fontSize="12" 
            fontWeight="600"
            textAnchor="middle"
          >
            50
          </text>
          <text 
            x={cx + r + 18} 
            y={cy + 5} 
            fill="#94A3B8" 
            fontSize="12" 
            fontWeight="600"
            textAnchor="middle"
          >
            100
          </text>

          {/* Needle Pointer */}
          <g transform={`rotate(${angle}, ${cx}, ${cy})`}>
            {/* Needle Line/Triangle */}
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - r + 4}
              stroke="#0F172A"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Arrowhead point */}
            <polygon
              points={`${cx - 5},${cy - r + 8} ${cx + 5},${cy - r + 8} ${cx},${cy - r - 4}`}
              fill="#0F172A"
            />
          </g>

          {/* Center Hub */}
          <circle cx={cx} cy={cy} r="8" fill="#0F172A" />
          <circle cx={cx} cy={cy} r="4" fill="#FFFFFF" />
        </svg>

        {/* Text Details overlapping center position vertically */}
        <div className="absolute top-[80px] flex flex-col items-center justify-center">
          {/* Score display */}
          <div className="flex items-baseline justify-center">
            <span 
              className="text-[44px] font-extrabold tracking-tight leading-none"
              style={{ color: '#EF4444', fontFamily: '"Outfit", sans-serif' }}
            >
              {score}
            </span>
            <span className="text-[16px] text-slate-400 font-semibold ml-0.5">
              /100
            </span>
          </div>

          {/* Critical Badge */}
          <div 
            className="mt-3 px-5 py-1 rounded-full text-[12px] font-extrabold tracking-wider shadow-sm select-none"
            style={{ 
              backgroundColor: risk.color, 
              color: risk.textColor,
              fontFamily: '"Outfit", sans-serif'
            }}
          >
            {risk.label}
          </div>
        </div>
      </div>
    </div>
  );
}
