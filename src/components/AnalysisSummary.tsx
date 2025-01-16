'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { ProcessingResult, DocumentField } from '@/types/processing';
import { cn } from '@/lib/utils';

interface AnalysisSummaryProps {
  documents: any[];
  onExport?: () => void;
  usabilityResults: boolean[];
}

export function AnalysisSummary({ documents, onExport, usabilityResults }: AnalysisSummaryProps) {
  // Oblicz procent przydatnych dokumentów
  const usableCount = usabilityResults.filter(Boolean).length;
  const usabilityRate = documents.length > 0 ? (usableCount / documents.length) * 100 : 0;

  // Oblicz rozkład przydatności
  const totalDocs = documents.length;
  const usabilityDistribution = {
    usable: {
      count: usableCount,
      percentage: totalDocs > 0 ? (usableCount / totalDocs * 100) : 0
    },
    unusable: {
      count: totalDocs - usableCount,
      percentage: totalDocs > 0 ? ((totalDocs - usableCount) / totalDocs * 100) : 0
    }
  };

  return (
    <div className="space-y-4">
      {/* Nagłówek z przyciskiem eksportu */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">
          Wyniki analizy
        </h2>
        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Eksportuj
          </Button>
        )}
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {/* Przydatność */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm font-medium text-gray-500">Przydatność</div>
          <div className="mt-1 space-y-2">
            <div className="flex items-baseline justify-between">
              <div className={cn(
                "text-2xl font-semibold",
                usabilityRate >= 90 ? "text-green-600" :
                usabilityRate >= 70 ? "text-yellow-600" :
                "text-red-600"
              )}>
                {usabilityRate.toFixed(1)}%
              </div>
            </div>
            <div className="space-y-1 text-sm text-gray-500">
              <div className="flex justify-between items-center">
                <Badge variant="secondary" className="bg-green-50 text-green-700">
                  Przydatne
                </Badge>
                <span className="text-sm font-medium">{usabilityDistribution.usable.count} ({usabilityDistribution.usable.percentage.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between items-center">
                <Badge variant="secondary" className="bg-red-50 text-red-700">
                  Nieprzydatne
                </Badge>
                <span className="text-sm font-medium">{usabilityDistribution.unusable.count} ({usabilityDistribution.unusable.percentage.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Typy dokumentów */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm font-medium text-gray-500">Typy dokumentów</div>
          <div className="mt-1 space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-semibold text-gray-900">
                {documents.length}
              </div>
            </div>
            <div className="space-y-1 text-sm text-gray-500">
              <div className="flex justify-between items-center">
                <Badge variant="secondary" className="bg-gray-50 text-gray-700">
                  PDF
                </Badge>
                <span className="text-sm font-medium">{documents.length} (100%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 