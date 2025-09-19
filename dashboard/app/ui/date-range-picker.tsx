import * as React from 'react';
import { cn } from './cn.js';

export interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  className?: string;
}

export const DateRangePicker = React.forwardRef<HTMLDivElement, DateRangePickerProps>(
  ({ startDate, endDate, onStartDateChange, onEndDateChange, className }, ref) => {
    return (
      <div ref={ref} className={cn('flex items-center gap-2', className)}>
        <div className="flex flex-col gap-1">
          <label htmlFor="start-date" className="text-xs text-muted-foreground">
            From
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onStartDateChange?.(e.target.value)}
            className={cn(
              'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="end-date" className="text-xs text-muted-foreground">
            To
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onEndDateChange?.(e.target.value)}
            className={cn(
              'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          />
        </div>
      </div>
    );
  }
);

DateRangePicker.displayName = 'DateRangePicker';