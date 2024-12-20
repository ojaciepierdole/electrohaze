'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DocumentStatus } from '@/types/processing';

interface AnalysisSummaryProps {
  documents: Array<{
    documentConfidence: {
      confidence: number;
      overall: number;
    };
    timing?: {
      upload: number;
      ocr: number;
      analysis: number;
      total: number;
    };
  }>;
}

export function AnalysisSummary({ documents }: AnalysisSummaryProps) {
  // Oblicz średnie wartości
  const stats = documents.reduce((acc, doc) => {
    acc.totalConfidence += doc.documentConfidence.confidence;
    acc.totalCompleteness += doc.documentConfidence.overall;
    acc.completeCount += doc.documentConfidence.overall >= 0.8 ? 1 : 0;
    
    if (doc.timing) {
      acc.totalUploadTime += doc.timing.upload;
      acc.totalOcrTime += doc.timing.ocr;
      acc.totalAnalysisTime += doc.timing.analysis;
      acc.totalTime += doc.timing.total;
    }
    
    return acc;
  }, {
    totalConfidence: 0,
    totalCompleteness: 0,
    completeCount: 0,
    totalUploadTime: 0,
    totalOcrTime: 0,
    totalAnalysisTime: 0,
    totalTime: 0
  });

  const avgConfidence = (stats.totalConfidence / documents.length) * 100;
  const avgCompleteness = (stats.totalCompleteness / documents.length) * 100;
  const completePercentage = (stats.completeCount / documents.length) * 100;
  
  const avgUploadTime = stats.totalUploadTime / documents.length;
  const avgOcrTime = stats.totalOcrTime / documents.length;
  const avgAnalysisTime = stats.totalAnalysisTime / documents.length;
  const avgProcessingTime = stats.totalTime / documents.length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Średnia pewność</h3>
        <div className="mt-2">
          <div className="text-2xl font-bold text-gray-900">{avgConfidence.toFixed(1)}%</div>
          <Progress value={avgConfidence} className="mt-2" />
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Średnia kompletność</h3>
        <div className="mt-2">
          <div className="text-2xl font-bold text-gray-900">{avgCompleteness.toFixed(1)}%</div>
          <Progress value={avgCompleteness} className="mt-2" />
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Kompletne dokumenty</h3>
        <div className="mt-2">
          <div className="text-2xl font-bold text-gray-900">{completePercentage.toFixed(1)}%</div>
          <div className="text-sm text-gray-500 mt-1">
            {stats.completeCount} z {documents.length} dokumentów
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Średni czas przetwarzania</h3>
        <div className="mt-2">
          <div className="text-2xl font-bold text-gray-900">{(avgProcessingTime / 1000).toFixed(1)}s</div>
          <div className="space-y-1 text-sm text-gray-500 mt-2">
            <div className="flex justify-between">
              <span>Upload:</span>
              <span>{(avgUploadTime / 1000).toFixed(2)}s</span>
            </div>
            <div className="flex justify-between">
              <span>OCR:</span>
              <span>{(avgOcrTime / 1000).toFixed(2)}s</span>
            </div>
            <div className="flex justify-between">
              <span>Analiza:</span>
              <span>{(avgAnalysisTime / 1000).toFixed(2)}s</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 