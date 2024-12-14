'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText, Clock, Zap, Database, BarChart2, CheckCircle2, AlertCircle } from 'lucide-react';
import { aggregateDocumentsConfidence } from '@/utils/text-formatting';

interface AnalysisSummaryProps {
  documents: Array<{ modelResults: Array<{ fields: Record<string, any> }> }>;
  totalTime: number;
  onExport?: () => void;
}

function formatTime(milliseconds: number): string {
  const totalSeconds = milliseconds / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${seconds}s`;
}

export function AnalysisSummary({ documents, totalTime, onExport }: AnalysisSummaryProps) {
  const processedDocuments = documents
    .filter(doc => doc.modelResults && doc.modelResults.length > 0)
    .map(doc => ({
      fields: doc.modelResults.reduce((acc, model) => ({
        ...acc,
        ...model.fields
      }), {})
    }));

  const stats = aggregateDocumentsConfidence(processedDocuments);
  const completionPercentage = Math.round((stats.totalFilledFields / stats.totalFields) * 100);
  const confidencePercentage = Math.round(stats.averageConfidence * 100);
  const averageTimePerFile = totalTime / stats.documentsCount;

  // Oblicz statystyki pól
  const allFields = Object.values(processedDocuments[0]?.fields || {});
  const highConfidenceFields = allFields.filter(f => (f as any)?.confidence > 0.8).length;
  const mediumConfidenceFields = allFields.filter(f => (f as any)?.confidence > 0.6 && (f as any)?.confidence <= 0.8).length;
  const lowConfidenceFields = allFields.filter(f => (f as any)?.confidence <= 0.6).length;

  if (processedDocuments.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg font-medium">Podsumowanie analizy</CardTitle>
          </div>
          {onExport && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExport}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Eksportuj CSV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Główne wskaźniki */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="bg-gray-50/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Dokumenty</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{stats.documentsCount}</div>
              <div className="text-sm text-gray-500">
                {stats.totalFields} pól do analizy
              </div>
            </div>
          </div>

          <div className="bg-gray-50/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Czas</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{formatTime(totalTime)}</div>
              <div className="text-sm text-gray-500">
                {formatTime(averageTimePerFile)} na dokument
              </div>
            </div>
          </div>

          <div className="bg-gray-50/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Rozpoznane pola</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{stats.totalFilledFields}</span>
                <Badge variant="outline">{completionPercentage}%</Badge>
              </div>
              <div className="text-sm text-gray-500">
                {stats.totalFields - stats.totalFilledFields} brakujących
              </div>
            </div>
          </div>

          <div className="bg-gray-50/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Pewność</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{confidencePercentage}%</span>
                <Badge 
                  variant={
                    confidencePercentage > 80 ? "success" : 
                    confidencePercentage > 60 ? "warning" : 
                    "destructive"
                  }
                >
                  {confidencePercentage > 80 ? "wysoka" : confidencePercentage > 60 ? "średnia" : "niska"}
                </Badge>
              </div>
              <div className="text-sm text-gray-500">
                średnia pewność
              </div>
            </div>
          </div>
        </div>

        {/* Szczegółowe statystyki */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="bg-gray-50/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-3">Rozkład pewności</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="success">wysoka</Badge>
                  <span className="text-sm text-gray-600">&gt;80%</span>
                </div>
                <span className="text-sm font-medium">{highConfidenceFields} pól</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="warning">średnia</Badge>
                  <span className="text-sm text-gray-600">60-80%</span>
                </div>
                <span className="text-sm font-medium">{mediumConfidenceFields} pól</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">niska</Badge>
                  <span className="text-sm text-gray-600">&lt;60%</span>
                </div>
                <span className="text-sm font-medium">{lowConfidenceFields} pól</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-3">Czasy przetwarzania</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">OCR</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{formatTime(totalTime * 0.7)}</span>
                  <span className="text-xs text-gray-500">70%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Analiza</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{formatTime(totalTime * 0.3)}</span>
                  <span className="text-xs text-gray-500">30%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Średnio na stronę</span>
                <span className="text-sm font-medium">{formatTime(totalTime / stats.documentsCount)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 