import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface ToastProps {
  id?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  emoji?: string;
  duration?: number; // In milliseconds
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  emoji,
  duration = 2800, // Snappy & clean 2.8s interval
  onClose,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const dismissTimer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(onClose, 250); // allow exit transition to finish
      }, duration);
      return () => clearTimeout(dismissTimer);
    }
  }, [duration, onClose]);

  const handleManualClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 250);
  };

  if (!mounted) return null;

  const typeStyles = {
    success: {
      border: 'border-emerald-500/30',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      glow: 'shadow-emerald-500/10',
      bar: 'bg-emerald-500',
      defaultEmoji: '🎉',
    },
    error: {
      border: 'border-rose-500/30',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      glow: 'shadow-rose-500/10',
      bar: 'bg-rose-500',
      defaultEmoji: '❌',
    },
    warning: {
      border: 'border-amber-500/30',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      glow: 'shadow-amber-500/10',
      bar: 'bg-amber-500',
      defaultEmoji: '⚠️',
    },
    info: {
      border: 'border-indigo-500/30',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      glow: 'shadow-indigo-500/10',
      bar: 'bg-indigo-500',
      defaultEmoji: 'ℹ️',
    },
  };

  const style = typeStyles[type];

  return createPortal(
    <div
      className={`fixed top-7 left-1/2 -translate-x-1/2 z-[10000] max-w-lg w-[92%] sm:w-auto min-w-[340px] sm:min-w-[420px] 
        bg-white/95 dark:bg-[#101625]/95 backdrop-blur-md rounded-2xl border ${style.border} shadow-2xl ${style.glow}
        overflow-hidden transition-all duration-250 ease-out
        ${isClosing ? 'opacity-0 -translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-top-6 zoom-in-95'}`}
      role="alert"
    >
      <div className="p-3.5 sm:p-4 flex items-center gap-3.5">
        {/* Animated Emoji Avatar */}
        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-xl shrink-0 shadow-sm select-none">
          {emoji || style.defaultEmoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-sans tracking-tight">
              {title}
            </h4>
          </div>
          {message && (
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-snug font-sans truncate sm:whitespace-normal">
              {message}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleManualClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Countdown Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 overflow-hidden">
        <div
          className={`h-full ${style.bar} transition-all ease-linear`}
          style={{
            animation: `toast-progress ${duration}ms linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>,
    document.body
  );
};
