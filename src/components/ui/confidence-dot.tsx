import * as React from 'react';
import { cn } from '@/lib/utils';

interface ConfidenceDotProps {
  confidence: number;
  className?: string;
}

export function ConfidenceDot({ confidence, className }: ConfidenceDotProps) {
  const getColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500';
    if (confidence >= 0.8) return 'bg-blue-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn('flex items-center gap-1.5 text-xs text-gray-500', className)}>
      <div className={cn('w-1.5 h-1.5 rounded-full', getColor(confidence))} />
      <span>{Math.round(confidence * 100)}%</span>
    </div>
  );
} 