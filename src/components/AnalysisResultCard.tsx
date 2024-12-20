'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataField } from '@/components/ui/data-field';
import { PPEDataGroup } from '@/components/data-groups/PPEDataGroup';
import type { AnalysisResult } from '@/lib/types';
import { getFieldValue, getFieldConfidence } from '@/utils/document-fields';

interface Props {
  result: AnalysisResult;
}

export function AnalysisResultCard({ result }: Props) {
  const { fileName, mappedData, documentConfidence } = result;

  // Oblicz ogólną pewność dokumentu
  const overallConfidence = documentConfidence.overall;
  const confidenceColor = overallConfidence > 0.8 ? 'success' : overallConfidence > 0.6 ? 'warning' : 'destructive';

  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium">{fileName}</h3>
          <p className="text-sm text-muted-foreground">
            Pewność: {Math.round(overallConfidence * 100)}%
          </p>
        </div>
        <Badge variant={confidenceColor}>
          {confidenceColor === 'success' ? 'Wysoka pewność' : 
           confidenceColor === 'warning' ? 'Średnia pewność' : 
           'Niska pewność'}
        </Badge>
      </div>

      <div className="grid gap-4">
        <PPEDataGroup 
          fields={mappedData.delivery_point} 
          confidence={documentConfidence.groups.delivery_point}
        />
      </div>
    </Card>
  );
} 