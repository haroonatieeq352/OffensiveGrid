import React from 'react';
import { cn } from '../../utils/cn';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div
    className={cn(
      'bg-white border border-slate-300 rounded-xl shadow-xs transition-all duration-200 text-slate-900',
      'dark:bg-[#0C1017] dark:border-[rgba(255,255,255,0.08)] dark:shadow-md dark:text-slate-100',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('p-5 border-b border-slate-300 bg-slate-100/90 rounded-t-xl dark:bg-transparent dark:border-[rgba(255,255,255,0.07)] flex flex-col space-y-1.5', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h3 className={cn('font-semibold text-lg text-slate-900 dark:text-white tracking-tight', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={cn('text-sm text-slate-500 dark:text-slate-400', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('p-5', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('px-5 py-4 border-t border-slate-100 dark:border-[rgba(255,255,255,0.07)] flex items-center', className)} {...props}>
    {children}
  </div>
);

