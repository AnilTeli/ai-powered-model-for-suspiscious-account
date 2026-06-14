import React from 'react';
import { Info } from 'lucide-react';

export default function FeatureImportance({ features }) {
  // SVG coordinates/scale parameters
  // ViewBox: 0 0 540 230
  const chartLeft = 100;
  const chartRight = 460;
  const chartWidth = chartRight - chartLeft; // 360
  const centerLine = chartLeft + chartWidth / 2; // 280 (the 0 axis)
  const maxVal = 30;
  const scale = (chartWidth / 2) / maxVal; // 180 / 30 = 6 pixels per unit

  // Row styling
  const rowHeight = 24;
  const gap = 12;
  const startY = 12;

  return (
    <div className="bg-white rounded-xl border border-dashboard-border p-6 shadow-sm flex flex-col h-full select-none">
      {/* Title with Info */}
      <div className="flex items-center gap-1.5 mb-4">
        <span className="font-bold text-[12px] text-slate-400 tracking-wider">
          TOP CONTRIBUTING FEATURES
        </span>
        <Info size={14} className="text-slate-300 stroke-[2.5] cursor-pointer hover:text-slate-400" />
      </div>

      {/* Chart Canvas */}
      <div className="flex-grow flex items-center justify-center w-full">
        <svg 
          viewBox="0 0 540 230" 
          width="100%" 
          height="230" 
          className="overflow-visible font-sans"
        >
          {/* Vertical Grid Lines */}
          {/* -30 Grid Line */}
          <line 
            x1={chartLeft} 
            y1={startY} 
            x2={chartLeft} 
            y2={startY + 5 * (rowHeight + gap) - gap} 
            stroke="#F1F5F9" 
            strokeWidth="1.5" 
          />
          {/* 0 Grid Line (Y Axis) */}
          <line 
            x1={centerLine} 
            y1={startY - 5} 
            x2={centerLine} 
            y2={startY + 5 * (rowHeight + gap) - gap + 5} 
            stroke="#E2E8F0" 
            strokeWidth="2" 
          />
          {/* +30 Grid Line */}
          <line 
            x1={chartRight} 
            y1={startY} 
            x2={chartRight} 
            y2={startY + 5 * (rowHeight + gap) - gap} 
            stroke="#F1F5F9" 
            strokeWidth="1.5" 
          />

          {/* Render Bars and Labels */}
          {features.map((feat, index) => {
            const y = startY + index * (rowHeight + gap);
            const val = feat.value;
            const isPositive = val >= 0;
            
            // Calculate bar coordinates
            let barX, barW;
            if (isPositive) {
              barX = centerLine;
              barW = val * scale;
            } else {
              barX = centerLine - Math.abs(val) * scale;
              barW = Math.abs(val) * scale;
            }

            // Set colors
            const barColor = isPositive ? '#FF5E66' : '#5C9CFF';
            const labelColor = isPositive ? '#FF5E66' : '#5C9CFF';
            const labelText = isPositive ? `+${val}` : `${val}`;
            
            // Label offset positioning
            const labelX = isPositive ? barX + barW + 8 : barX - 8;
            const textAnchor = isPositive ? 'start' : 'end';

            return (
              <g key={feat.name} className="group">
                {/* Feature Name (Left Y-Axis label) */}
                <text
                  x={chartLeft - 20}
                  y={y + rowHeight / 2 + 4}
                  fill="#475569"
                  fontSize="12"
                  fontWeight="600"
                  textAnchor="end"
                >
                  {feat.name}
                </text>

                {/* Feature Bar */}
                <rect
                  x={barX}
                  y={y}
                  width={barW}
                  height={rowHeight}
                  fill={barColor}
                  rx="2"
                  className="transition-all duration-300 ease-out"
                />

                {/* Numeric value next to bar */}
                <text
                  x={labelX}
                  y={y + rowHeight / 2 + 4}
                  fill={labelColor}
                  fontSize="12"
                  fontWeight="700"
                  textAnchor={textAnchor}
                >
                  {labelText}
                </text>
              </g>
            );
          })}

          {/* X-Axis bottom line */}
          <line 
            x1={chartLeft} 
            y1={startY + 5 * (rowHeight + gap) - gap + 5} 
            x2={chartRight} 
            y2={startY + 5 * (rowHeight + gap) - gap + 5} 
            stroke="#E2E8F0" 
            strokeWidth="1.5" 
          />

          {/* X-Axis Labels */}
          {/* -30 mark */}
          <text
            x={chartLeft}
            y={startY + 5 * (rowHeight + gap) - gap + 24}
            fill="#94A3B8"
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
          >
            -30
          </text>
          {/* 0 mark */}
          <text
            x={centerLine}
            y={startY + 5 * (rowHeight + gap) - gap + 24}
            fill="#94A3B8"
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
          >
            0
          </text>
          {/* 30 mark */}
          <text
            x={chartRight}
            y={startY + 5 * (rowHeight + gap) - gap + 24}
            fill="#94A3B8"
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
          >
            30
          </text>

          {/* X Axis Legend text */}
          <text
            x={centerLine}
            y={startY + 5 * (rowHeight + gap) - gap + 42}
            fill="#64748B"
            fontSize="11"
            fontWeight="700"
            textAnchor="middle"
            letterSpacing="0.5"
          >
            Impact on Risk Score
          </text>
        </svg>
      </div>

      {/* Legend Container */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-50 text-[12px] font-semibold text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-[#FF5E66] block"></span>
          <span>Increase Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-[#5C9CFF] block"></span>
          <span>Decrease Risk</span>
        </div>
      </div>
    </div>
  );
}
