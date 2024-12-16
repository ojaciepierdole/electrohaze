import { TransformationContext, TransformationResult, TransformationRule } from '@/types/document-processing';
import { parseDate, formatDate } from '@/utils/date-helpers';

export const dateRules: TransformationRule[] = [
  {
    name: 'date_normalization',
    description: 'Normalizacja daty',
    priority: 100,
    condition: (value: string, context: TransformationContext) => {
      return context.field?.includes('Date') || 
             context.field?.includes('Time') ||
             context.field?.includes('Timestamp');
    },
    transform: (value: string, context: TransformationContext): TransformationResult => {
      const parsedDate = parseDate(value);
      if (!parsedDate) {
        return {
          value: value,
          content: value,
          confidence: context.confidence ?? 0,
          metadata: { normalized: false }
        };
      }

      const formattedDate = formatDate(parsedDate);
      return {
        value: formattedDate,
        content: formattedDate,
        confidence: context.confidence ?? 0,
        metadata: { normalized: true }
      };
    }
  }
]; 