// Pomocnicza funkcja do normalizacji formatu daty
function normalizeDate(date: string): string {
  // Usuń zbędne białe znaki
  date = date.trim();
  
  // Obsługa różnych separatorów
  date = date.replace(/[./]/g, '-');
  
  // Sprawdź czy data jest w formacie DD-MM-YYYY
  const ddmmyyyy = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
  if (ddmmyyyy.test(date)) {
    const [_, day, month, year] = ddmmyyyy.exec(date) || [];
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Sprawdź czy data jest w formacie YYYY-MM-DD
  const yyyymmdd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  if (yyyymmdd.test(date)) {
    const [_, year, month, day] = yyyymmdd.exec(date) || [];
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Sprawdź czy data jest w formacie DD.MM.YYYY
  const ddmmyyyyDot = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
  if (ddmmyyyyDot.test(date)) {
    const [_, day, month, year] = ddmmyyyyDot.exec(date) || [];
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return date;
}

// Pomocnicza funkcja do walidacji daty
function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

// Funkcja do formatowania daty
export function formatDate(date: string | null): string {
  if (!date) return '';
  
  try {
    // Normalizuj format daty
    const normalizedDate = normalizeDate(date);
    
    // Konwertuj na obiekt Date
    const dateObj = new Date(normalizedDate);
    
    // Sprawdź czy data jest poprawna
    if (!isValidDate(dateObj)) {
      console.warn(`Invalid date format: ${date}`);
      return 'Nieprawidłowa data';
    }
    
    // Formatuj datę
    return dateObj.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error(`Error formatting date: ${date}`, error);
    return 'Nieprawidłowa data';
  }
}

// Funkcja do formatowania zużycia energii
export function formatConsumption(value: number | null): string {
  if (value === null) return '';
  return `${value.toLocaleString('pl-PL')} kWh`;
}

// Funkcja do formatowania kwoty
export function formatAmount(value: number | null): string {
  if (value === null) return '';
  return value.toLocaleString('pl-PL', {
    style: 'currency',
    currency: 'PLN'
  });
}

// Funkcja do formatowania procentów
export function formatPercentage(value: number | null): string {
  if (value === null) return '';
  return value.toLocaleString('pl-PL', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Funkcja do formatowania liczby całkowitej
export function formatInteger(value: number | null): string {
  if (value === null) return '';
  return value.toLocaleString('pl-PL');
}

// Funkcja do formatowania liczby zmiennoprzecinkowej
export function formatDecimal(value: number | null, decimals: number = 2): string {
  if (value === null) return '';
  return value.toLocaleString('pl-PL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
} 