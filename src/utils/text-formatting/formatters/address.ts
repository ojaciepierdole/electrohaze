import { cleanText } from '@/utils/text-processing/core/normalization';

/**
 * Formatuje kod pocztowy
 */
export function formatPostalCode(postalCode: string | null): string {
  if (!postalCode) return '';
  
  // Wyczyść kod pocztowy ze znaków specjalnych
  const cleaned = cleanText(postalCode, {
    toUpper: true,
    normalizePolish: false
  });
  
  // Usuń wszystkie znaki niebędące cyframi
  const numbers = cleaned.replace(/[^0-9]/g, '');
  
  // Jeśli mamy dokładnie 5 cyfr, dodaj myślnik
  if (numbers.length === 5) {
    return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
  }
  
  return numbers;
}

/**
 * Formatuje nazwę miasta
 */
export function formatCity(city: string | null): string {
  if (!city) return '';
  
  return cleanText(city, {
    toUpper: true,
    normalizePolish: false
  });
}

/**
 * Normalizuje numery w adresie
 */
export function normalizeAddressNumbers(address: string | null): { building: string | null; unit: string | null } {
  if (!address) return { building: null, unit: null };
  
  const cleaned = cleanText(address, {
    toUpper: true,
    normalizePolish: false
  });
  
  // Szukaj numeru budynku i mieszkania
  const match = cleaned.match(/(\d+(?:\/\d+)?)\s*(?:M\.?\s*(\d+))?/i);
  
  if (!match) return { building: null, unit: null };
  
  return {
    building: match[1] || null,
    unit: match[2] ? `m.${match[2]}` : null
  };
}

/**
 * Formatuje ulicę
 */
export function formatStreet(street: string | null): string {
  if (!street) return '';
  
  const cleaned = cleanText(street, {
    toUpper: true,
    normalizePolish: false,
    debug: true
  });
  
  // Normalizuj prefiksy ulic
  const prefixes: Record<string, string> = {
    'AL': 'AL.',
    'ALEJA': 'AL.',
    'ALEJE': 'AL.',
    'OS': 'OS.',
    'OSIEDLE': 'OS.',
    'PL': 'PL.',
    'PLAC': 'PL.',
    'UL': 'UL.',
    'ULICA': 'UL.',
    'RONDO': 'RONDO'
  };
  
  const parts = cleaned.split(/\s+/);
  if (parts.length > 0) {
    const firstPart = parts[0];
    const normalizedPrefix = prefixes[firstPart];
    if (normalizedPrefix) {
      parts[0] = normalizedPrefix;
    }
  }
  
  return parts.join(' ');
} 