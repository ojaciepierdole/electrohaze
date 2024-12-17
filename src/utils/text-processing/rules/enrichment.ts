import { normalizeAddressField } from '@/utils/text-formatting/address';
import type { TransformationContext, TransformationResult, TransformationRule } from '@/types/processing';

export const enrichmentRules: TransformationRule[] = [
  {
    name: 'address_enrichment',
    description: 'Wzbogacanie adresu',
    priority: 100,
    condition: (value: string, context: TransformationContext) => {
      const fieldType = context.field?.metadata?.fieldType || '';
      return fieldType === 'address';
    },
    transform: (value: string, context: TransformationContext): TransformationResult => {
      const normalizedAddress = normalizeAddressField(value);
      
      return {
        value: normalizedAddress || value,
        content: normalizedAddress || value,
        confidence: context.confidence ?? 0,
        metadata: {
          fieldType: 'address',
          transformationType: 'enrichment',
          source: 'normalized',
          status: normalizedAddress ? 'success' : 'failed',
          originalValue: value
        }
      };
    }
  }
]; 