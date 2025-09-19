import * as React from 'react';
import { cn } from '../../ui/cn';

interface MetricItemProps {
  label: string;
  value: React.ReactNode;
  good?: boolean;
  bad?: boolean;
}

export const MetricItem: React.FC<MetricItemProps> = ({ label, value, good, bad }) => {
  return (
    <div className="flex items-center justify-between text-sm py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          'font-medium flex items-center gap-1',
          good && 'text-emerald-600',
          bad && 'text-red-600'
        )}
      >
        {value}
      </span>
    </div>
  );
};
