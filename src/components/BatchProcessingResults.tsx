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
  const avgConfidence = results.reduce((sum, r) => {
    const fields = Object.values(r.fields);
    const avgFieldConfidence = fields.reduce((s, f) => s + f.confidence, 0) / fields.length;
    return sum + avgFieldConfidence;
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