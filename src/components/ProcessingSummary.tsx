'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export interface ProcessingSummaryProps {
  fileCount: number;
  totalTime: number;
  averageConfidence: number;
  onExport: () => void;
}

export function ProcessingSummary({ fileCount, totalTime, averageConfidence, onExport }: ProcessingSummaryProps) {
  // Konwertuj timestamp na czytelny format
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(1);
      return `${minutes}m ${seconds}s`;
    }
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(1);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Podsumowanie analizy</h2>
          <div className="grid grid-cols-3 gap-8">
            <div>
              <p className="text-sm text-muted-foreground">Liczba plików</p>
              <p className="text-2xl font-semibold">{fileCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Całkowity czas</p>
              <p className="text-2xl font-semibold">{formatTime(totalTime)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Średnia pewność</p>
              <p className="text-2xl font-semibold">{(averageConfidence * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="gap-2"
          onClick={onExport}
        >
          <Download className="w-4 h-4" />
          Eksportuj wyniki
        </Button>
      </div>
    </Card>
  );
} 