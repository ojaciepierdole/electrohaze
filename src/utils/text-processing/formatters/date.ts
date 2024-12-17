import { TextProcessor } from '../../core/text-processor';

/**
 * Formatuje datę do formatu YYYY-MM-DD
 */
export function formatDate(date: string | null): string {
  return TextProcessor.formatDate(date);
}

/**
 * Formatuje datę do formatu DD.MM.YYYY
 */
export function formatDisplayDate(date: string | null): string {
  if (!date) return '';
  
  const normalized = TextProcessor.formatDate(date);
  if (!normalized) return '';
  
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return normalized;
  
  const [_, year, month, day] = match;
  return `${day}.${month}.${year}`;
}

/**
 * Formatuje zakres dat do formatu DD.MM.YYYY - DD.MM.YYYY
 */
export function formatDateRange(startDate: string | null, endDate: string | null): string {
  const start = formatDisplayDate(startDate);
  const end = formatDisplayDate(endDate);
  
  if (!start && !end) return '';
  if (!start) return end;
  if (!end) return start;
  
  return `${start} - ${end}`;
}

/**
 * Formatuje datę i godzinę do formatu YYYY-MM-DD HH:mm:ss
 */
export function formatDateTime(dateTime: string | null): string {
  if (!dateTime) return '';
  
  // Usuń wszystkie znaki oprócz cyfr, myślników i dwukropków
  const cleaned = TextProcessor.normalize(dateTime, {
    removeSpecialChars: true,
    trimWhitespace: true
  }).replace(/[^\d:-]/g, '');
  
  // Sprawdź różne formaty daty i czasu
  const patterns = [
    // YYYY-MM-DD HH:mm:ss
    /^(\d{4})-(\d{2})-(\d{2})\s*(\d{2}):(\d{2}):(\d{2})$/,
    // YYYY-MM-DD HH:mm
    /^(\d{4})-(\d{2})-(\d{2})\s*(\d{2}):(\d{2})$/,
    // DD-MM-YYYY HH:mm:ss
    /^(\d{2})-(\d{2})-(\d{4})\s*(\d{2}):(\d{2}):(\d{2})$/,
    // DD-MM-YYYY HH:mm
    /^(\d{2})-(\d{2})-(\d{4})\s*(\d{2}):(\d{2})$/
  ];
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const [_, part1, part2, part3, hours, minutes, seconds = '00'] = match;
      
      // Jeśli format to YYYY-MM-DD
      if (part1.length === 4) {
        return `${part1}-${part2}-${part3} ${hours}:${minutes}:${seconds}`;
      }
      
      // Jeśli format to DD-MM-YYYY
      return `${part3}-${part2}-${part1} ${hours}:${minutes}:${seconds}`;
    }
  }
  
  return cleaned;
}

/**
 * Formatuje datę i godzinę do formatu DD.MM.YYYY HH:mm
 */
export function formatDisplayDateTime(dateTime: string | null): string {
  if (!dateTime) return '';
  
  const normalized = formatDateTime(dateTime);
  if (!normalized) return '';
  
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})\s*(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return normalized;
  
  const [_, year, month, day, hours, minutes] = match;
  return `${day}.${month}.${year} ${hours}:${minutes}`;
} 