/**
 * Wyodrębnia kod pocztowy z tekstu
 */
export function extractPostalCode(text: string): string | null {
  const match = text.match(/\d{2}-\d{3}/);
  return match ? match[0] : null;
}

/**
 * Normalizuje adres (usuwa zbędne spacje, zamienia wielokrotne spacje na pojedyncze)
 */
export function normalizeAddress(address: string): string {
  return address
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(ul\.|ulica|al\.|aleja)\s*/i, '')
    .replace(/\s*,\s*$/, '');
} 