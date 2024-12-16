import type { FieldWithConfidence } from '@/types/document-processing';

interface ConfidenceField {
  confidence: number;
}

export function calculateGroupConfidence(fields: ConfidenceField[]): number {
  if (!fields.length) return 0;
  
  const sum = fields.reduce((acc, field) => acc + field.confidence, 0);
  return sum / fields.length;
}

/**
 * Oblicza średnią pewność dla wszystkich pól
 * @param fields Obiekt z polami zawierającymi wartości pewności
 * @returns Średnia pewność dla wszystkich pól (0-1)
 */
export function calculateTotalConfidence(fields: Record<string, FieldWithConfidence>): number {
  const values = Object.values(fields);
  if (values.length === 0) return 0;
  
  const sum = values.reduce((acc, field) => acc + field.confidence, 0);
  return sum / values.length;
}

/**
 * Oblicza procent wypełnionych pól
 * @param fields Obiekt z polami
 * @returns Procent wypełnionych pól (0-1)
 */
export function calculateCompleteness(fields: Record<string, { content: string | null | undefined }>): number {
  const values = Object.values(fields);
  if (values.length === 0) return 0;
  
  const filledFields = values.filter(field => field.content !== null && field.content !== undefined);
  return filledFields.length / values.length;
} 