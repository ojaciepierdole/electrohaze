'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FIELD_GROUPS } from '@/config/fields';
import type { ProcessingResult } from '@/types/processing';

interface AnalysisResultCardProps {
  result: ProcessingResult;
}

export function AnalysisResultCard({ result }: AnalysisResultCardProps) {
  const modelResult = result.results[0];
  const fields = modelResult.fields;

  // Grupuj pola według kategorii
  const groupedFields = React.useMemo(() => {
    const groups = {} as Record<string, typeof fields>;
    
    Object.entries(fields).forEach(([key, field]) => {
      const group = field.definition.group;
      if (!groups[group]) {
        groups[group] = {};
      }
      groups[group][key] = field;
    });

    return groups;
  }, [fields]);

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{result.fileName}</h3>
            <p className="text-sm text-muted-foreground">
              Przeanalizowano przez {result.results.length} model
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">
              Wymagane pola
            </Badge>
            <Badge variant="outline">
              Wysoka pewność
            </Badge>
          </div>
        </div>

        <div className="grid gap-6">
          {Object.entries(FIELD_GROUPS).map(([groupKey, group]) => {
            const groupFields = groupedFields[groupKey];
            if (!groupFields || Object.keys(groupFields).length === 0) return null;

            return (
              <div key={groupKey} className="space-y-2">
                <div className="flex items-center gap-2">
                  <group.icon className="w-4 h-4" />
                  <h4 className="font-medium">{group.name}</h4>
                </div>
                <div className="grid gap-2">
                  {Object.entries(groupFields).map(([fieldName, field]) => (
                    <div key={fieldName} className="flex justify-between items-start text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{field.definition.name}</span>
                        <div className="text-muted-foreground">
                          {field.content || 'Nie znaleziono'}
                        </div>
                      </div>
                      <Badge 
                        variant={field.confidence > 0.9 ? "outline" : "secondary"}
                        className="ml-2"
                      >
                        {(field.confidence * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
} 