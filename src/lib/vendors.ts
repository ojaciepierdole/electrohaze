const VENDOR_IDS: Record<string, string> = {
  'Orange Energia': 'orange',
  'PGE': 'pge-polska-grupa-energetyczna',
  'Tauron': 'tauron',
  'Enea': 'enea',
  'Energa': 'energa',
  'Stoen Operator': 'eon',
  'innogy': 'eon'
};

export function getVendorLogo(vendorName: string): string {
  const normalizedName = vendorName.toLowerCase().trim();
  
  // Szukaj dopasowania w nazwach sprzedawców
  const matchedVendor = Object.keys(VENDOR_IDS).find(vendor => 
    normalizedName.includes(vendor.toLowerCase()) ||
    vendor.toLowerCase().includes(normalizedName)
  );
  
  if (!matchedVendor) {
    return `https://logo.dev/api/company/default?size=64`;
  }

  const companyId = VENDOR_IDS[matchedVendor];
  return `https://logo.dev/api/company/${companyId}?size=64`;
} 