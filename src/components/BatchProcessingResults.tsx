'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalysisResultCard } from './AnalysisResultCard';
import { ProcessingSummary } from './ProcessingSummary';
import type { ProcessingResult } from '@/types/processing';

interface BatchProcessingResultsProps {
  results: ProcessingResult[];
  onExport?: () => void;
}

export function BatchProcessingResults({ 
  results = [], 
  onExport 
}: BatchProcessingResultsProps) {
  if (!results.length) return null;

  // Sumuj czasy przetwarzania w milisekundach
  const totalTime = results.reduce((sum, result) => {
    // Upewnij się, że processingTime jest w milisekundach
    const time = typeof result.processingTime === 'number' ? result.processingTime : 0;
    return sum + time;
  }, 0);
  
  // Oblicz średnią pewność ze wszystkich modeli i ich pól
  const avgConfidence = results.reduce((sum, result) => {
    const resultConfidence = result.results.reduce((rSum, r) => rSum + r.confidence, 0) / result.results.length;
    return sum + resultConfidence;
  }, 0) / results.length;

  return (
    <div className="space-y-4">
      <ProcessingSummary
        fileCount={results.length}
        totalTime={totalTime}
        averageConfidence={avgConfidence}
      />

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="grid">Siatka</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          {results.map((result, index) => (
            <AnalysisResultCard 
              key={`${result.fileName}-${index}`} 
              result={result} 
            />
          ))}
        </TabsContent>
        <TabsContent value="grid" className="grid grid-cols-2 gap-4">
          {results.map((result, index) => (
            <AnalysisResultCard 
              key={`${result.fileName}-${index}`} 
              result={result} 
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
} 