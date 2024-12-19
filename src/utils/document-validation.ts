import { DocumentSections, calculateDocumentCompleteness } from './data-processing/completeness/confidence';

export function isDocumentComplete(sections: DocumentSections): boolean {
  const completeness = calculateDocumentCompleteness(sections);
  
  // Debugowanie
  console.log('Document validation:', {
    validFields: completeness.validFields,
    totalFields: completeness.totalFields,
    completeness: completeness.completeness,
    sectionCompleteness: completeness.sectionCompleteness
  });

  // Zmniejszmy wymagania:
  // 1. Dokument jest kompletny jeśli ma co najmniej 60% wymaganych pól
  // 2. Średnia pewność rozpoznania musi być >= 0.8
  const fieldsRatio = completeness.validFields / completeness.totalFields;
  const isValid = fieldsRatio >= 0.6 && completeness.completeness >= 0.8;

  console.log('Validation result:', {
    fieldsRatio,
    isValid
  });

  return isValid;
} 