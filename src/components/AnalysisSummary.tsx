'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { ProcessingResult, DocumentField } from '@/types/processing';
import { cn } from '@/lib/utils';

interface AnalysisSummaryProps {
  documents: ProcessingResult[];
  onExport?: () => void;
  usabilityResults: boolean[];
}

export function AnalysisSummary({ documents, onExport, usabilityResults }: AnalysisSummaryProps) {
  // Oblicz średnią pewność bezpośrednio z API
  const averageConfidence = documents.length > 0
    ? documents.reduce((sum, doc) => sum + (doc.modelResults?.[0]?.confidence || 0), 0) / documents.length
    : 0;

  // Oblicz rozkład pewności jako procent całości
  const totalDocs = documents.length;
  const confidenceDistribution = {
    high: {
      count: documents.filter(doc => (doc.modelResults?.[0]?.confidence || 0) >= 0.9).length,
      percentage: totalDocs > 0 ? (documents.filter(doc => (doc.modelResults?.[0]?.confidence || 0) >= 0.9).length / totalDocs * 100) : 0
    },
    medium: {
      count: documents.filter(doc => (doc.modelResults?.[0]?.confidence || 0) >= 0.7 && (doc.modelResults?.[0]?.confidence || 0) < 0.9).length,
      percentage: totalDocs > 0 ? (documents.filter(doc => (doc.modelResults?.[0]?.confidence || 0) >= 0.7 && (doc.modelResults?.[0]?.confidence || 0) < 0.9).length / totalDocs * 100) : 0
    },
    low: {
      count: documents.filter(doc => (doc.modelResults?.[0]?.confidence || 0) < 0.7).length,
      percentage: totalDocs > 0 ? (documents.filter(doc => (doc.modelResults?.[0]?.confidence || 0) < 0.7).length / totalDocs * 100) : 0
    }
  };

  // Oblicz czasy przetwarzania
  const processingTimes = documents.map(doc => ({
    total: doc.processingTime || 0,
    upload: doc.uploadTime || 0,
    ocr: doc.ocrTime || 0,
    analysis: doc.analysisTime || 0
  }));

  // Oblicz średnie czasy dla wszystkich dokumentów
  const totalTimes = {
    total: processingTimes.reduce((sum, times) => sum + times.total, 0),
    upload: processingTimes.reduce((sum, times) => sum + times.upload, 0),
    ocr: processingTimes.reduce((sum, times) => sum + times.ocr, 0),
    analysis: processingTimes.reduce((sum, times) => sum + times.analysis, 0)
  };

  // Oblicz formaty MIME i zabezpiecz przed błędami
  const mimeTypes = documents.reduce((acc, doc) => {
    const mime = doc.mimeType || 'application/pdf';
    const format = mime.split('/')[1]?.toUpperCase() || 'PDF';
    acc[format] = (acc[format] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Oblicz procent przydatnych dokumentów
  const usableDocuments = usabilityResults.filter(Boolean).length;
  const usabilityPercentage = documents.length > 0
    ? (usableDocuments / documents.length) * 100
    : 0;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Podsumowanie analizy</h2>
          {onExport && (
            <Button onClick={onExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Eksportuj wyniki
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Liczba dokumentów i czasy */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm font-medium text-gray-500">Przeanalizowane dokumenty</div>
            <div className="mt-1 space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-semibold">{documents.length}</div>
                <div className="text-sm text-gray-500">
                  {(totalTimes.total / documents.length / 1000).toFixed(1)}s / dokument
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Upload:</span>
                  <span>{(totalTimes.upload / 1000).toFixed(1)}s</span>
                </div>
                <div className="flex justify-between">
                  <span>OCR:</span>
                  <span>{(totalTimes.ocr / 1000).toFixed(1)}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Analiza:</span>
                  <span>{(totalTimes.analysis / 1000).toFixed(1)}s</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Całkowity:</span>
                  <span>{(totalTimes.total / 1000).toFixed(1)}s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Średnia pewność */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm font-medium text-gray-500">Średnia pewność</div>
            <div className="mt-1 space-y-2">
              <div className="flex items-baseline justify-between">
                <div className={cn(
                  "text-2xl font-semibold",
                  averageConfidence >= 0.9 ? "text-green-600" :
                  averageConfidence >= 0.7 ? "text-yellow-600" :
                  "text-red-600"
                )}>
                  {(averageConfidence * 100).toFixed(1)}%
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-500">
                <div className="flex justify-between items-center">
                  <Badge variant="secondary" className="bg-green-50 text-green-700">
                    Wysoka (&ge;90%)
                  </Badge>
                  <span className="text-sm font-medium">{confidenceDistribution.high.count} ({confidenceDistribution.high.percentage.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">
                    Średnia (70-89%)
                  </Badge>
                  <span className="text-sm font-medium">{confidenceDistribution.medium.count} ({confidenceDistribution.medium.percentage.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary" className="bg-red-50 text-red-700">
                    Niska (&lt;70%)
                  </Badge>
                  <span className="text-sm font-medium">{confidenceDistribution.low.count} ({confidenceDistribution.low.percentage.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Formaty MIME */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm font-medium text-gray-500">Formaty dokumentów</div>
            <div className="mt-1 space-y-1">
              {Object.entries(mimeTypes).map(([format, count]) => (
                <div key={format} className="flex justify-between items-center">
                  <span className="text-sm">{format}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Minimalny komplet danych */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm font-medium text-gray-500">Minimalny komplet danych</div>
            <div className="mt-1 flex items-baseline justify-between">
              <div className="text-2xl font-semibold">
                {usableDocuments} z {documents.length}
              </div>
              <div className={cn(
                "text-sm font-medium",
                usabilityPercentage >= 90 ? "text-green-600" :
                usabilityPercentage >= 70 ? "text-yellow-600" :
                "text-red-600"
              )}>
                {usabilityPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
} 