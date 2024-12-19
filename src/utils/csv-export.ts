import { TimingStats } from '../types/timing';

export function downloadTimingsCsv(stats: TimingStats) {
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
  link.setAttribute('download', `analiza-czasow-${formatDate(new Date())}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
} 