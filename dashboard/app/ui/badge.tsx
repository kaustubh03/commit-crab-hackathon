import * as React from 'react';
import { cn } from './cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'success' | 'warning';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants: Record<string, string> = {
      default:
        'bg-primary/90 text-primary-foreground hover:bg-primary border-transparent',
      destructive:
        'bg-destructive/90 text-destructive-foreground hover:bg-destructive',
      outline: 'text-foreground border border-border',
      success: 'bg-emerald-500 text-white',
      warning: 'bg-yellow-500 text-white',
    };
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';
