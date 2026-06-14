import React from 'react';

export default function BankOfIndiaLogo() {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Brand Text Block */}
      <div className="flex flex-col items-start justify-center">
        <span 
          className="text-[20px] font-extrabold tracking-tight leading-none" 
          style={{ color: '#003B95', fontFamily: '"Outfit", sans-serif' }}
        >
          Bank of India
        </span>
        <span 
          className="text-[9px] font-medium tracking-wide mt-1 italic opacity-90"
          style={{ color: '#0F172A', fontFamily: 'Georgia, serif' }}
        >
          Relationship beyond banking
        </span>
      </div>

      {/* Star Emblem */}
      <svg 
        width="38" 
        height="38" 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        {/* Core Star Shapes - Bank of India Star */}
        {/* Tilted star points with gold/orange/blue gradient styling */}
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
          <linearGradient id="yellowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#003B95" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
        </defs>

        {/* The tilted star consists of 5 points, each point split into two halves (light and shadow) */}
        {/* Center coordinates around (50, 50) */}
        {/* We can construct it precisely using path points */}
        {/* Point 1 (Top/Right-ish): (50, 10) to (58, 40) to (50, 50) */}
        <path d="M50 10 L58 40 L50 50 Z" fill="url(#goldGrad)" />
        <path d="M50 10 L42 40 L50 50 Z" fill="url(#yellowGrad)" />

        {/* Point 2 (Right/Bottom-ish): (90, 36) to (62, 50) to (50, 50) */}
        <path d="M90 36 L62 50 L50 50 Z" fill="url(#goldGrad)" />
        <path d="M90 36 L65 30 L50 50 Z" fill="url(#yellowGrad)" />

        {/* Point 3 (Bottom/Right): (75, 85) to (50, 60) to (50, 50) */}
        <path d="M75 85 L50 60 L50 50 Z" fill="url(#blueGrad)" />
        <path d="M75 85 L70 55 L50 50 Z" fill="url(#goldGrad)" />

        {/* Point 4 (Bottom/Left): (25, 85) to (38, 55) to (50, 50) */}
        <path d="M25 85 L38 55 L50 50 Z" fill="url(#blueGrad)" />
        <path d="M25 85 L50 60 L50 50 Z" fill="url(#blueGrad)" style={{ opacity: 0.8 }} />

        {/* Point 5 (Left/Top-ish): (10, 36) to (50, 50) to (38, 30) */}
        <path d="M10 36 L50 50 L35 30 Z" fill="url(#yellowGrad)" />
        <path d="M10 36 L42 45 L50 50 Z" fill="url(#goldGrad)" />

        {/* Inner star accents to give the 3D look */}
        <circle cx="50" cy="50" r="4" fill="#FFFFFF" />
      </svg>
    </div>
  );
}
