'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProcessingResult, DocumentField } from '@/types/processing';

export interface DocumentListProps {
  files?: File[];
  results?: ProcessingResult[];
  onRemove?: (index: number) => void;
}

export function DocumentList({ files, results, onRemove }: DocumentListProps) {
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
            <div className="space-y-2">
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="text-lg font-medium">{result.fileName}</h3>
                <span className="text-sm text-muted-foreground">
                  Pewność: {((result.confidence || 0) * 100).toFixed(1)}%
                </span>
              </div>
              
              {/* Wyświetl zmapowane dane */}
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