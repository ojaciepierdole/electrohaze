'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProcessingResult, DocumentField } from '@/types/processing';
import { Progress } from '@/components/ui/progress';

export interface DocumentListProps {
  files?: File[];
  results?: ProcessingResult[];
  onRemove?: (index: number) => void;
  isProcessing?: boolean;
  progress?: number;
}

export function DocumentList({ files, results, onRemove, isProcessing, progress }: DocumentListProps) {
  if (isProcessing) {
    return (
      <div className="space-y-2 bg-white rounded-lg p-4 border">
        <div className="flex justify-between text-sm text-slate-600">
          <span>Postęp analizy</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    );
  }

  if (files && files.length > 0) {
    return (
      <div className="space-y-1 p-2">
        {files.map((file, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between py-2 px-3 bg-white rounded-md hover:bg-slate-50 group"
          >
            <span className="text-sm text-slate-600 truncate flex-1 mr-4">{file.name}</span>
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(index)}
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4 text-slate-400 hover:text-red-500" />
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (results && results.length > 0) {
    return (
      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-4">
              {/* Nagłówek z nazwą pliku i ogólną pewnością */}
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="text-lg font-medium">{result.fileName}</h3>
                <span className="text-sm text-muted-foreground">
                  Pewność: {((result.confidence || 0) * 100).toFixed(1)}%
                </span>
              </div>
              
              {/* Statystyki przetwarzania */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium text-slate-700">Statystyki przetwarzania</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Średnia pewność</p>
                    <p className="text-lg font-medium">{(result.stats.averageConfidence * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Czas przetwarzania</p>
                    <p className="text-lg font-medium">{(result.stats.processingTime / 1000).toFixed(2)}s</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Typ pliku</p>
                    <p className="text-lg font-medium">{result.stats.mimeType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Liczba pól</p>
                    <p className="text-lg font-medium">{result.stats.totalFields}</p>
                  </div>
                </div>
                
                {/* Zakresy pewności */}
                <div className="mt-4">
                  <p className="text-sm text-slate-600 mb-2">Rozkład pewności pól</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-600">Wysoka (&gt;90%)</span>
                      <span className="text-sm font-medium">{result.stats.confidenceRanges.high}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-yellow-600">Średnia (70-90%)</span>
                      <span className="text-sm font-medium">{result.stats.confidenceRanges.medium}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-600">Niska (&lt;70%)</span>
                      <span className="text-sm font-medium">{result.stats.confidenceRanges.low}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Zmapowane dane */}
              {Object.entries(result.mappedData || {}).map(([group, fields]) => (
                <div key={group} className="space-y-1 py-2">
                  <h4 className="text-sm font-medium capitalize">{group.replace(/_/g, ' ')}</h4>
                  <div className="pl-4 grid gap-1">
                    {Object.entries(fields as Record<string, DocumentField>).map(([field, value]) => (
                      <div key={field} className="text-sm flex items-center justify-between">
                        <span className="font-medium text-slate-600">{field}:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900">{value.content}</span>
                          <span className="text-xs text-slate-400">
                            ({(value.confidence * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return null;
} 