import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Shield, CheckCircle2, Lock, Terminal, Trophy } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-[#DFE5EC] dark:bg-[#07090E] transition-colors duration-200">
      {/* Left Banner for large screens */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white p-12 flex-col justify-between relative overflow-hidden border-r border-transparent dark:border-[rgba(148,163,184,0.08)]">
        {/* Abstract cyber grid lines */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#6366F1_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div>
          <BrandLogo to="/" size="lg" showTagline={true} />
        </div>

        <div className="space-y-6 max-w-md my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-cyan-300 border border-indigo-500/30 text-xs font-semibold">
            <Terminal className="w-3.5 h-3.5" />
            Enterprise Cybersecurity Training System
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Master offensive tactics & defense operations in live isolated labs.
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Gain tactical hands-on experience through web exploitation, binary analysis, network forensics, and real-time tournament scoreboards.
          </p>

          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Real-Time WebSocket Leaderboard & Server Countdown Timers</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Isolated Sandboxed Attack Targets & Mission Dossiers</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Strict Anti-Cheat & Attempt Quota Validation Engine</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          OffensiveGrid © 2026. All rights reserved.
        </div>
      </div>

      {/* Right Form Area */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <BrandLogo to="/" size="md" showTagline={true} />
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
};
