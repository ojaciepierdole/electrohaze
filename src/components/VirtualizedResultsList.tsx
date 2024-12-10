import * as React from 'react';
import type { GroupedResult } from '@/types/processing';

interface VirtualizedResultsListProps {
  results: GroupedResult[];
  width: number;
  CardComponent: React.ComponentType<{
    result: GroupedResult;
    modelResults: Array<{
      modelId: string;
      fields: Record<string, any>;
      confidence: number;
      pageCount: number;
    }>;
  }>;
}

export function VirtualizedResultsList({ results, width, CardComponent }: VirtualizedResultsListProps) {
  if (!width) return null;

  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <div key={`${result.fileName}-${index}`} className="w-full">
          <CardComponent
            result={result}
            modelResults={Object.values(result.modelResults)}
          />
        </div>
      ))}
    </div>
  );
} 