import {
  TransformationContext,
  TransformationResult,
  TransformationRule
} from '@/types/document-processing';

export class TextTransformer {
  private rules: TransformationRule[];

  constructor(rules: TransformationRule[]) {
    this.rules = rules.sort((a, b) => b.priority - a.priority);
  }

  transform(value: string, context: TransformationContext): TransformationResult {
    if (!value) {
      return {
        value: '',
        content: '',
        confidence: 0,
        metadata: { empty: true }
      };
    }

    // Znajdź pierwszą pasującą regułę
    const matchingRule = this.rules.find(rule => {
      if (!rule.condition) return true;
      return rule.condition(value, context);
    });

    if (matchingRule) {
      return matchingRule.transform(value, context);
    }

    // Jeśli nie znaleziono reguły, zwróć oryginalną wartość
    return {
      value: value,
      content: value,
      confidence: context.confidence ?? 0,
      metadata: { transformed: false }
    };
  }

  transformFields(
    fields: Record<string, { content: string; confidence: number }>,
    context: TransformationContext
  ): Record<string, TransformationResult> {
    const result: Record<string, TransformationResult> = {};

    for (const [field, data] of Object.entries(fields)) {
      if (!data.content) {
        result[field] = {
          value: '',
          content: '',
          confidence: 0,
          metadata: { empty: true }
        };
        continue;
      }

      const fieldContext: TransformationContext = {
        ...context,
        value: data.content,
        confidence: data.confidence,
        field
      };

      result[field] = this.transform(data.content, fieldContext);
    }

    return result;
  }
} 