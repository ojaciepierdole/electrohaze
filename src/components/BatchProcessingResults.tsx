'use client';

import * as React from 'react';
import { DocumentList } from '@/components/DocumentList';
import type { ProcessingResult } from '@/types/processing';

interface BatchProcessingResultsProps {
  results: ProcessingResult[];
  onExport?: () => void;
}

export function BatchProcessingResults({ results, onExport }: BatchProcessingResultsProps) {
  return (
    <div className="space-y-4">
      <DocumentList
        documents={results}
        onExport={onExport}
      />
    </div>
  );
} 