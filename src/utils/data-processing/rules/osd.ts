import type { TransformationRule, TransformationContext, ProcessSectionContext, DocumentField } from '@/types/document-processing';
import { normalizeText } from '@/utils/data-processing/core/normalization';
import { getOSDInfoByPostalCode } from '@/utils/osd-mapping';
import type { PPEData, CustomerData, CorrespondenceData, SupplierData } from '@/types/fields';

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

// Reguły transformacji dla OSD
export const osdRules: TransformationRule[] = [
  {
    name: 'normalize_osd_name',
    description: 'Normalizacja nazwy OSD na podstawie danych dostawcy lub kodu pocztowego',
    priority: 100,
    condition: (value, context) => {
      console.log('[OSD Rule] Checking condition for OSD_name:', { value, context });
      return context.field === 'OSD_name';
    },
    transform: (value, context: TransformationContext) => {
      console.log('[OSD Rule] Starting OSD_name transformation:', { value, context });
      
      // Najpierw sprawdź czy mamy dane OSD od dostawcy
      const supplierData = context.document?.supplier as SupplierData | undefined;
      if (supplierData?.OSD_name?.content) {
        console.log('[OSD Rule] Found OSD name in supplier context:', supplierData.OSD_name);
        return {
          value: supplierData.OSD_name.content,
          confidence: supplierData.OSD_name.confidence || 0.8,
          additionalFields: supplierData.OSD_region?.content ? {
            OSD_region: {
              value: supplierData.OSD_region.content,
              confidence: supplierData.OSD_region.confidence || 0.8
            }
          } : undefined,
          metadata: {
            transformationType: 'osd_normalization',
            fieldType: 'osd_name',
            source: 'supplier'
          }
        };
      }

      // Jeśli nie mamy danych od dostawcy, spróbuj znormalizować nazwę OSD
      const normalizedName = normalizeOSDName(value || '');
      console.log('[OSD Rule] Normalized OSD name:', { input: value, normalized: normalizedName });
      
      // Jeśli nie udało się znormalizować nazwy, spróbuj znaleźć OSD na podstawie kodu pocztowego
      if (normalizedName === value && context.document) {
        const supplierFields = Object.entries(context.document.supplier || {}).reduce(
          (acc, [key, value]) => ({ ...acc, [key]: value }),
          {} as Record<string, DocumentField>
        );
        const osdInfo = findOSDByPostalCode({ supplier: supplierFields });
        console.log('[OSD Rule] Found OSD by postal code:', osdInfo);
        if (osdInfo) {
          return {
            value: osdInfo.name,
            confidence: 0.8,
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
        value: normalizedName || '',
        confidence: normalizedName !== value ? 0.9 : 0.7,
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