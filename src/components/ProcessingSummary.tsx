'use client';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ProcessingSummaryProps {
  totalDocuments: number;
  totalTime: number;
  avgConfidence: number;
  successRate: number;
}

export function ProcessingSummary({
  totalDocuments,
  totalTime,
  avgConfidence,
  successRate
}: ProcessingSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Przetworzone dokumenty</h3>
        <p className="mt-2 text-3xl font-semibold">{totalDocuments}</p>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Skuteczność</span>
            <span>{Math.round(successRate * 100)}%</span>
          </div>
          <Progress value={successRate * 100} />
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Średnia pewność</h3>
        <p className="mt-2 text-3xl font-semibold">
          {Math.round(avgConfidence * 100)}%
        </p>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Czas całkowity</span>
            <span>{(totalTime / 1000).toFixed(1)}s</span>
          </div>
          <Progress value={(totalTime / (totalDocuments * 5000)) * 100} />
        </div>
      </Card>
    </div>
  );
} 