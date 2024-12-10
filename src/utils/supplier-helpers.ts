/**
 * Funkcje pomocnicze do obsługi dostawców energii
 */

export const getSupplierDomain = (supplierName: string): string => {
  const domainMap: Record<string, string> = {
    'PGE': 'pge.pl',
    'TAURON': 'tauron.pl',
    'ENEA': 'enea.pl',
    'ENERGA': 'energa.pl',
    'INNOGY': 'innogy.pl',
    'E.ON': 'eon.pl',
    'PKP ENERGETYKA': 'pkpenergetyka.pl',
    'FORTUM': 'fortum.pl',
    'ORANGE': 'orange.pl',
    'ORANGE ENERGIA': 'orange.pl'
  };

  // Znajdź pasujący klucz (ignorując wielkość liter)
  const matchingKey = Object.keys(domainMap).find(key => 
    supplierName.toUpperCase().includes(key)
  );

  return matchingKey ? domainMap[matchingKey] : '';
};

export const getSupplierLogoUrl = (supplierName: string): string => {
  const domain = getSupplierDomain(supplierName);
  if (!domain) return '';
  return `https://logo.clearbit.com/${domain}`;
};

export const normalizeSupplierName = (supplierName: string): string => {
  const nameMap: Record<string, string> = {
    'Orange Energia Sp. z o.o.': 'Orange Energia',
    'PGE Obrót S.A.': 'PGE',
    'TAURON Sprzedaż sp. z o.o.': 'Tauron',
    'ENEA S.A.': 'Enea',
    'ENERGA-OBRÓT S.A.': 'Energa',
    'E.ON Polska S.A.': 'E.ON',
    'PKP Energetyka S.A.': 'PKP Energetyka',
    'Fortum Marketing and Sales Polska S.A.': 'Fortum'
  };

  return nameMap[supplierName] || supplierName;
}; 