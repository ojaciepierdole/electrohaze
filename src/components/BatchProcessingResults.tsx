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
  results = [], // Domyślna wartość pusta tablica
  onExport 
}: BatchProcessingResultsProps) {
  if (!results.length) return null;

  const totalTime = results.reduce((sum, r) => sum + r.processingTime, 0);
  
  // Oblicz średnią pewność ze wszystkich modeli i ich pól
  const avgConfidence = results.reduce((sum, result) => {
    const modelConfidences = result.results.reduce((modelSum, modelResult) => {
      return modelSum + modelResult.confidence;
    }, 0);
    return sum + (modelConfidences / result.results.length);
  }, 0) / results.length;

  return (
    <div className="space-y-4">
      <ProcessingSummary
        totalFiles={results.length}
        totalTime={totalTime}
        avgConfidence={avgConfidence}
        onExport={onExport}
      />

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="grid">Siatka</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          {results.map((result, index) => (
            <AnalysisResultCard key={index} result={result} />
          ))}
        </TabsContent>
        <TabsContent value="grid" className="grid grid-cols-2 gap-4">
          {results.map((result, index) => (
            <AnalysisResultCard key={index} result={result} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
} 