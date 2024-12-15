import type { DocumentField, DocumentStringField } from '@azure/ai-form-recognizer';
import type {
  ProcessingContext,
  DocumentProcessingResult,
  TransformationContext,
  TransformationResult,
  TransformationRule,
  ExtendedDocumentField
} from '@/types/processing';
import { textProcessor } from '@/utils/processors/text-processor';

function adaptDocumentField(field: DocumentField): ExtendedDocumentField {
  return {
    content: field.content || null,
    confidence: field.confidence,
    boundingRegions: field.boundingRegions,
    spans: field.spans
  };
}

function createDocumentField(field: ExtendedDocumentField): DocumentField {
  return {
    content: field.content || '',
    confidence: field.confidence,
    boundingRegions: field.boundingRegions || [],
    spans: field.spans || [],
    kind: field.kind || 'string',
    properties: field.properties || {}
  };
}

/**
 * Przetwarza tekst używając procesora tekstu
 */
export function processText(
  text: string,
  context: ProcessingContext
): TransformationResult {
  return textProcessor.process(text, context);
}

/**
 * Przetwarza pole dokumentu według reguł
 */
export function processField(
  field: DocumentField,
  rules: TransformationRule[],
  context: ProcessingContext = {}
): DocumentProcessingResult {
  try {
    // Sortuj reguły według priorytetu
    const sortedRules = [...rules].sort((a, b) => 
      (b.priority || 0) - (a.priority || 0)
    );

    const adaptedField = adaptDocumentField(field);

    // Zastosuj reguły w kolejności
    for (const rule of sortedRules) {
      const transformContext: TransformationContext = {
        ...context,
        field: context.field || '',
        value: adaptedField.content || '',
        confidence: adaptedField.confidence,
        metadata: {
          ...context.metadata,
          ruleName: rule.name,
          confidenceThreshold: context.confidenceThreshold
        }
      };

      const result = rule.transform(transformContext);

      if (!result.value) {
        continue;
      }

      return {
        success: true,
        fileName: '',
        data: {
          [context.field || '']: createDocumentField({
            ...adaptedField,
            content: result.value,
            confidence: result.confidence
          })
        },
        modelResults: [],
        processingTime: 0,
        confidence: result.confidence,
        cacheStats: {
          size: 0,
          maxSize: 0,
          ttl: 0
        },
        metadata: {
          ...context.metadata,
          ...result.metadata,
          appliedRule: rule.name
        }
      };
    }

    // Jeśli żadna reguła nie została zastosowana
    return {
      success: false,
      fileName: '',
      errors: ['No matching rules found'],
      modelResults: [],
      processingTime: 0,
      confidence: 0,
      cacheStats: {
        size: 0,
        maxSize: 0,
        ttl: 0
      },
      metadata: context.metadata
    };
  } catch (error) {
    return {
      success: false,
      fileName: '',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      modelResults: [],
      processingTime: 0,
      confidence: 0,
      cacheStats: {
        size: 0,
        maxSize: 0,
        ttl: 0
      },
      metadata: context.metadata
    };
  }
}

/**
 * Przetwarza wiele pól dokumentu
 */
export function processFields(
  fields: Record<string, DocumentField>,
  rules: TransformationRule[],
  context: ProcessingContext = {}
): DocumentProcessingResult {
  try {
    const results: Record<string, DocumentField> = {};
    const errors: string[] = [];

    for (const [key, field] of Object.entries(fields)) {
      const result = processField(
        field,
        rules,
        {
          ...context,
          field: key,
          metadata: {
            ...context.metadata,
            fieldKey: key
          }
        }
      );

      if (result.success && result.data) {
        Object.assign(results, result.data);
      } else if (result.errors) {
        errors.push(...result.errors.map(err => `${key}: ${err}`));
      }
    }

    return {
      success: errors.length === 0,
      fileName: '',
      data: results,
      errors: errors.length > 0 ? errors : undefined,
      modelResults: [],
      processingTime: 0,
      confidence: Object.values(results).reduce((acc, field) => acc + field.confidence, 0) / Object.keys(results).length,
      cacheStats: {
        size: 0,
        maxSize: 0,
        ttl: 0
      },
      metadata: context.metadata
    };
  } catch (error) {
    return {
      success: false,
      fileName: '',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      modelResults: [],
      processingTime: 0,
      confidence: 0,
      cacheStats: {
        size: 0,
        maxSize: 0,
        ttl: 0
      },
      metadata: context.metadata
    };
  }
}
