'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DocumentField } from '@/types/processing';

interface DataFieldProps {
  label: string;
  field?: DocumentField;
  className?: string;
}

export function DataField({ label, field, className = '' }: DataFieldProps) {
  const confidence = field?.confidence || 0;
  const content = field?.content || '';

  const getConfidenceVariant = (confidence: number) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'warning';
    return 'destructive';
  };

  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {field && (
          <Badge variant={getConfidenceVariant(confidence)}>
            {Math.round(confidence * 100)}%
          </Badge>
        )}
      </div>
      <div className="min-h-[24px] p-2 bg-muted/50 rounded text-sm">
        {content || '—'}
      </div>
    </div>
  );
} 