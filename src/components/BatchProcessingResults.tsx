'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalysisResultCard } from './AnalysisResultCard';
import { ProcessingSummary } from './ProcessingSummary';
import type { ProcessingResult, GroupedResult } from '@/types/processing';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToCSV } from '@/utils/export';

interface BatchProcessingResultsProps {
  results: ProcessingResult[];
  onExport?: () => void;
}

export function BatchProcessingResults({ 
  results = [], 
  onExport 
}: BatchProcessingResultsProps) {
  // Grupuj wyniki według nazw plików
  const groupedResults = React.useMemo(() => {
    const grouped = new Map<string, GroupedResult>();
    
    results.forEach(result => {
      const existing = grouped.get(result.fileName) || {
        fileName: result.fileName,
        modelResults: {}
      };
      
      result.results.forEach(modelResult => {
        existing.modelResults[modelResult.modelId] = modelResult;
      });
      
      grouped.set(result.fileName, existing);
    });
    
    return Array.from(grouped.values());
  }, [results]);

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

  const handleExport = () => {
    const flattenedData = results.flatMap(result => {
      const fields = result.results[0].fields;
      return {
        fileName: result.fileName,
        processingTime: result.processingTime,
        confidence: result.results[0].confidence,
        ...Object.entries(fields).reduce((acc, [key, field]) => ({
          ...acc,
          [key]: field.content || '',
          [`${key}_confidence`]: field.confidence
        }), {})
      };
    });

    exportToCSV(flattenedData, `analiza_dokumentow_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-4">
      <ProcessingSummary
        fileCount={results.length}
        totalTime={totalTime}
        averageConfidence={avgConfidence}
        onExport={handleExport}
      />

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="grid">Siatka</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          {groupedResults.map((result, index) => (
            <AnalysisResultCard 
              key={`${result.fileName}-${index}`} 
              result={result}
              modelResults={Object.values(result.modelResults)}
            />
          ))}
        </TabsContent>
        <TabsContent value="grid" className="grid grid-cols-2 gap-4">
          {groupedResults.map((result, index) => (
            <AnalysisResultCard 
              key={`${result.fileName}-${index}`} 
              result={result}
              modelResults={Object.values(result.modelResults)}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
} 