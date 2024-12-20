'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface FieldWithConfidenceProps {
  label: string;
  value: string;
  confidence: number;
  isProcessing: boolean;
}

export function FieldWithConfidence({
  label,
  value,
  confidence,
  isProcessing
}: FieldWithConfidenceProps) {
  const confidenceColor = confidence > 0.8 
    ? 'bg-green-50 text-green-700' 
    : confidence > 0.6 
      ? 'bg-yellow-50 text-yellow-700' 
      : 'bg-red-50 text-red-700';

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      {isProcessing ? (
        <Skeleton className="h-6 w-full" />
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{value}</span>
          <span className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs',
            confidenceColor
          )}>
            {Math.round(confidence * 100)}%
          </span>
        </div>
      )}
    </div>
  );
} 