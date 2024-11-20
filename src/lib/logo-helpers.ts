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

export function getLogoUrl(supplierName: string, token?: string): string {
  const domain = getSupplierDomain(supplierName);
  const baseUrl = `https://img.logo.dev/${domain}`;
  
  const params = new URLSearchParams({
    format: 'png',
    size: '200'
  });

  if (token) {
    params.append('token', token);
  }

  return `${baseUrl}?${params.toString()}`;
} 