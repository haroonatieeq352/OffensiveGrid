import React, { useEffect } from 'react';
import { Shield, Lock, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  // Anti-tamper mechanism to ensure developer credit remains intact
  useEffect(() => {
    const checkWatermark = setInterval(() => {
      const watermark = document.getElementById('dev-watermark');
      if (!watermark || !watermark.textContent?.includes('Haroon Atieeq')) {
        // If removed or altered, crash the UI or display a warning
        document.body.innerHTML = `
          <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;background:#0F172A;color:#EF4444;font-family:monospace;text-align:center;padding:20px;">
            <h1 style="font-size:2rem;margin-bottom:10px;">SECURITY BREACH: DEVELOPER CREDIT REMOVED</h1>
            <p>This project is developed by Haroon Atieeq. The removal of the author's watermark is strictly prohibited.</p>
            <p style="margin-top:20px;font-size:12px;color:#94A3B8;">System halted.</p>
          </div>
        `;
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(checkWatermark);
  }, []);

  return (
    <footer className="bg-white dark:bg-[#0B0F17] border-t border-slate-200 dark:border-[rgba(148,163,184,0.08)] mt-auto py-6 text-slate-500 dark:text-slate-400 text-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Left Side: Brand */}
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <img src="/offensivegrid-mark.png" alt="OffensiveGrid" className="w-full h-full object-contain filter drop-shadow-sm dark:drop-shadow-[0_0_1.5px_rgba(255,255,255,0.85)] dark:drop-shadow-[0_0_6px_rgba(206,32,41,0.4)]" />
            </div>
            <span className="font-bold hidden md:inline">
              <span className="text-[#0B203F] dark:text-[#60A5FA] transition-colors">Offensive</span>
              <span className="text-[#C8212B] dark:text-[#EF4444] ml-0.5 transition-colors">Grid</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden lg:inline">|</span>
            <span className="hidden lg:inline font-mono text-[11px] uppercase">Defense & CTF Labs</span>
          </div>

          {/* Center: Developer Watermark (Protected by Anti-Tamper Hook) */}
          <div 
            id="dev-watermark" 
            className="flex flex-col items-center justify-center opacity-90 hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-semibold mb-0.5">
              Developed & Secured By
            </span>
            <a 
              href="https://github.com/haroonatieeq352" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-emerald-500 dark:from-indigo-500 dark:to-emerald-400 font-mono tracking-wider leading-none hover:opacity-90"
              title="Founder & Lead Developer: Haroon Atieeq"
            >
              Haroon Atieeq
            </a>
          </div>

          {/* Right Side: Features / GitHub Repository / Version */}
          <div className="flex items-center gap-4 lg:gap-6 flex-1 justify-end">
            <a
              href="https://github.com/haroonatieeq352/OffensiveGrid"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 font-mono transition-colors"
              title="View OffensiveGrid Source Repository on GitHub"
            >
              <span>GitHub Repo</span>
            </a>
            <span className="hidden sm:flex items-center gap-1 text-slate-400 dark:text-slate-500">
              <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Isolated Labs
            </span>
            <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
              <Terminal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              v2.0.0
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
};
