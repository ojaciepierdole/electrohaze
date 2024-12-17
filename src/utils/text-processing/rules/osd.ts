import { TransformationContext, TransformationResult, TransformationRule } from '@/types/processing';
import { normalizeOSDName } from '@/utils/data-processing/rules/tariff';

export const osdRules: TransformationRule[] = [
  {
    name: 'osd_name_normalization',
    description: 'Normalizacja nazwy OSD',
    priority: 100,
    condition: (value: string, context: TransformationContext) => {
      const fieldType = context.field?.metadata?.fieldType || '';
      return fieldType.toLowerCase().includes('osd_name');
    },
    transform: (value: string, context: TransformationContext): TransformationResult => {
      const normalized = normalizeOSDName(value);
      if (!normalized) {
        return {
          value: value,
          content: value,
          confidence: context.confidence ?? 0,
          metadata: {
            fieldType: 'text',
            transformationType: 'osd_name_normalization',
            source: 'raw',
            status: 'failed',
            originalValue: value
          }
        };
      }

      return {
        value: normalized,
        content: normalized,
        confidence: context.confidence ?? 0,
        metadata: {
          fieldType: 'osd_name',
          transformationType: 'osd_name_normalization',
          source: 'normalized',
          status: 'success',
          originalValue: value
        }
      };
    }
  }
]; 