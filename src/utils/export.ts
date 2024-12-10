/**
 * Funkcja pomocnicza do eksportu danych do pliku CSV
 */

interface ExportableData {
  [key: string]: string | number | null | undefined;
}

export function exportToCSV(data: ExportableData[], filename: string) {
  if (!data.length) {
    console.warn('Brak danych do eksportu');
    return;
  }

  try {
    // Przygotuj nagłówki
    const headers = Object.keys(data[0]);
    
    // Przygotuj BOM dla poprawnej obsługi polskich znaków
    const BOM = '\uFEFF';
    
    // Konwertuj dane do formatu CSV
    const csvContent = [
      // Nagłówki - zamień _ na spacje i sformatuj
      headers.map(header => 
        `"${header.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}"`
      ).join(';'),

      // Wiersze danych
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          
          // Obsługa wartości null/undefined
          if (value == null) return '';
          
          // Formatowanie liczb
          if (typeof value === 'number') {
            if (header.toLowerCase().includes('confidence')) {
              return (value * 100).toFixed(1);
            }
            if (header.toLowerCase().includes('time')) {
              return value.toString();
            }
            return value.toString();
          }
          
          // Obsługa stringów ze średnikami lub cudzysłowami
          if (typeof value === 'string') {
            if (value.includes(';') || value.includes('"') || value.includes('\n')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }
          
          return '';
        }).join(';')
      )
    ].join('\n');

    // Utwórz blob z BOM dla poprawnej obsługi polskich znaków
    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });

    // Utwórz link do pobrania
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    
    // Symuluj kliknięcie i usuń link
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

  } catch (error) {
    console.error('Błąd podczas eksportu do CSV:', error);
  }
} 