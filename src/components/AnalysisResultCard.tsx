'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { PPEDataGroup } from '@/components/data-groups/PPEDataGroup';
import { ProcessingResult } from '@/types/processing';

interface AnalysisResultCardProps {
  result: ProcessingResult;
}

export function AnalysisResultCard({ result }: AnalysisResultCardProps) {
  const confidence = result.documentConfidence?.overall || result.confidence || 0;
  const ppeFields = result.mappedData?.ppe || {};
  
  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Wyniki analizy</h2>
        <div className="text-sm text-muted-foreground">
          Pewność: {Math.round(confidence * 100)}%
        </div>
      </div>
      
      <PPEDataGroup 
        fields={ppeFields} 
        confidence={confidence}
      />
    </Card>
  );
} 