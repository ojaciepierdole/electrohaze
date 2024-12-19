import {
  DocumentField,
  TransformationContext,
  TransformationResult,
  TransformationRule,
  ExtendedDocumentField
} from '@/types/processing';
import { textProcessor } from '@/utils/core/text-processor';

function adaptDocumentField(field: DocumentField): ExtendedDocumentField {
  return {
    ...field,
    name: '',
    type: '',
    isRequired: false,
    description: '',
    group: 'buyer_data',
    confidence: field.confidence,
    content: field.content,
    metadata: {
      fieldType: field.metadata?.fieldType || '',
      transformationType: field.metadata?.transformationType || '',
      originalValue: field.metadata?.originalValue || '',
      source: field.metadata?.source || '',
      boundingRegions: field.metadata?.boundingRegions,
      spans: field.metadata?.spans
    }
  };
}

export function processField(
  field: DocumentField,
  rules: TransformationRule[],
  context: TransformationContext = { confidence: 0 }
): TransformationResult {
  const adaptedField = adaptDocumentField(field);
  return textProcessor.processField(adaptedField, rules, context);
}
