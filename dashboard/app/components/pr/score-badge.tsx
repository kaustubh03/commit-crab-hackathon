import * as React from 'react';
import { cn } from '../../ui/cn';

interface ScoreBadgeProps {
  value: number;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ value }) => {
  let color = 'bg-gray-200 text-gray-900';
  if (value >= 85) color = 'bg-emerald-600 text-white';
  else if (value >= 70) color = 'bg-green-500 text-white';
  else if (value >= 50) color = 'bg-yellow-500 text-white';
  else color = 'bg-red-500 text-white';

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full text-xs font-semibold px-2.5 py-0.5 shadow-sm',
        color
      )}
    >
      {value}
    </span>
  );
};
