import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'cyber';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl cursor-pointer select-none';

    const variants = {
      primary:
        'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md hover:shadow-indigo-500/25 border border-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:ring-indigo-500',
      secondary:
        'bg-slate-100 hover:bg-slate-200 dark:bg-[#161D2E] dark:hover:bg-[#1E293B] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-[rgba(255,255,255,0.10)] shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:ring-slate-400',
      outline:
        'border-2 border-slate-300 dark:border-[rgba(255,255,255,0.14)] hover:border-indigo-600 dark:hover:border-indigo-400 bg-white dark:bg-[#111622] hover:bg-indigo-50/70 dark:hover:bg-[#182030] text-slate-700 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-indigo-300 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:ring-indigo-500',
      ghost:
        'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-[#1A2234] focus:ring-slate-400 active:scale-[0.98]',
      danger:
        'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-md hover:shadow-rose-500/25 border border-rose-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:ring-rose-500',
      cyber:
        'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-700 hover:via-purple-700 hover:to-cyan-700 text-white font-bold shadow-md hover:shadow-cyan-500/25 border border-cyan-400/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:ring-cyan-500',
    };

    const sizes = {
      sm: 'text-xs px-3.5 py-1.5 gap-1.5',
      md: 'text-sm px-5 py-2.5 gap-2',
      lg: 'text-base px-6 py-3 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-1.5 shrink-0" />}
        {!isLoading && leftIcon && <span className="shrink-0 flex items-center justify-center">{leftIcon}</span>}
        <span className="truncate -mt-[1.5px]">{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0 flex items-center justify-center">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
