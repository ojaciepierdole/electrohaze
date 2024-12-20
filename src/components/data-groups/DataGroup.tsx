'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Eraser } from 'lucide-react';
import type { FieldMetadata } from '@/types/processing';
import { Skeleton } from '@/components/ui/skeleton';

interface DataGroupField {
  label: string;
  value?: string | null;
  confidence?: number;
  isEnriched?: boolean;
  metadata?: FieldMetadata;
}

interface DataGroupProps {
  title: string;
  icon?: React.ReactNode;
  fields: DataGroupField[];
  confidence?: number;
  isLoading?: boolean;
}

export function DataGroup({ title, icon, fields, confidence = 0, isLoading }: DataGroupProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <Badge variant={confidence >= 0.8 ? 'success' : confidence >= 0.5 ? 'warning' : 'destructive'}>
          {Math.round(confidence * 100)}%
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{field.label}</span>
              {field.isEnriched && (
                <Badge variant="secondary" className="text-xs">
                  <Eraser className="h-3 w-3 mr-1" />
                  Wzbogacone
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">{field.value || '-'}</span>
              {field.confidence !== undefined && (
                <Badge variant={field.confidence >= 0.8 ? 'success' : field.confidence >= 0.5 ? 'warning' : 'destructive'}>
                  {Math.round(field.confidence * 100)}%
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 