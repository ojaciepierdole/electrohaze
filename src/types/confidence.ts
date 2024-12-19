export interface ConfidenceStats {
  high: number;    // ≥90%
  medium: number;  // 70-89%
  low: number;     // <70%
  total: number;   // suma wszystkich pól
}

export interface FieldConfidence {
  fieldName: string;
  confidence: number;
} 