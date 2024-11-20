const SUPPLIER_MAPPINGS: Record<string, string> = {
  'PGE': 'gkpge.pl',
  'TAURON': 'tauron.pl',
  'ENEA': 'enea.pl',
  'ENERGA': 'energa.pl',
  'INNOGY': 'eon.pl',
  'E.ON': 'eon.pl',
  'FORTUM': 'fortum.com',
  'ORANGE': 'orange.pl',
  'POLENERGIA': 'polenergia.pl',
  'POLKOMTEL': 'grupapolsatplus.pl',
  'GREEN': 'greensa.pl',
  // Dodaj więcej mapowań według potrzeb
};

export function getSupplierDomain(supplierName: string): string {
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

  // Jeśli nie znaleziono mapowania, czyścimy nazwę i używamy jako domeny
  return supplierName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/spolkazoo|spolkaakcyjna|sa|spzoo|grupa/g, '')
    .trim() + '.pl';
}

export function getLogoUrl(supplierName: string): string {
  const domain = getSupplierDomain(supplierName);
  const params = new URLSearchParams({
    domain: domain,
    size: '200'
  });

  return `/api/logo?${params.toString()}`;
} 