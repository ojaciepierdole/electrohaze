const SUPPLIER_MAPPINGS: Record<string, string> = {
  'PGE': 'pge.pl',
  'TAURON': 'tauron.pl',
  'ENEA': 'enea.pl',
  'ENERGA': 'energa.pl',
  'INNOGY': 'eon.pl',
  'E.ON': 'eon.pl',
  'FORTUM': 'fortum.pl',
  'ORANGE': 'orange.pl',
  'ORANGE ENERGIA': 'orange.pl',
  'RWE STOEN': 'rwe.pl',
  'POLENERGIA': 'polenergia.pl',
  'POLKOMTEL': 'plus.pl',
  'GREEN': 'greensa.pl',
};

/**
 * Znajduje domenę dostawcy na podstawie jego nazwy
 * @param supplierName Nazwa dostawcy
 * @returns Domena dostawcy
 */
export function getDomain(supplierName: string): string {
  // Normalizujemy nazwę dostawcy
  const normalizedName = supplierName
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

  // Sprawdzamy czy mamy bezpośrednie mapowanie
  for (const [key, domain] of Object.entries(SUPPLIER_MAPPINGS)) {
    if (normalizedName.includes(key)) {
      return domain;
    }
  }

  // Jeśli nie znaleziono mapowania, zwracamy domyślną domenę
  return 'orange.pl';
} 