import { normalizeText } from '@/utils/text-formatting/core/normalization';

// Lista typowych polskich imion
const commonFirstNames = new Set([
  'ADAM', 'ALEKSANDER', 'ANDRZEJ', 'ANNA', 'BARBARA', 'DARIUSZ',
  'EWA', 'GRZEGORZ', 'HALINA', 'IRENA', 'JAN', 'JANUSZ', 'JERZY',
  'JÓZEF', 'KRYSTYNA', 'KRZYSZTOF', 'MAREK', 'MARIA', 'MARIUSZ',
  'PIOTR', 'ROBERT', 'STANISŁAW', 'TOMASZ', 'WOJCIECH', 'ZBIGNIEW'
]);

/**
 * Przetwarza imię i nazwisko
 */
export function processPersonName(
  firstName: string | null,
  lastName: string | null
): { firstName: string | null; lastName: string | null } {
  if (!firstName && !lastName) return { firstName: null, lastName: null };
  
  // Jeśli mamy tylko jedno pole wypełnione
  if (!firstName || !lastName) {
    const singleName = (firstName || lastName || '').trim();
    const parts = singleName.split(/\s+/);
    
    // Jeśli mamy jedno słowo
    if (parts.length === 1) {
      const normalizedName = normalizeText(parts[0], { toUpper: true }) || '';
      // Sprawdź czy to imię czy nazwisko
      if (commonFirstNames.has(normalizedName)) {
        return { firstName: normalizedName, lastName: null };
      } else {
        return { firstName: null, lastName: normalizedName };
      }
    }
    
    // Jeśli mamy więcej słów
    const potentialFirstName = normalizeText(parts[0], { toUpper: true }) || '';
    const potentialLastName = normalizeText(parts.slice(1).join(' '), { toUpper: true }) || '';
    
    if (commonFirstNames.has(potentialFirstName)) {
      return { firstName: potentialFirstName, lastName: potentialLastName };
    } else {
      return { firstName: null, lastName: normalizeText(singleName, { toUpper: true }) || '' };
    }
  }
  
  // Jeśli mamy oba pola
  return {
    firstName: normalizeText(firstName, { toUpper: true }) || '',
    lastName: normalizeText(lastName, { toUpper: true }) || ''
  };
} 