import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert } from 'lucide-react';

interface CountdownTimerProps {
  initialSeconds: number;
  title?: string;
  onExpire?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialSeconds,
  title = 'Tournament Live Countdown',
  onExpire,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onExpire]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-xl p-3 sm:px-6 sm:py-3 shadow-md flex items-center justify-between border border-indigo-500/30">
      <div className="flex items-center gap-3">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide text-slate-200">
            {title}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base font-bold bg-black/40 px-3 py-1 rounded-lg border border-white/10 text-cyan-300">
        <span>{pad(hours)}</span>
        <span className="text-white/40 animate-pulse">:</span>
        <span>{pad(minutes)}</span>
        <span className="text-white/40 animate-pulse">:</span>
        <span className="text-amber-400">{pad(seconds)}</span>
      </div>
    </div>
  );
};
