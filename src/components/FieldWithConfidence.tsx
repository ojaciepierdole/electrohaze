'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';

export interface FieldWithConfidenceProps {
  label: string;
  value: string | number | boolean | Date | null | undefined;
  confidence: number;
  className?: string;
}

export function FieldWithConfidence({ 
  label, 
  value, 
  confidence, 
  className = '' 
}: FieldWithConfidenceProps) {
  const displayValue = value?.toString() || '—';
  
  const getConfidenceVariant = (confidence: number) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'warning';
    return 'destructive';
  };

  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Badge variant={getConfidenceVariant(confidence)}>
          {Math.round(confidence * 100)}%
        </Badge>
      </div>
      <div className="min-h-[24px] p-2 bg-muted/50 rounded text-sm">
        {displayValue}
      </div>
    </div>
  );
} 