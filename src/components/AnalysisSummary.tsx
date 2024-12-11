'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { aggregateDocumentsConfidence } from '@/utils/text-formatting';

interface AnalysisSummaryProps {
  documents: Array<{ fields: Record<string, any> }>;
  totalTime: number;
  onExport?: () => void;
}

export function AnalysisSummary({ documents, totalTime, onExport }: AnalysisSummaryProps) {
  const stats = aggregateDocumentsConfidence(documents);
  const completionPercentage = Math.round((stats.totalFilledFields / stats.totalFields) * 100);
  const confidencePercentage = Math.round(stats.averageConfidence * 100);
  const averageTimePerFile = totalTime / stats.documentsCount;

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Podsumowanie analizy</CardTitle>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Eksportuj wyniki
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <dt className="text-sm text-gray-500">Liczba plików</dt>
            <dd className="text-2xl font-medium">{stats.documentsCount}</dd>
          </div>

          <div className="space-y-1">
            <dt className="text-sm text-gray-500">Czas przetwarzania</dt>
            <dd className="flex flex-col">
              <span className="text-2xl font-medium">{totalTime.toFixed(1)}s</span>
              <span className="text-sm text-gray-500">
                ({averageTimePerFile.toFixed(1)}s/plik)
              </span>
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="text-sm text-gray-500">Pewność</dt>
            <dd className="flex items-center gap-2">
              <span className="text-2xl font-medium">{confidencePercentage}%</span>
              <Badge 
                variant={
                  confidencePercentage > 80 ? "success" : 
                  confidencePercentage > 60 ? "warning" : 
                  "destructive"
                }
              >
                średnia
              </Badge>
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="text-sm text-gray-500">Kompletność</dt>
            <dd className="flex items-center gap-2">
              <span className="text-2xl font-medium">{completionPercentage}%</span>
              <Badge variant="outline">
                danych
              </Badge>
            </dd>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 