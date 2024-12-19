import { TimingStats } from '../types/timing';

interface ProcessingSummaryProps {
  stats: TimingStats;
}

export const ProcessingSummary = ({ stats }: ProcessingSummaryProps) => {
  const formatTime = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">
        Przeanalizowane dokumenty ({stats.documentsProcessed})
      </h2>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Średni czas na dokument:</span>
          <span className="font-medium">
            {formatTime(stats.averageTimePerDocument)}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Upload (suma):</span>
            <span>{formatTime(stats.uploadTime)}</span>
          </div>
          <div className="flex justify-between">
            <span>OCR (suma):</span>
            <span>{formatTime(stats.ocrTime)}</span>
          </div>
          <div className="flex justify-between">
            <span>Analiza (suma):</span>
            <span>{formatTime(stats.analysisTime)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Rzeczywisty czas:</span>
            <span>{formatTime(stats.totalTime)}</span>
          </div>
        </div>

        {stats.parallelProcessing && (
          <div className="text-sm text-gray-500 mt-2">
            * Sumy czasów etapów uwzględniają równoległe przetwarzanie {stats.documentsProcessed} dokumentów
          </div>
        )}
      </div>
    </div>
  );
}; 