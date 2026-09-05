import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
  iconOnly?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  to = '/',
  size = 'md',
  showTagline = true,
  className = '',
  iconOnly = false,
}) => {
  const sizeMap = {
    sm: {
      mark: 'w-8 h-8',
      title: 'text-base',
      tagline: 'text-[9px]',
    },
    md: {
      mark: 'w-10 h-10',
      title: 'text-lg',
      tagline: 'text-[10px]',
    },
    lg: {
      mark: 'w-14 h-14',
      title: 'text-2xl',
      tagline: 'text-xs',
    },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      {/* Official OffensiveGrid Shield Mark (Pure Standalone Emblem, No Square Box) */}
      <div className={`${currentSize.mark} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200`}>
        <img
          src="/offensivegrid-mark.png"
          alt="OffensiveGrid Logo"
          className="w-full h-full object-contain filter drop-shadow-sm dark:drop-shadow-[0_0_1.5px_rgba(255,255,255,0.85)] dark:drop-shadow-[0_0_8px_rgba(206,32,41,0.4)] transition-all duration-200"
          loading="eager"
        />
      </div>

      {!iconOnly && (
        <div className="flex flex-col">
          <span className={`font-black ${currentSize.title} tracking-tight leading-none flex items-center`}>
            <span className="text-[#0B203F] dark:text-[#60A5FA] transition-colors">Offensive</span>
            <span className="text-[#C8212B] dark:text-[#EF4444] ml-0.5 transition-colors">Grid</span>
          </span>
          {showTagline && (
            <span className={`${currentSize.tagline} text-slate-500 dark:text-slate-400 font-mono font-semibold tracking-wider uppercase mt-0.5`}>
              DEFENSE & CTF LABS
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
};
