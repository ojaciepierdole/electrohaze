'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalysisResultCard } from './AnalysisResultCard';
import { ProcessingSummary } from './ProcessingSummary';
import type { ProcessingResult } from '@/types/processing';

interface BatchProcessingResultsProps {
  results: ProcessingResult[];
  onExport: () => void;
}

export function BatchProcessingResults({ results, onExport }: BatchProcessingResultsProps) {
  const totalTime = results.reduce((sum, r) => sum + r.processingTime, 0);
  const avgConfidence = results.reduce((sum, r) => {
    const fields = Object.values(r.fields);
    const avgFieldConfidence = fields.reduce((s, f) => s + f.confidence, 0) / fields.length;
    return sum + avgFieldConfidence;
  }, 0) / results.length;

  const successRate = results.filter(r => r.positiveBaseline).length / results.length;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Wyniki analizy</h2>
        <Button onClick={onExport} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Eksportuj wyniki
        </Button>
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Podsumowanie</TabsTrigger>
          <TabsTrigger value="details">Szczegóły</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <ProcessingSummary
            totalDocuments={results.length}
            totalTime={totalTime}
            avgConfidence={avgConfidence}
            successRate={successRate}
          />
        </TabsContent>

        <TabsContent value="details">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {results.map((result, index) => (
                <AnalysisResultCard
                  key={`${result.fileName}-${index}`}
                  result={result}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
} 