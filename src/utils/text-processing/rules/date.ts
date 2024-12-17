import { TransformationContext, TransformationResult, TransformationRule } from '@/types/processing';
import { parseDate } from '@/utils/date-helpers';

export const dateRules: TransformationRule[] = [
  {
    name: 'date_normalization',
    description: 'Normalizacja daty',
    priority: 100,
    condition: (value: string, context: TransformationContext) => {
      const fieldType = context.field?.metadata?.fieldType || '';
      return fieldType.toLowerCase().includes('date') || 
             fieldType.toLowerCase().includes('time') ||
             fieldType.toLowerCase().includes('timestamp');
    },
    transform: (value: string, context: TransformationContext): TransformationResult => {
      const parsedDate = parseDate(value);
      if (!parsedDate) {
        return {
          value: value,
          content: value,
          confidence: context.confidence ?? 0,
          metadata: {
            fieldType: 'text',
            transformationType: 'date_normalization',
            source: 'raw',
            status: 'failed',
            originalValue: value
          }
        };
      }

      return {
        value: parsedDate,
        content: parsedDate,
        confidence: context.confidence ?? 0,
        metadata: {
          fieldType: 'date',
          transformationType: 'date_normalization',
          source: 'parsed',
          status: 'success',
          originalValue: value
        }
      };
    }
  }
]; 