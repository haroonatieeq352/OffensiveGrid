import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ShieldCheck, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

interface CyberCaptchaProps {
  onValidateChange?: (isValid: boolean) => void;
  captchaValue: string;
  onCaptchaChange: (newCaptcha: string) => void;
  isExpired: boolean;
  onExpireChange: (expired: boolean) => void;
}

// Only Capital Letters (A-Z) & Numbers (2-9) — No small letters & no ambiguous 0/O/1/I
const CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const generateCaptchaCode = (length = 8): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
  }
  return result;
};

export const CyberCaptcha: React.FC<CyberCaptchaProps> = ({
  captchaValue,
  onCaptchaChange,
  isExpired,
  onExpireChange,
}) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isRotating, setIsRotating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate & Draw Captcha on Canvas
  const drawCaptcha = useCallback((code: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background Gradient (Cyber Dark Theme)
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e1b4b');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Background Noise Lines
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 100 + 100)}, ${Math.floor(
        Math.random() * 150 + 100
      )}, 255, 0.25)`;
      ctx.lineWidth = Math.random() * 1.5 + 0.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height
      );
      ctx.stroke();
    }

    // Background Noise Dots
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Characters (Capital Letters & Numbers only)
    const colors = ['#38bdf8', '#818cf8', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#e879f9'];
    const charSpacing = width / (code.length + 1);

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      ctx.save();

      const x = (i + 0.8) * charSpacing;
      const y = height / 2 + (Math.random() * 4 - 2);

      ctx.translate(x, y);
      const angle = (Math.random() * 24 - 12) * (Math.PI / 180);
      ctx.rotate(angle);

      ctx.font = `900 ${Math.floor(Math.random() * 3 + 22)}px "JetBrains Mono", "Courier New", monospace`;
      ctx.fillStyle = colors[i % colors.length];
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  }, []);

  const refreshCaptcha = useCallback(() => {
    setIsRotating(true);
    const newCode = generateCaptchaCode(8);
    onCaptchaChange(newCode);
    setTimeLeft(30);
    onExpireChange(false);
    setTimeout(() => {
      drawCaptcha(newCode);
      setIsRotating(false);
    }, 50);
  }, [drawCaptcha, onCaptchaChange, onExpireChange]);

  // Initial load
  useEffect(() => {
    refreshCaptcha();
  }, []);

  // 30-Second Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      onExpireChange(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onExpireChange(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpireChange]);

  const percentage = (timeLeft / 30) * 100;
  const isWarning = timeLeft <= 10;
  const isCritical = timeLeft <= 5;

  return (
    <div className="space-y-2 p-3 bg-slate-50 dark:bg-[rgba(17,24,39,0.70)] border border-slate-200 dark:border-[rgba(148,163,184,0.10)] rounded-xl">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          Security Verification (CAPTCHA)
        </label>
        
        {/* 30-Second Timer Badge */}
        <div
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-colors ${
            isExpired
              ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
              : isCritical
              ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700 animate-pulse'
              : isWarning
              ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
              : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>{isExpired ? 'Expired' : `${timeLeft}s remaining`}</span>
        </div>
      </div>

      {/* Captcha Canvas Display & Refresh Action */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shadow-inner select-none">
          <canvas
            ref={canvasRef}
            width={240}
            height={48}
            className="w-full h-11 block object-cover filter contrast-125"
          />

          {/* Expired Overlay */}
          {isExpired && (
            <div
              onClick={refreshCaptcha}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px] flex items-center justify-center gap-2 text-rose-400 font-bold text-xs cursor-pointer transition-all hover:bg-slate-950/90"
              title="Click to generate new CAPTCHA"
            >
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>CAPTCHA Expired — Click to Reload</span>
              <RefreshCw className="w-3.5 h-3.5 text-rose-300 animate-spin" />
            </div>
          )}
        </div>

        {/* Reload Button */}
        <button
          type="button"
          onClick={refreshCaptcha}
          className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 bg-white dark:bg-slate-800 hover:bg-indigo-50/50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-xs shrink-0 focus:outline-none"
          title="Regenerate CAPTCHA Code"
        >
          <RefreshCw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Countdown Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isExpired
              ? 'bg-rose-500 w-0'
              : isCritical
              ? 'bg-rose-500'
              : isWarning
              ? 'bg-amber-500'
              : 'bg-indigo-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
