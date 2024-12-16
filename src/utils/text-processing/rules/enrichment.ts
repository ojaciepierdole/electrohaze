import { TransformationContext, TransformationResult, TransformationRule } from '@/types/document-processing';
import { enrichPersonName } from '@/utils/text-formatting/person';
import { enrichAddress } from '@/utils/text-formatting/address';

export const enrichmentRules: TransformationRule[] = [
  {
    name: 'person_name_enrichment',
    description: 'Wzbogacanie danych osobowych',
    priority: 100,
    condition: (value: string, context: TransformationContext) => {
      return context.field?.includes('FirstName') || 
             context.field?.includes('LastName');
    },
    transform: (value: string, context: TransformationContext): TransformationResult => {
      const enriched = enrichPersonName(value);
      if (!enriched) {
        return {
          value: value,
          content: value,
          confidence: context.confidence ?? 0,
          metadata: { enriched: false }
        };
      }

      return {
        value: enriched,
        content: enriched,
        confidence: context.confidence ?? 0,
        metadata: { enriched: true }
      };
    }
  },
  {
    name: 'address_enrichment',
    description: 'Wzbogacanie adresu',
    priority: 90,
    condition: (value: string, context: TransformationContext) => {
      return context.field?.includes('Street') || 
             context.field?.includes('Building') || 
             context.field?.includes('Unit');
    },
    transform: (value: string, context: TransformationContext): TransformationResult => {
      const enriched = enrichAddress(value);
      if (!enriched) {
        return {
          value: value,
          content: value,
          confidence: context.confidence ?? 0,
          metadata: { enriched: false }
        };
      }

      return {
        value: enriched,
        content: enriched,
        confidence: context.confidence ?? 0,
        metadata: { enriched: true }
      };
    }
  }
]; 