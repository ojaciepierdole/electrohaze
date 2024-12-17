import type { TransformationRule, TransformationContext, ProcessSectionContext, DocumentField } from '@/types/document-processing';
import { normalizeText } from '@/utils/data-processing/core/normalization';
import { getOSDInfoByPostalCode } from '@/utils/osd-mapping';
import type { CustomerData, CorrespondenceData, SupplierData } from '@/types/fields';

// Słownik poprawnych nazw OSD
const OSD_NAMES = {
  'RWE': 'RWE Stoen Operator Sp. z o.o.',
  'STOEN': 'RWE Stoen Operator Sp. z o.o.',
  'RWE STOEN': 'RWE Stoen Operator Sp. z o.o.',
  'PGE': 'PGE Dystrybucja SA',
  'ENEA': 'Enea Operator Sp. z o.o.',
  'TAURON': 'Tauron Dystrybucja SA',
  'ENERGA': 'Energa-Operator SA',
  // Warianty z błędami
  'RWE STOEN OPERATOR': 'RWE Stoen Operator Sp. z o.o.',
  'RWE SP Z O O': 'RWE Stoen Operator Sp. z o.o.',
  'PGE DYSTRYBUCJA': 'PGE Dystrybucja SA',
  'PGE DYSTRYBUCJA S A': 'PGE Dystrybucja SA',
  'PGE DYSTRYBUCJA SA': 'PGE Dystrybucja SA',
  'PGE SA': 'PGE Dystrybucja SA',
  'PGEDYSTRYBUCJA': 'PGE Dystrybucja SA',
  'PGEDYSTRYBUCJASA': 'PGE Dystrybucja SA',
  'ENEA OPERATOR': 'Enea Operator Sp. z o.o.',
  'ENEA SP Z O O': 'Enea Operator Sp. z o.o.',
  'TAURON DYSTRYBUCJA': 'Tauron Dystrybucja SA',
  'TAURON DYSTRYBUCJA S A': 'Tauron Dystrybucja SA',
  'ENERGA OPERATOR': 'Energa-Operator SA',
  'ENERGA OPERATOR S A': 'Energa-Operator SA',
  // Dodatkowe warianty
  'TARYFA ENERGA OPERATOR': 'Energa-Operator SA',
  'TARYFA PGE DYSTRYBUCJA': 'PGE Dystrybucja SA',
  'TARYFA TAURON DYSTRYBUCJA': 'Tauron Dystrybucja SA',
  'TARYFA ENEA OPERATOR': 'Enea Operator Sp. z o.o.',
  'TARYFA RWE STOEN': 'RWE Stoen Operator Sp. z o.o.',
  'ENERGAOPERATOR': 'Energa-Operator SA',
  'ENERGAOPERATORSA': 'Energa-Operator SA',
  'TAURONDYSTRYBUCJA': 'Tauron Dystrybucja SA',
  'TAURONDYSTRYBUCJASA': 'Tauron Dystrybucja SA',
  'ENEAOPERATOR': 'Enea Operator Sp. z o.o.',
  'ENEAOPERATORSPZOO': 'Enea Operator Sp. z o.o.',
  'RWESTOENOPERATOR': 'RWE Stoen Operator Sp. z o.o.'
} as const;

// Funkcja do normalizacji nazwy OSD
function normalizeOSDName(value: string): string {
  console.log('[normalizeOSDName] Start with value:', value);
  
  if (!value) {
    console.log('[normalizeOSDName] Empty value, returning empty string');
    return '';
  }
  
  // Normalizuj tekst do porównania
  const normalized = normalizeText(value, { 
    toUpper: true, 
    removeSpecial: true,
    normalizePolish: false 
  });
  
  console.log('[normalizeOSDName] After normalization:', normalized);
  
  // Jeśli normalizacja się nie powiodła, zwróć oryginalną wartość
  if (!normalized) {
    console.log('[normalizeOSDName] Normalization failed, returning original:', value);
    return value;
  }
  
  // Bezpośrednie sprawdzenie w słowniku
  const exactMatch = OSD_NAMES[normalized as keyof typeof OSD_NAMES];
  if (exactMatch) {
    console.log('[normalizeOSDName] Found exact match:', exactMatch);
    return exactMatch;
  }
  
  // Szukaj częściowych dopasowań
  for (const [key, properName] of Object.entries(OSD_NAMES)) {
    console.log('[normalizeOSDName] Checking key:', key, 'against normalized:', normalized);
    if (normalized.includes(key)) {
      console.log('[normalizeOSDName] Found partial match:', { key, properName });
      return properName;
    }
  }
  
  console.log('[normalizeOSDName] No match found, returning original:', value);
  return value;
}

