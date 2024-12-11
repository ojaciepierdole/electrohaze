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
  const [containerRef, setContainerRef] = React.useState<HTMLDivElement | null>(null);
  const containerWidth = containerRef?.offsetWidth ?? 0;

  return (
    <div ref={setContainerRef} className="h-[600px] w-full">
      {containerWidth > 0 && (
        <List
          height={600}
          itemCount={results.length}
          itemSize={300}
          width={containerWidth}
          itemData={{ results, CardComponent, onExport }}
        >
          {Row}
        </List>
      )}
    </div>
  );
} 