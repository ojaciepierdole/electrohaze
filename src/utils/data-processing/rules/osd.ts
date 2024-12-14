import type { TransformationRule, TransformationContext, ProcessSectionContext } from '@/types/document-processing';
import { normalizeText } from '@/utils/data-processing/core/normalization';
import { getOSDInfoByPostalCode } from '@/utils/osd-mapping';
import type { PPEData, CustomerData, CorrespondenceData } from '@/types/fields';

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
  'ENERGA OPERATOR S A': 'Energa-Operator SA'
} as const;

// Funkcja do agresywnej normalizacji nazwy OSD
function aggressiveNormalizeOSDName(value: string): string {
  if (!value) return '';
  
  // Usuń wszystkie spacje i znaki specjalne
  let normalized = value
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .replace(/SPOLKAZOO/g, 'SPZOO')
    .replace(/SPOLKAZO\.?O\.?/g, 'SPZOO')
    .replace(/SP\.?Z\.?O\.?O\.?/g, 'SPZOO')
    .replace(/S\.?A\.?/g, 'SA');
  
  console.log('[aggressiveNormalizeOSDName] After aggressive normalization:', { input: value, normalized });
  return normalized;
}

// Funkcja do normalizacji nazwy OSD
function normalizeOSDName(value: string): string {
  if (!value) return '';
  
  console.log('[normalizeOSDName] Input value:', value);
  
  // Normalizuj tekst do porównania
  const normalized = normalizeText(value, { toUpper: true, removeSpecial: true }) || '';
  console.log('[normalizeOSDName] After basic normalization:', normalized);
  
  // Szukaj dokładnego dopasowania
  for (const [key, properName] of Object.entries(OSD_NAMES)) {
    if (normalized === key) {
      console.log('[normalizeOSDName] Found exact match:', { key, properName });
      return properName;
    }
  }
  
  // Spróbuj agresywnej normalizacji
  const aggressiveNormalized = aggressiveNormalizeOSDName(value);
  for (const [key, properName] of Object.entries(OSD_NAMES)) {
    const normalizedKey = aggressiveNormalizeOSDName(key);
    if (aggressiveNormalized.includes(normalizedKey)) {
      console.log('[normalizeOSDName] Found match after aggressive normalization:', { 
        key, 
        properName, 
        normalizedKey, 
        aggressiveNormalized 
      });
      return properName;
    }
  }
  
  // Szukaj częściowego dopasowania w oryginalnej normalizacji
  for (const [key, properName] of Object.entries(OSD_NAMES)) {
    if (normalized.includes(key)) {
      console.log('[normalizeOSDName] Found partial match:', { key, properName, normalized });
      return properName;
    }
  }
  
  console.log('[normalizeOSDName] No match found, returning original:', value);
  return value;
}

// Funkcja do znalezienia OSD na podstawie kodu pocztowego
function findOSDByPostalCode(context?: ProcessSectionContext): { name: string; region: string } | null {
  if (!context) return null;

  // Najpierw sprawdź czy mamy dane OSD z PPE
  const ppeData = context.ppe as PPEData;
  if (ppeData?.OSD_name?.content) {
    return {
      name: ppeData.OSD_name.content,
      region: ppeData.OSD_region?.content || ''
    };
  }

  // Sprawdź kod pocztowy z PPE
  if (ppeData?.dpPostalCode?.content) {
    const info = getOSDInfoByPostalCode(ppeData.dpPostalCode.content);
    if (info) {
      return {
        name: info.name,
        region: info.region
      };
    }
  }

  // Sprawdź kod pocztowy z adresu korespondencyjnego
  const correspondenceData = context.correspondence as CorrespondenceData;
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
  const customerData = context.customer as CustomerData;
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

// Reguły transformacji dla OSD
export const osdRules: TransformationRule[] = [
  {
    name: 'normalize_osd_name',
    priority: 100,
    condition: (value, context) => {
      console.log('[OSD Rule] Checking condition for OSD_name:', { value, context });
      return context.field === 'OSD_name';
    },
    transform: (value, context: TransformationContext) => {
      console.log('[OSD Rule] Starting OSD_name transformation:', { value, context });
      
      // Najpierw sprawdź czy mamy dane OSD z PPE
      const ppeData = context.document._context?.ppe as PPEData;
      if (ppeData?.OSD_name?.content) {
        console.log('[OSD Rule] Found OSD name in PPE context:', ppeData.OSD_name);
        return {
          value: ppeData.OSD_name.content,
          additionalFields: ppeData.OSD_region?.content ? {
            OSD_region: {
              value: ppeData.OSD_region.content,
              confidence: ppeData.OSD_region.confidence || 0.8
            }
          } : undefined,
          metadata: {
            transformationType: 'osd_normalization',
            fieldType: 'osd_name',
            source: 'ppe'
          }
        };
      }

      // Jeśli nie mamy danych z PPE, spróbuj znormalizować nazwę OSD
      const normalizedName = normalizeOSDName(value);
      console.log('[OSD Rule] Normalized OSD name:', { input: value, normalized: normalizedName });
      
      // Jeśli nie udało się znormalizować nazwy, spróbuj znaleźć OSD na podstawie kodu pocztowego
      if (normalizedName === value) {
        const osdInfo = findOSDByPostalCode(context.document._context);
        console.log('[OSD Rule] Found OSD by postal code:', osdInfo);
        if (osdInfo) {
          return {
            value: osdInfo.name,
            additionalFields: {
              OSD_region: {
                value: osdInfo.region,
                confidence: 0.8
              }
            },
            metadata: {
              transformationType: 'osd_normalization',
              fieldType: 'osd_name',
              source: 'postal_code'
            }
          };
        }
      }
      
      return {
        value: normalizedName,
        metadata: {
          transformationType: 'osd_normalization',
          fieldType: 'osd_name',
          source: 'direct_match'
        }
      };
    }
  },
  
  {
    name: 'normalize_osd_region',
    priority: 90,
    condition: (value, context) => context.field === 'OSD_region',
    transform: (value, context: TransformationContext) => {
      // Najpierw sprawdź czy mamy region z PPE
      const ppeData = context.document._context?.ppe as PPEData;
      if (ppeData?.OSD_region?.content) {
        return {
          value: ppeData.OSD_region.content,
          metadata: {
            transformationType: 'osd_normalization',
            fieldType: 'osd_region',
            source: 'ppe'
          }
        };
      }

      // Jeśli mamy już region, zachowujemy go
      if (value) {
        return {
          value,
          metadata: {
            transformationType: 'osd_normalization',
            fieldType: 'osd_region',
            source: 'direct'
          }
        };
      }
      
      // Jeśli nie mamy regionu, spróbuj znaleźć na podstawie kodu pocztowego
      const osdInfo = findOSDByPostalCode(context.document._context);
      if (osdInfo) {
        return {
          value: osdInfo.region,
          metadata: {
            transformationType: 'osd_normalization',
            fieldType: 'osd_region',
            source: 'postal_code'
          }
        };
      }
      
      return {
        value: null,
        metadata: {
          transformationType: 'osd_normalization',
          fieldType: 'osd_region',
          source: 'none'
        }
      };
    }
  }
]; 