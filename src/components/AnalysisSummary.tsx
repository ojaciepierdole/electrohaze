'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { ProcessingResult, DocumentField, FieldWithConfidence } from '@/types/processing';
import { cn } from '@/lib/utils';
import { ConfidenceSummary } from './ConfidenceSummary';
import { ConfidenceStats, FieldConfidence } from '../types/confidence';
import { DocumentSections } from '@/utils/data-processing/completeness/confidence';
import { ConfidenceCalculator } from '../utils/confidence-calculator';
import { TimingStats } from '../types/timing';

interface AnalysisSummaryProps {
  sections?: DocumentSections;
  processingTimes: TimingStats;
  documentCount: number;
  validDocuments: number;
}

export function AnalysisSummary({ 
  sections, 
  processingTimes,
  documentCount,
  validDocuments 
}: AnalysisSummaryProps) {
  console.log('AnalysisSummary props:', { sections, processingTimes, documentCount, validDocuments });

  if (documentCount === 0 || !processingTimes) {
    return null;
  }

  const times = {
    uploadTime: processingTimes?.uploadTime ?? 0,
    ocrTime: processingTimes?.ocrTime ?? 0,
    analysisTime: processingTimes?.analysisTime ?? 0,
    totalTime: processingTimes?.totalTime ?? 0
  };

  const averageTime = documentCount > 0 ? times.totalTime / documentCount : 0;

  const confidenceFields: FieldConfidence[] = Object.entries(sections || {})
    .flatMap(([_, fields]) => 
      Object.entries(fields as Record<string, FieldWithConfidence>)
        .filter(([_, field]) => field.confidence !== undefined)
        .map(([fieldName, field]) => ({
          fieldName,
          confidence: field.confidence
        }))
    );

  const confidenceStats = ConfidenceCalculator.calculateStats(confidenceFields);
  const averageConfidence = ConfidenceCalculator.getAverageConfidence(confidenceFields);
  const completenessPercentage = (validDocuments / documentCount) * 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="rounded-lg bg-white p-3 shadow-sm">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Przeanalizowane dokumenty</h3>
        <div>
          <div className="flex items-baseline gap-2">
            <div className="text-lg font-bold">{documentCount}</div>
            <div className="text-xs text-gray-500">
              {formatTime(times.totalTime / documentCount)} / dokument
            </div>
          </div>
          <div className="space-y-0.5 text-xs text-gray-600 mt-2">
            <div className="flex justify-between items-center">
              <span>Upload:</span>
              <div>
                <span>{formatTime(times.uploadTime)}</span>
                <span className="text-gray-400 ml-1">({formatTime(times.uploadTime / documentCount)} / dok.)</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>OCR:</span>
              <span>{formatTime(times.ocrTime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Analiza:</span>
              <span>{formatTime(times.analysisTime)}</span>
            </div>
            <div className="flex justify-between items-center font-medium">
              <span>Całkowity:</span>
              <span>{formatTime(times.totalTime)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-3 shadow-sm">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Średnia pewność</h3>
        <div>
          <div className="text-lg font-bold text-green-600 mb-2">
            {averageConfidence.toFixed(1)}%
          </div>
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between items-center bg-green-50 text-green-700 rounded px-2 py-1">
              <span>Wysoka (≥90%)</span>
              <span>{confidenceStats.high} ({((confidenceStats.high / confidenceStats.total) * 100).toFixed(1)}%)</span>
            </div>
            <div className="flex justify-between items-center bg-yellow-50 text-yellow-700 rounded px-2 py-1">
              <span>Średnia (70-89%)</span>
              <span>{confidenceStats.medium} ({((confidenceStats.medium / confidenceStats.total) * 100).toFixed(1)}%)</span>
            </div>
            <div className="flex justify-between items-center bg-red-50 text-red-700 rounded px-2 py-1">
              <span>Niska (&lt;70%)</span>
              <span>{confidenceStats.low} ({((confidenceStats.low / confidenceStats.total) * 100).toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-3 shadow-sm">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Formaty dokumentów</h3>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-gray-600">PDF</span>
          <span className="text-lg font-bold">{documentCount}</span>
        </div>
      </div>

      <div className="rounded-lg bg-white p-3 shadow-sm">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Minimalny komplet danych</h3>
        <div>
          <div className="flex items-baseline gap-2">
            <div className="text-lg font-bold">{validDocuments} z {documentCount}</div>
            <div className="text-xs text-gray-500">
              {completenessPercentage.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
} 