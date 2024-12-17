import { MappedDocumentResult } from '@/types/processing';
import { Logger } from '@/lib/logger';

const logger = Logger.getInstance();

export function validateMappedResult(result: MappedDocumentResult): boolean {
  try {
    // Sprawdź czy wymagane pola są obecne
    if (!result.documentId || !result.status) {
      logger.error('Brak wymaganych pól w wyniku mapowania');
      return false;
    }

    // Sprawdź czy daty są poprawne
    if (!result.createdOn || !result.lastUpdatedOn) {
      logger.error('Brak wymaganych dat w wyniku mapowania');
      return false;
    }

    // Sprawdź czy wszystkie sekcje danych są obecne
    if (!result.customer || !result.ppe || !result.correspondence || !result.supplier || !result.billing) {
      logger.error('Brak wymaganych sekcji danych w wyniku mapowania');
      return false;
    }

    // Sprawdź czy metadane są poprawne
    if (!result.metadata || typeof result.metadata !== 'object') {
      logger.error('Niepoprawne metadane w wyniku mapowania');
      return false;
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
    logger.error('Błąd podczas walidacji wyniku mapowania:', { error: errorMessage });
    return false;
  }
}

// Sprawdza czy pole ma wartość
export function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

// Sprawdza czy pole jest obiektem
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Sprawdza czy pole jest tablicą
export function isArray(value: unknown): value is Array<unknown> {
  return Array.isArray(value);
}

// Sprawdza czy pole jest liczbą
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

// Sprawdza czy pole jest tekstem
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Sprawdza czy pole jest datą
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

// Sprawdza czy pole jest poprawnym identyfikatorem
export function isValidId(value: unknown): boolean {
  return isString(value) && value.length > 0;
}

// Sprawdza czy pole jest poprawnym statusem
export function isValidStatus(value: unknown): boolean {
  return isString(value) && ['pending', 'processing', 'completed', 'error'].includes(value);
}

// Sprawdza czy pole jest poprawną datą ISO
export function isValidISODate(value: unknown): boolean {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}