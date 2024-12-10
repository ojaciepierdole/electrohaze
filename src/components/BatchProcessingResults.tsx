'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalysisResultCard } from './AnalysisResultCard';
import { OptimizedResultCard } from './OptimizedResultCard';
import { ProcessingSummary } from './ProcessingSummary';
import type { ProcessingResult, GroupedResult } from '@/types/processing';
import { Download, LayoutList, Grid, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToCSV } from '@/utils/export';
import { VirtualizedResultsList } from './VirtualizedResultsList';
import { useElementSize } from '@/hooks/useElementSize';

interface BatchProcessingResultsProps {
  results: ProcessingResult[];
  onExport?: () => void;
}

export function BatchProcessingResults({ 
  results = [], 
  onExport 
}: BatchProcessingResultsProps) {
  const [containerRef, { width }] = useElementSize();
  const [isSimplifiedView, setIsSimplifiedView] = React.useState(false);
  const [activeView, setActiveView] = React.useState<'list' | 'grid'>('list');
  
  console.log('Renderowanie BatchProcessingResults:', {
    resultsCount: results.length,
    width,
    isSimplifiedView,
    activeView
  });

  // Grupuj wyniki według nazw plików
  const groupedResults = React.useMemo(() => {
    console.log('Grupowanie wyników:', results.length);
    const grouped = new Map<string, GroupedResult>();
    
    results.forEach(result => {
      console.log('Przetwarzanie wyniku:', {
        fileName: result.fileName,
        modelResults: result.results.length
      });

      const existing = grouped.get(result.fileName) || {
        fileName: result.fileName,
        modelResults: {}
      };
      
      result.results.forEach(modelResult => {
        existing.modelResults[modelResult.modelId] = modelResult;
      });
      
      grouped.set(result.fileName, existing);
    });
    
    const finalResults = Array.from(grouped.values());
    console.log('Zgrupowane wyniki:', finalResults.map(r => ({
      fileName: r.fileName,
      modelCount: Object.keys(r.modelResults).length
    })));
    return finalResults;
  }, [results]);

  if (!results.length) return null;

  // Sumuj czasy przetwarzania w milisekundach
  const totalTime = results.reduce((sum, result) => {
    const time = typeof result.processingTime === 'number' ? result.processingTime : 0;
    return sum + time;
  }, 0);
  
  // Oblicz średnią pewność ze wszystkich modeli i ich pól
  const avgConfidence = results.reduce((sum, result) => {
    const resultConfidence = result.results.reduce((rSum, r) => rSum + r.confidence, 0) / result.results.length;
    return sum + resultConfidence;
  }, 0) / results.length;

  // Domyślna funkcja eksportu, jeśli nie dostarczono własnej
  const handleExport = React.useCallback(() => {
    if (onExport) {
      onExport();
      return;
    }

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
  }, [results, onExport]);

  const ResultCard = isSimplifiedView ? OptimizedResultCard : AnalysisResultCard;

  const handleViewChange = (view: string) => {
    console.log('Zmiana widoku:', view);
    setActiveView(view as 'list' | 'grid');
  };

  return (
    <div className="space-y-4">
      <ProcessingSummary
        fileCount={results.length}
        totalTime={totalTime}
        averageConfidence={avgConfidence}
        onExport={handleExport}
      />

      <div ref={containerRef}>
        <div className="flex justify-between items-center mb-4">
          <Tabs value={activeView} onValueChange={handleViewChange} className="w-full">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <LayoutList className="w-4 h-4" />
                  Lista
                </TabsTrigger>
                <TabsTrigger value="grid" className="flex items-center gap-2">
                  <Grid className="w-4 h-4" />
                  Siatka
                </TabsTrigger>
              </TabsList>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('Przełączanie widoku uproszczonego');
                  setIsSimplifiedView(prev => !prev);
                }}
                className="flex items-center gap-2"
              >
                {isSimplifiedView ? (
                  <>
                    <Maximize2 className="w-4 h-4" />
                    Pełny widok
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-4 h-4" />
                    Uproszczony widok
                  </>
                )}
              </Button>
            </div>

            <TabsContent value="list" className="min-h-[400px]">
              {width && groupedResults.length > 0 && (
                <VirtualizedResultsList
                  results={groupedResults}
                  width={width}
                  CardComponent={ResultCard}
                />
              )}
            </TabsContent>
            <TabsContent value="grid" className="grid grid-cols-2 gap-4">
              {groupedResults.map((result, index) => {
                console.log('Renderowanie karty w siatce:', {
                  fileName: result.fileName,
                  modelCount: Object.keys(result.modelResults).length
                });
                return (
                  <ResultCard
                    key={`${result.fileName}-${index}`} 
                    result={result}
                    modelResults={Object.values(result.modelResults)}
                  />
                );
              })}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 