import type { ISODateString } from '@/types/common';

/**
 * Formatuje datę do standardowego formatu
 */
export function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;

  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  } catch {
    return null;
  }
}

/**
 * Formatuje datę do wyświetlenia
 */
export function formatDateForDisplay(value: string | null | undefined): string | null {
  if (!value) return null;

  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return null;
  }
}

/**
 * Sprawdza czy data jest poprawna
 */
export function isValidDate(value: string | null | undefined): boolean {
  if (!value) return false;

  try {
    const date = new Date(value);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Konwertuje datę na format ISO
 */
export function toISODate(value: string | null | undefined): ISODateString | null {
  if (!value) return null;

  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  } catch {
    return null;
  }
} 