// Funkcja do znalezienia OSD na podstawie kodu pocztowego
function findOSDByPostalCode(context?: ProcessSectionContext): { name: string; region: string } | null {
  if (!context) return null;

  // Najpierw sprawdź czy mamy dane OSD z dostawcy
  const supplierData = context.supplier as SupplierData | undefined;
  if (supplierData?.OSD_name?.content) {
    return {
      name: supplierData.OSD_name.content,
      region: supplierData.OSD_region?.content || ''
    };
  }

  // Sprawdź kod pocztowy dostawcy
  if (supplierData?.supplierPostalCode?.content) {
    const info = getOSDInfoByPostalCode(supplierData.supplierPostalCode.content);
    if (info) {
      return {
        name: info.name,
        region: info.region
      };
    }
  }

  // Sprawdź kod pocztowy z adresu korespondencyjnego
  const correspondenceData = context.correspondence as CorrespondenceData | undefined;
  if (correspondenceData?.paPostalCode?.content) {
    const info = getOSDInfoByPostalCode(correspondenceData.paPostalCode.content);
    if (info) {
      return {
        name: info.name,
        region: info.region
      };
    }
  }

  // Sprawdź kod pocztowy z danych klienta
  const customerData = context.customer as CustomerData | undefined;
  if (customerData?.PostalCode?.content) {
    const info = getOSDInfoByPostalCode(customerData.PostalCode.content);
    if (info) {
      return {
        name: info.name,
        region: info.region
      };
    }
  }

  return null;
}

// Mapowanie kodów pocztowych do OSD
export const OSD_POSTAL_CODE_MAPPINGS: Record<string, string> = {
  // ENERGA-OPERATOR
  '80': 'ENERGA-OPERATOR',
  '81': 'ENERGA-OPERATOR',
  '82': 'ENERGA-OPERATOR',
  '83': 'ENERGA-OPERATOR',
  '84': 'ENERGA-OPERATOR',
  '85': 'ENERGA-OPERATOR',
  '86': 'ENERGA-OPERATOR',
  '87': 'ENERGA-OPERATOR',
  '88': 'ENERGA-OPERATOR',
  '89': 'ENERGA-OPERATOR',
  // STOEN OPERATOR
  '00': 'STOEN OPERATOR',
  '01': 'STOEN OPERATOR',
  '02': 'STOEN OPERATOR',
  '03': 'STOEN OPERATOR',
  '04': 'STOEN OPERATOR',
  // PGE DYSTRYBUCJA
  '20': 'PGE DYSTRYBUCJA',
  '21': 'PGE DYSTRYBUCJA',
  '22': 'PGE DYSTRYBUCJA',
  '23': 'PGE DYSTRYBUCJA',
  '24': 'PGE DYSTRYBUCJA',
  '26': 'PGE DYSTRYBUCJA',
  '27': 'PGE DYSTRYBUCJA',
  '08': 'PGE DYSTRYBUCJA',
  '05': 'PGE DYSTRYBUCJA',
  '07': 'PGE DYSTRYBUCJA',
  // TAURON DYSTRYBUCJA
  '30': 'TAURON DYSTRYBUCJA',
  '31': 'TAURON DYSTRYBUCJA',
  '32': 'TAURON DYSTRYBUCJA',
  '33': 'TAURON DYSTRYBUCJA',
  '34': 'TAURON DYSTRYBUCJA',
  '40': 'TAURON DYSTRYBUCJA',
  '41': 'TAURON DYSTRYBUCJA',
  '42': 'TAURON DYSTRYBUCJA',
  '43': 'TAURON DYSTRYBUCJA',
  '44': 'TAURON DYSTRYBUCJA',
  '45': 'TAURON DYSTRYBUCJA',
  '46': 'TAURON DYSTRYBUCJA',
  '47': 'TAURON DYSTRYBUCJA',
  '48': 'TAURON DYSTRYBUCJA',
  '49': 'TAURON DYSTRYBUCJA',
  '50': 'TAURON DYSTRYBUCJA',
  '51': 'TAURON DYSTRYBUCJA',
  '52': 'TAURON DYSTRYBUCJA',
  '53': 'TAURON DYSTRYBUCJA',
  '54': 'TAURON DYSTRYBUCJA',
  '55': 'TAURON DYSTRYBUCJA',
  '56': 'TAURON DYSTRYBUCJA',
  '57': 'TAURON DYSTRYBUCJA',
  '58': 'TAURON DYSTRYBUCJA',
  '59': 'TAURON DYSTRYBUCJA',
  // ENEA OPERATOR
  '60': 'ENEA OPERATOR',
  '61': 'ENEA OPERATOR',
  '62': 'ENEA OPERATOR',
  '63': 'ENEA OPERATOR',
  '64': 'ENEA OPERATOR',
  '65': 'ENEA OPERATOR',
  '66': 'ENEA OPERATOR',
  '67': 'ENEA OPERATOR',
  '68': 'ENEA OPERATOR',
  '69': 'ENEA OPERATOR',
  '70': 'ENEA OPERATOR',
  '71': 'ENEA OPERATOR',
  '72': 'ENEA OPERATOR',
  '73': 'ENEA OPERATOR',
  '74': 'ENEA OPERATOR',
  '75': 'ENEA OPERATOR',
  '76': 'ENEA OPERATOR',
  '77': 'ENEA OPERATOR',
  '78': 'ENEA OPERATOR',
  '79': 'ENEA OPERATOR',
};

