// Ten komponent został zastąpiony przez AnalysisSummary
// i zostanie usunięty w następnej iteracji refaktoryzacji

interface ProcessingSummaryProps {
  fileCount: number;
  totalTime: number;
  averageConfidence: number;
  onExport: () => void;
}

export function ProcessingSummary({ fileCount, totalTime, averageConfidence, onExport }: ProcessingSummaryProps) {
  console.warn('ProcessingSummary jest przestarzały. Użyj AnalysisSummary zamiast tego.');
  return null;
} 