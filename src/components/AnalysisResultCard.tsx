'use client';

import * as React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { truncateFileName } from '@/utils/processing';
import { FIELD_GROUPS } from '@/config/fields';
import type { ProcessingResult, FieldGroupKey, ProcessedField } from '@/types/processing';

interface AnalysisResultCardProps {
  result: ProcessingResult;
}

export function AnalysisResultCard({ result }: AnalysisResultCardProps) {
  // Oblicz średnią pewność dla wszystkich modeli
  const avgConfidence = result.results.reduce((sum, r) => sum + r.confidence, 0) / result.results.length;
  
  // Sprawdź czy wszystkie modele mają wysoką pewność
  const hasHighConfidence = avgConfidence > 0.9;
  
  // Sprawdź czy wszystkie wymagane pola są wypełnione
  const hasAllRequiredFields = result.results.every(modelResult => {
    return Object.entries(modelResult.fields).some(([_, field]) => 
      field.confidence > 0.8 && field.content !== null
    );
  });

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-medium">{truncateFileName(result.fileName)}</h3>
          <p className="text-sm text-muted-foreground">
            Przeanalizowano przez {result.results.length} {result.results.length === 1 ? 'model' : 'modele'}
          </p>
        </div>
        <div className="flex gap-2">
          {hasAllRequiredFields && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Wymagane pola
            </Badge>
          )}
          {hasHighConfidence && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Wysoka pewność
            </Badge>
          )}
        </div>
      </div>

      {/* Wyniki dla każdego modelu */}
      <div className="space-y-4">
        {result.results.map((modelResult, index) => (
          <div key={index} className="border-t pt-4 first:border-t-0 first:pt-0">
            <h4 className="font-medium mb-2">{modelResult.modelId}</h4>
            
            {/* Grupy pól */}
            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(FIELD_GROUPS) as FieldGroupKey[]).map(groupKey => {
                const group = FIELD_GROUPS[groupKey];
                const groupFields = Object.entries(modelResult.fields)
                  .filter(([fieldName]) => 
                    (group.fields as readonly string[]).includes(fieldName)
                  );

                if (groupFields.length === 0) return null;

                return (
                  <div key={groupKey} className="space-y-2">
                    <h5 className="text-sm font-medium text-muted-foreground">
                      {group.name}
                    </h5>
                    <div className="space-y-1">
                      {groupFields.map(([fieldName, field]) => (
                        <div key={fieldName} className="text-sm">
                          <div className="flex justify-between">
                            <span>{fieldName}</span>
                            <span className="text-muted-foreground">
                              {Math.round(field.confidence * 100)}%
                            </span>
                          </div>
                          <p className="text-muted-foreground">
                            {field.content || 'Nie znaleziono'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
} 