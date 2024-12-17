import { TextProcessor } from '../../core/text-processor';

/**
 * Formatuje kod pocztowy
 */
export function formatPostalCode(postalCode: string | null): string {
  return TextProcessor.formatPostalCode(postalCode);
}

/**
 * Formatuje nazwę miasta
 */
export function formatCity(city: string | null): string {
  return TextProcessor.format(city, 'address');
}

/**
 * Normalizuje numery w adresie
 */
export function normalizeAddressNumbers(address: string | null): { building: string | null; unit: string | null } {
  if (!address) return { building: null, unit: null };
  
  // Wyczyść adres ze znaków specjalnych
  const cleaned = TextProcessor.formatBuildingNumber(address);
  
  // Wzorce do dopasowania (w kolejności od najbardziej do najmniej specyficznego)
  const patterns = [
    // Format z podwójnym ukośnikiem i literami (np. 123A/45B/67C)
    /^(\d+[A-Za-z]?)\/(\d+[A-Za-z]?)\/(\d+[A-Za-z]?)$/i,
    
    // Format z literą w numerze budynku i ukośnikiem (np. 4/C/29)
    /^(\d+)\/([A-Za-z])\/(\d+[A-Za-z]?)$/i,
    
    // Format z ukośnikiem i literami (np. 4C/29B)
    /^(\d+[A-Za-z]?)\/(\d+[A-Za-z]?)$/i,
    
    // Format z oznaczeniem mieszkania i literami (np. 123A m. 45B)
    /^(\d+[A-Za-z]?)\s*(m\.|m|lok\.|lok|mieszk\.|mieszk|app\.|ap\.|\/)\s*(\d+[A-Za-z]?)$/i,
    
    // Format z samą literą (np. 4C)
    /^(\d+[A-Za-z]?)$/i,
    
    // Format z literą po ukośniku (np. 4/C)
    /^(\d+)\/([A-Za-z])$/i,
    
    // Format z literą przed ukośnikiem (np. 4C/5)
    /^(\d+[A-Za-z]?)\/(\d+)$/i,
    
    // Format z literami po obu stronach ukośnika (np. 4C/5D)
    /^(\d+[A-Za-z]?)\/(\d+[A-Za-z]?)$/i
  ];

  for (const pattern of patterns) {
    const matches = cleaned.match(pattern);
    if (matches) {
      let result;
      
      if (matches.length === 4) {
        // Format z trzema częściami (np. 123/45/67)
        result = { 
          building: TextProcessor.formatBuildingNumber(`${matches[1]}/${matches[2]}`), 
          unit: TextProcessor.formatBuildingNumber(matches[3])
        };
      } else if (matches.length === 3) {
        // Format z dwoma częściami
        if (matches[2].match(/^[A-Za-z]$/)) {
          // Jeśli druga część to pojedyncza litera (np. 4/C)
          result = { 
            building: TextProcessor.formatBuildingNumber(`${matches[1]}${matches[2]}`), 
            unit: null 
          };
        } else {
          // Standardowy format z numerem mieszkania
          result = { 
            building: TextProcessor.formatBuildingNumber(matches[1]), 
            unit: TextProcessor.formatBuildingNumber(matches[2])
          };
        }
      } else {
        // Format z jedną częścią
        result = { 
          building: TextProcessor.formatBuildingNumber(matches[1]), 
          unit: null 
        };
      }
      
      return result;
    }
  }

  // Jeśli nie dopasowano żadnego wzorca, spróbuj wyodrębnić numer mieszkania
  const unitMatch = cleaned.match(/(\d+[A-Za-z]?)\s*(m\.|m|lok\.|lok|mieszk\.|mieszk|app\.|ap\.)\s*(\d+[A-Za-z]?)/i);
  if (unitMatch) {
    return {
      building: TextProcessor.formatBuildingNumber(unitMatch[1]),
      unit: TextProcessor.formatBuildingNumber(unitMatch[3])
    };
  }

  return { 
    building: TextProcessor.formatBuildingNumber(cleaned), 
    unit: null 
  };
}

/**
 * Formatuje ulicę
 */
export function formatStreet(street: string | null): string {
  if (!street) return '';
  
  // Wyczyść ulicę ze znaków specjalnych
  const cleaned = TextProcessor.format(street, 'address');
  
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
    'ULICA': 'UL.'
  };
  
  // Usuń niepotrzebne spacje
  const parts = cleaned.split(/\s+/).filter(Boolean);
  
  if (parts.length > 0) {
    const firstPart = parts[0];
    const normalizedPrefix = prefixes[firstPart];
    if (normalizedPrefix) {
      parts[0] = normalizedPrefix;
    }
  }
  
  return parts.join(' ').trim();
} 