import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
  showSubtitle?: boolean;
  subtitleText?: string;
  className?: string;
}

export function BrandLogo({
  size = 'md',
  variant = 'dark',
  showSubtitle = true,
  subtitleText = 'ENTERPRISE OCR PIPELINE',
  className = '',
}: BrandLogoProps) {
  const isLight = variant === 'light';

  // Size configurations
  const iconSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-12 h-12' : 'w-9 h-9';
  const titleSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-base';
  const badgeSize = size === 'sm' ? 'text-[9px] px-1 py-0.2' : size === 'lg' ? 'text-xs px-2 py-0.5' : 'text-[10px] px-1.5 py-0.5';
  const subSize = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-xs' : 'text-[10px]';

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      {/* High-Tech Isometric Neural Core Icon */}
      <div className={`relative ${iconSize} shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-500 shadow-md shadow-indigo-500/25 border border-indigo-400/30 overflow-hidden group`}>
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_70%)]" />
        
        {/* Futuristic SVG Logo Glyph */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5/6 h-5/6 text-white relative z-10 transition-transform duration-300 group-hover:scale-105"
        >
          {/* Outer Hexagon / Shield Node */}
          <path
            d="M12 2L20.5 7V17L12 22L3.5 17V7L12 2Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-90"
          />
          {/* Inner Circuit Cross / Data Core */}
          <path
            d="M12 6V12M12 12L17 15M12 12L7 15"
            stroke="#38bdf8"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Central Neural Node */}
          <circle cx="12" cy="12" r="2.2" fill="#ffffff" />
          {/* Micro Data Nodes */}
          <circle cx="12" cy="6" r="1.2" fill="#38bdf8" />
          <circle cx="17" cy="15" r="1.2" fill="#38bdf8" />
          <circle cx="7" cy="15" r="1.2" fill="#38bdf8" />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center space-x-1.5 leading-none">
          <span className={`font-extrabold tracking-tight ${titleSize} ${isLight ? 'text-slate-900' : 'text-white'}`}>
            NexusFin
          </span>
          <span className={`rounded-md font-mono font-bold tracking-wider uppercase bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-sm shadow-indigo-500/30 ${badgeSize}`}>
            AI
          </span>
        </div>
        {showSubtitle && (
          <span className={`font-mono tracking-widest uppercase mt-1 font-semibold ${subSize} ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
            {subtitleText}
          </span>
        )}
      </div>
    </div>
  );
}