/**
 * Określa OSD na podstawie kodu pocztowego
 */
export function determineOSDByPostalCode(postalCode: string | null | undefined): string | null {
  console.log('[determineOSDByPostalCode] Start with postal code:', postalCode);
  
  if (!postalCode) {
    console.log('[determineOSDByPostalCode] No postal code provided');
    return null;
  }
  
  // Wyczyść kod pocztowy ze znaków specjalnych
  const cleanPostalCode = normalizeText(postalCode, {
    removeSpecial: true,
    normalizePolish: false
  });
  
  console.log('[determineOSDByPostalCode] Cleaned postal code:', cleanPostalCode);

  // Sprawdź czy mamy poprawny kod pocztowy po normalizacji
  if (!cleanPostalCode) {
    console.log('[determineOSDByPostalCode] Invalid postal code after cleaning');
    return null;
  }
  
  // Weź pierwsze dwie cyfry kodu pocztowego
  const prefix = cleanPostalCode.substring(0, 2);
  console.log('[determineOSDByPostalCode] Postal code prefix:', prefix);
  
  // Znajdź odpowiednie OSD
  const osd = OSD_POSTAL_CODE_MAPPINGS[prefix];
  console.log('[determineOSDByPostalCode] Found OSD:', osd);
  
  return osd || null;
}

// Reguły transformacji dla OSD
export const osdRules: TransformationRule[] = [
  {
    name: 'normalize_osd_name',
    description: 'Normalizacja nazwy OSD',
    priority: 100,
    condition: (value, context) => {
      return context.field === 'OSD_name';
    },
    transform: (value, context: TransformationContext) => {
      console.log('[OSD Rule] Starting OSD_name transformation with value:', value);
      
      // Najpierw spróbuj znaleźć OSD na podstawie kodu pocztowego
      const supplierData = context.document?.supplier as SupplierData | undefined;
      const postalCode = supplierData?.supplierPostalCode?.content;
      
      if (postalCode) {
        console.log('[OSD Rule] Found postal code:', postalCode);
        const osdFromPostal = determineOSDByPostalCode(postalCode);
        if (osdFromPostal) {
          console.log('[OSD Rule] Found OSD from postal code:', osdFromPostal);
          // Normalizuj nazwę OSD znalezioną przez kod pocztowy
          const normalizedFromPostal = normalizeOSDName(osdFromPostal);
          if (normalizedFromPostal) {
            return {
              value: normalizedFromPostal,
              confidence: 0.9,
              metadata: {
                transformationType: 'osd_normalization',
                fieldType: 'osd_name',
                source: 'postal_code',
                originalValue: value
              }
            };
          }
        }
      }
      
      // Jeśli nie udało się znaleźć przez kod pocztowy, normalizuj podaną wartość
      console.log('[OSD Rule] Trying to normalize provided value:', value);
      const normalizedName = normalizeOSDName(value || '');
      
      return {
        value: normalizedName,
        confidence: normalizedName !== value ? 0.9 : 0.7,
        metadata: {
          transformationType: 'osd_normalization',
          fieldType: 'osd_name',
          source: normalizedName !== value ? 'mapped' : 'original',
          originalValue: value
        }
      };
    }
  },
  
  {
    name: 'normalize_osd_region',
    description: 'Normalizacja regionu OSD na podstawie danych dostawcy lub kodu pocztowego',
    priority: 90,
    condition: (value, context) => context.field === 'OSD_region',
    transform: (value, context: TransformationContext) => {
      // Najpierw sprawdź czy mamy region od dostawcy
      const supplierData = context.document?.supplier as SupplierData | undefined;
      if (supplierData?.OSD_region?.content) {
        return {
          value: supplierData.OSD_region.content,
          confidence: supplierData.OSD_region.confidence || 0.8,
          metadata: {
            transformationType: 'osd_normalization',
            fieldType: 'osd_region',
            source: 'supplier'
          }
        };
      }

      // Jeśli mamy już region, zachowujemy go
      if (value) {
        return {
          value,
          confidence: 0.7,
          metadata: {
            transformationType: 'osd_normalization',
            fieldType: 'osd_region',
            source: 'direct'
          }
        };
      }
      
      // Jeśli nie mamy regionu, spróbuj znaleźć na podstawie kodu pocztowego
      if (context.document) {
        const supplierFields = Object.entries(context.document.supplier || {}).reduce(
          (acc, [key, value]) => ({ ...acc, [key]: value }),
          {} as Record<string, DocumentField>
        );
        const osdInfo = findOSDByPostalCode({ supplier: supplierFields });
        if (osdInfo) {
          return {
            value: osdInfo.region,
            confidence: 0.8,
            metadata: {
              transformationType: 'osd_normalization',
              fieldType: 'osd_region',
              source: 'postal_code'
            }
          };
        }
      }
      
      return {
        value: '',
        confidence: 0.5,
        metadata: {
          transformationType: 'osd_normalization',
          fieldType: 'osd_region',
          source: 'none'
        }
      };
    }
  }
]; 