import type { TransformationRule, TransformationContext, TransformationResult } from '@/types/document-processing';
import { normalizeText } from '../core/normalization';

// Funkcja do normalizacji nazwy OSD
export function normalizeOSDName(value: string): string {
  if (!value) return '';
  
  const normalized = normalizeText(value, {
    toUpper: true,
    removeSpecial: true,
    normalizePolish: false
  }) || '';

  // Mapowanie typowych wariantów nazw OSD
  const osdMappings: Record<string, string> = {
    'ENERGA OPERATOR': 'ENERGA-OPERATOR',
    'PGE DYSTRYBUCJA': 'PGE DYSTRYBUCJA',
    'TAURON DYSTRYBUCJA': 'TAURON DYSTRYBUCJA',
    'ENEA OPERATOR': 'ENEA OPERATOR',
    'STOEN OPERATOR': 'STOEN OPERATOR',
    'INNOGY STOEN OPERATOR': 'STOEN OPERATOR'
  };

  for (const [variant, standardized] of Object.entries(osdMappings)) {
    if (normalized.includes(variant)) {
      return standardized;
    }
  }

  return normalized;
}

export const tariffRules: TransformationRule[] = [
  {
    name: 'normalizeTariffGroup',
    description: 'Normalizuje nazwę grupy taryfowej',
    priority: 100,
    transform: (value: string): TransformationResult => {
      const originalValue = value;
      const normalized = normalizeText(value, {
        toUpper: true,
        removeSpecial: true,
        normalizePolish: false
      }) || '';

      // Mapowanie typowych wariantów nazw taryf
      const tariffMappings: Record<string, string> = {
        'G 11': 'G11',
        'G 12': 'G12',
        'G 12W': 'G12W',
        'G 12R': 'G12R',
        'C 11': 'C11',
        'C 12A': 'C12A',
        'C 12B': 'C12B',
        'C 21': 'C21',
        'C 22A': 'C22A',
        'C 22B': 'C22B',
        'B 11': 'B11',
        'B 21': 'B21',
        'B 22': 'B22',
        'B 23': 'B23',
        'A 21': 'A21',
        'A 22': 'A22',
        'A 23': 'A23'
      };

      for (const [variant, standardized] of Object.entries(tariffMappings)) {
        if (normalized.includes(variant) || normalized.includes(variant.replace(' ', ''))) {
          return {
            value: standardized,
            confidence: 1.0,
            metadata: {
              originalValue,
              transformationType: 'normalizeTariffGroup',
              matchedVariant: variant
            }
          };
        }
      }

      return {
        value: normalized,
        confidence: 0.8,
        metadata: {
          originalValue,
          transformationType: 'normalizeTariffGroup',
          matchedVariant: null
        }
      };
    }
  },
  {
    name: 'normalizeOSDName',
    description: 'Normalizuje nazwę OSD',
    priority: 90,
    transform: (value: string): TransformationResult => {
      const originalValue = value;
      const normalized = normalizeText(value, {
        toUpper: true,
        removeSpecial: true,
        normalizePolish: false
      }) || '';

      // Mapowanie typowych wariantów nazw OSD
      const osdMappings: Record<string, string> = {
        'ENERGA OPERATOR': 'ENERGA-OPERATOR',
        'PGE DYSTRYBUCJA': 'PGE DYSTRYBUCJA',
        'TAURON DYSTRYBUCJA': 'TAURON DYSTRYBUCJA',
        'ENEA OPERATOR': 'ENEA OPERATOR',
        'STOEN OPERATOR': 'STOEN OPERATOR',
        'INNOGY STOEN OPERATOR': 'STOEN OPERATOR'
      };

      for (const [variant, standardized] of Object.entries(osdMappings)) {
        if (normalized.includes(variant)) {
          return {
            value: standardized,
            confidence: 1.0,
            metadata: {
              originalValue,
              transformationType: 'normalizeOSDName',
              matchedVariant: variant
            }
          };
        }
      }

      return {
        value: normalized,
        confidence: 0.8,
        metadata: {
          originalValue,
          transformationType: 'normalizeOSDName',
          matchedVariant: null
        }
      };
    }
  }
]; 