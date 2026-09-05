import React from 'react';
import { cn } from '../../utils/cn';
import { DifficultyLevel, RoleType, Difficulty } from '../../types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  difficulty?: DifficultyLevel | Difficulty | string;
  role?: RoleType;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  difficulty,
  role,
  children,
  ...props
}) => {
  let styleClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  if (difficulty) {
    const diffColor = typeof difficulty === 'object' && difficulty !== null ? difficulty.color_code : null;
    const diffVal = typeof difficulty === 'string' ? difficulty : null;

    if (diffColor === 'emerald' || diffVal === 'EASY') {
      styleClasses = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40';
    } else if (diffColor === 'amber' || diffVal === 'MEDIUM') {
      styleClasses = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40';
    } else if (diffColor === 'red' || diffVal === 'HARD') {
      styleClasses = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40';
    } else if (diffColor === 'purple' || diffVal === 'INSANE') {
      styleClasses = 'bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-800/40';
    } else if (diffColor === 'cyan') {
      styleClasses = 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/40';
    } else if (diffColor === 'blue') {
      styleClasses = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/40';
    } else if (diffColor === 'indigo') {
      styleClasses = 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40';
    } else {
      styleClasses = 'bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800/40';
    }
  } else if (role) {
    switch (role) {
      case 'SUPER_ADMIN':
        styleClasses = 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700 font-semibold';
        break;
      case 'ADMIN':
        styleClasses = 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 font-medium';
        break;
      case 'INSTRUCTOR':
        styleClasses = 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700';
        break;
      case 'STUDENT':
        styleClasses = 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
        break;
    }
  } else {
    switch (variant) {
      case 'success':
        styleClasses = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40';
        break;
      case 'warning':
        styleClasses = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40';
        break;
      case 'danger':
        styleClasses = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40';
        break;
      case 'info':
        styleClasses = 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/40';
        break;
      case 'purple':
        styleClasses = 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40';
        break;
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        styleClasses,
        className
      )}
      {...props}
    >
      {children || (typeof difficulty === 'object' && difficulty !== null ? (difficulty as any).name : (typeof difficulty === 'string' ? difficulty : '')) || role}
    </span>
  );
};
