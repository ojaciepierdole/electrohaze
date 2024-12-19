import { ConfidenceStats } from '../types/confidence';

interface ConfidenceSummaryProps {
  stats: ConfidenceStats;
  averageConfidence: number;
}

export const ConfidenceSummary = ({ stats, averageConfidence }: ConfidenceSummaryProps) => {
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatCount = (count: number, total: number) => 
    `${count} (${((count / total) * 100).toFixed(1)}%)`;

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">
        Średnia pewność
      </h2>
      
      <div className="text-4xl font-bold text-green-600 mb-6">
        {formatPercentage(averageConfidence)}
      </div>

      <div className="space-y-2">
        <div className="flex items-center p-2 bg-green-50 rounded">
          <div className="flex-1">
            <span className="text-green-700">Wysoka (≥90%)</span>
          </div>
          <div className="font-medium text-green-700">
            {formatCount(stats.high, stats.total)}
          </div>
        </div>

        <div className="flex items-center p-2 bg-yellow-50 rounded">
          <div className="flex-1">
            <span className="text-yellow-700">Średnia (70-89%)</span>
          </div>
          <div className="font-medium text-yellow-700">
            {formatCount(stats.medium, stats.total)}
          </div>
        </div>

        <div className="flex items-center p-2 bg-red-50 rounded">
          <div className="flex-1">
            <span className="text-red-700">Niska (&lt;70%)</span>
          </div>
          <div className="font-medium text-red-700">
            {formatCount(stats.low, stats.total)}
          </div>
        </div>
      </div>
    </div>
  );
}; 