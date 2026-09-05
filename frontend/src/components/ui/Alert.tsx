import React from 'react';
import { cn } from '../../utils/cn';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'info',
  title,
  children,
  onClose,
  ...props
}) => {
  const configs = {
    info: {
      bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/50 text-sky-900 dark:text-sky-200',
      icon: <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />,
      text: 'text-sky-800 dark:text-sky-300',
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
      text: 'text-emerald-800 dark:text-emerald-300',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
      text: 'text-amber-800 dark:text-amber-300',
    },
    error: {
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-200',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
      text: 'text-rose-800 dark:text-rose-300',
    },
  };

  const { bg, icon, text } = configs[variant];

  return (
    <div
      role="alert"
      className={cn('relative flex items-start gap-3 p-4 rounded-xl border', bg, className)}
      {...props}
    >
      {icon}
      <div className="flex-1 text-sm">
        {title && <h5 className="font-semibold mb-0.5 tracking-tight">{title}</h5>}
        <div className={cn('leading-relaxed', text)}>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
