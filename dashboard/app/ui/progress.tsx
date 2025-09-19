import * as React from 'react';
import { cn } from './cn';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));

    // Match color thresholds used in ScoreBadge for visual consistency
    // Thresholds: >=85 emerald, >=70 green, >=50 yellow, else red
    let barColor = 'bg-gray-300';
    if (pct >= 85) barColor = 'bg-emerald-600';
    else if (pct >= 70) barColor = 'bg-green-500';
    else if (pct >= 50) barColor = 'bg-yellow-500';
    else barColor = 'bg-red-500';

    return (
      <div
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
          className
        )}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        {...props}
      >
        <div
          className={cn('h-full transition-all', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';
