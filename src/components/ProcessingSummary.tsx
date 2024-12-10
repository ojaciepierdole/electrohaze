'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export interface ProcessingSummaryProps {
  totalFiles: number;
  totalTime: number;
  avgConfidence: number;
  onExport?: () => void;
}

export function ProcessingSummary({
  totalFiles,
  totalTime,
  avgConfidence,
  onExport
}: ProcessingSummaryProps) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Podsumowanie analizy</h2>
          <div className="grid grid-cols-3 gap-8">
            <div>
              <p className="text-sm text-muted-foreground">Liczba plików</p>
              <p className="text-2xl font-semibold">{totalFiles}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Całkowity czas</p>
              <p className="text-2xl font-semibold">{(totalTime / 1000).toFixed(1)}s</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Średnia pewność</p>
              <p className="text-2xl font-semibold">{(avgConfidence * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {onExport && (
          <Button 
            onClick={onExport} 
            variant="outline" 
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Eksportuj wyniki
          </Button>
        )}
      </div>
    </Card>
  );
} 