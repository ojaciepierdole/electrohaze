import { FieldConfidence, ConfidenceStats } from '../types/confidence';
import { DocumentField, FieldWithConfidence } from '@/types/processing';

export class ConfidenceCalculator {
  static calculateStats(fields: FieldConfidence[]): ConfidenceStats {
    const stats: ConfidenceStats = {
      high: 0,
      medium: 0,
      low: 0,
      total: fields.length
    };

    fields.forEach(field => {
      const confidence = field.confidence * 100; // Zakładamy, że pewność jest w zakresie 0-1
      
      if (confidence >= 90) {
        stats.high++;
      } else if (confidence >= 70) {
        stats.medium++;
      } else {
        stats.low++;
      }
    });

    return stats;
  }

  static getAverageConfidence(fields: FieldConfidence[]): number {
    if (fields.length === 0) return 0;
    
    const sum = fields.reduce((acc, field) => acc + field.confidence, 0);
    return (sum / fields.length) * 100; // Zwracamy jako procent
  }

  static calculateSectionStats(fields: Record<string, FieldWithConfidence>): ConfidenceStats {
    const fieldConfidences = Object.entries(fields).map(([fieldName, field]) => ({
      fieldName,
      confidence: field.confidence
    }));

    return this.calculateStats(fieldConfidences);
  }

  static getSectionAverageConfidence(fields: Record<string, FieldWithConfidence>): number {
    const fieldConfidences = Object.entries(fields).map(([fieldName, field]) => ({
      fieldName,
      confidence: field.confidence
    }));

    return this.getAverageConfidence(fieldConfidences);
  }
} 