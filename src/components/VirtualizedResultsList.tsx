'use client';

import * as React from 'react';
import { FixedSizeList as List } from 'react-window';
import type { ProcessingResult } from '@/types/processing';

interface VirtualizedResultsListProps {
  results: ProcessingResult[];
  CardComponent: React.ComponentType<{ result: ProcessingResult; onExport?: () => void }>;
  onExport?: () => void;
}

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    results: ProcessingResult[];
    CardComponent: React.ComponentType<{ result: ProcessingResult; onExport?: () => void }>;
    onExport?: () => void;
  };
}

const Row = React.memo(({ index, style, data }: RowProps) => {
  const { results, CardComponent, onExport } = data;
  const result = results[index];

  return (
    <div style={style} className="p-2">
      <CardComponent result={result} onExport={onExport} />
    </div>
  );
});

Row.displayName = 'Row';

export function VirtualizedResultsList({ results, CardComponent, onExport }: VirtualizedResultsListProps) {
  return (
    <div className="space-y-6">
      {results.map((result, index) => (
        <div key={`${result.fileName}-${index}`}>
          <CardComponent result={result} onExport={onExport} />
        </div>
      ))}
    </div>
  );
} 