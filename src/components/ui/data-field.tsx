'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DataFieldProps {
  label: string;
  value: string;
  confidence: number;
  isRequired?: boolean;
  isProcessing?: boolean;
}

export function DataField({ 
  label, 
  value, 
  confidence, 
  isRequired = false, 
  isProcessing = false 
}: DataFieldProps) {
  const confidenceLevel = confidence > 0.8 ? 'success' : confidence > 0.6 ? 'warning' : 'destructive';
  const confidencePercent = Math.round(confidence * 100);

  return (
    <div className={cn(
      'p-4 rounded-lg border',
      isProcessing ? 'bg-gray-50' : 'bg-white',
      isRequired ? 'border-gray-300' : 'border-gray-200'
    )}>
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {isRequired && (
            <Badge variant="outline" className="text-xs">
              Wymagane
            </Badge>
          )}
        </div>
        <Badge variant={confidenceLevel} className="text-xs">
          {confidencePercent}%
        </Badge>
      </div>
      <div className="text-sm text-gray-900">
        {isProcessing ? (
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        ) : (
          value || 'N/A'
        )}
      </div>
    </div>
  );
} 