import { TransformationContext, TransformationResult, TransformationRule } from '@/types/document-processing';
import { normalizeOSDName } from '@/utils/data-processing/rules/tariff';

export const osdRules: TransformationRule[] = [
  {
    name: 'osd_name_normalization',
    description: 'Normalizacja nazwy OSD',
    priority: 100,
    condition: (value: string, context: TransformationContext) => {
      return context.field?.includes('OSD_name');
    },
    transform: (value: string, context: TransformationContext): TransformationResult => {
      const normalized = normalizeOSDName(value);
      if (!normalized) {
        return {
          value: value,
          confidence: context.confidence ?? 0,
          metadata: { normalized: false }
        };
      }

      return {
        value: normalized,
        confidence: context.confidence ?? 0,
        metadata: { normalized: true }
      };
    }
  },
  {
    name: 'osd_region_normalization',
    description: 'Normalizacja regionu OSD',
    priority: 90,
    condition: (value: string, context: TransformationContext) => {
      return context.field?.includes('OSD_region');
    },
    transform: (value: string, context: TransformationContext): TransformationResult => {
      const normalized = value.toUpperCase().trim();
      return {
        value: normalized,
        confidence: context.confidence ?? 0,
        metadata: { normalized: true }
      };
    }
  }
]; 