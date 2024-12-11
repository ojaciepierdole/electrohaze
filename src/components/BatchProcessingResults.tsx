'use client';

import * as React from 'react';
import { VirtualizedResultsList } from '@/components/VirtualizedResultsList';
import { AnalysisResultCard } from '@/components/AnalysisResultCard';
import type { ProcessingResult } from '@/types/processing';

interface BatchProcessingResultsProps {
  results: ProcessingResult[];
  onExport?: () => void;
}

export function BatchProcessingResults({ results, onExport }: BatchProcessingResultsProps) {
  return (
    <div className="space-y-4">
      <VirtualizedResultsList
        results={results}
        CardComponent={({ result }) => (
          <AnalysisResultCard 
            result={result} 
            onExport={onExport}
          />
        )}
      />
    </div>
  );
} 