import { TimingStats } from '../types/timing';

interface ProcessingSummaryProps {
  stats: TimingStats;
}

export const ProcessingSummary = ({ stats }: ProcessingSummaryProps) => {
  const formatTime = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

  const handleExportCsv = () => {
    const rows = [
      ['Metryka', 'Wartość', 'Jednostka'],
      ['Liczba dokumentów', stats.documentsProcessed.toString(), ''],
      ['Średni czas na dokument', (stats.averageTimePerDocument / 1000).toFixed(1), 's'],
      ['Czas uploadu (suma)', (stats.uploadTime / 1000).toFixed(1), 's'],
      ['Czas OCR (suma)', (stats.ocrTime / 1000).toFixed(1), 's'],
      ['Czas analizy (suma)', (stats.analysisTime / 1000).toFixed(1), 's'],
      ['Rzeczywisty czas całkowity', (stats.totalTime / 1000).toFixed(1), 's'],
      ['Przetwarzanie równoległe', stats.parallelProcessing ? 'Tak' : 'Nie', ''],
    ];

    const csvContent = rows
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `analiza-czasow-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          Przeanalizowane dokumenty ({stats.documentsProcessed})
        </h2>
        <button
          onClick={handleExportCsv}
          className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 
                   border border-gray-300 rounded-md hover:bg-gray-50 
                   transition-colors duration-200"
        >
          Eksportuj CSV
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
          <span>Średni czas na dokument:</span>
          <span className="font-medium">
            {formatTime(stats.averageTimePerDocument)}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
            <span>Upload (suma):</span>
            <span>{formatTime(stats.uploadTime)}</span>
          </div>
          <div className="flex justify-between p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
            <span>OCR (suma):</span>
            <span>{formatTime(stats.ocrTime)}</span>
          </div>
          <div className="flex justify-between p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
            <span>Analiza (suma):</span>
            <span>{formatTime(stats.analysisTime)}</span>
          </div>
          <div className="flex justify-between p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors font-medium">
            <span>Rzeczywisty czas:</span>
            <span>{formatTime(stats.totalTime)}</span>
          </div>
        </div>

        {stats.parallelProcessing && (
          <div className="text-sm text-gray-500 mt-2 p-2">
            * Sumy czasów etapów uwzględniają równoległe przetwarzanie {stats.documentsProcessed} dokumentów
          </div>
        )}
      </div>
    </div>
  );
}; 