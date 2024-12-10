import { ApiField, ProcessedField } from '@/types/processing';
import { FIELD_GROUPS, type FieldGroupKey } from '@/config/fields';

// Funkcja konwertująca pola z API do formatu wyświetlania
export const convertApiFields = (fields: Record<string, ApiField>): Record<string, ProcessedField> => {
  return Object.entries(fields).reduce((acc, [key, field]) => {
    acc[key] = {
      kind: field.kind,
      content: field.content,
      value: field.value,
      confidence: field.confidence
    };
    return acc;
  }, {} as Record<string, ProcessedField>);
};

// Funkcja sprawdzająca czy wszystkie wymagane pola w grupie są wypełnione
export const isGroupComplete = (fields: Record<string, ProcessedField>, groupName: FieldGroupKey): boolean => {
  const group = FIELD_GROUPS[groupName];
  if (!group) return false;

  return group.requiredFields.every((fieldName: string) => {
    const field = fields[fieldName];
    return field && field.value && field.value !== 'Nie znaleziono';
  });
};

// Funkcja sprawdzająca czy dokument spełnia baseline
export const checkPositiveBaseline = (fields: Record<string, ProcessedField>): boolean => {
  // Sprawdź czy kluczowe pola są wypełnione z wysoką pewnością
  const requiredFields = ['invoiceNumber', 'invoiceDate', 'totalAmount', 'supplierName'];
  return requiredFields.every(fieldName => {
    const field = fields[fieldName];
    return field && field.content && field.confidence > 0.8;
  });
};

// Funkcja sprawdzająca czy wszystkie pola mają wysoką pewność
export const checkTopScore = (fields: Record<string, ProcessedField>): boolean => {
  // Sprawdź czy wszystkie znalezione pola mają wysoką pewność
  return Object.values(fields).every(field => 
    field.content === null || field.confidence > 0.9
  );
};

// Funkcja obliczająca procent wypełnienia grupy
export const calculateGroupCompletion = (
  fields: Record<string, ProcessedField>,
  groupKey: FieldGroupKey
): number => {
  const group = FIELD_GROUPS[groupKey];
  if (!group) return 0;

  const groupFields = group.fields as string[];
  const filledFields = groupFields.filter(fieldName => {
    const field = fields[fieldName];
    return field && field.content && field.confidence > 0.7;
  });

  return Math.round((filledFields.length / groupFields.length) * 100);
};

// Funkcja skracająca nazwę pliku
export const truncateFileName = (fileName: string, maxLength: number = 40): string => {
  if (fileName.length <= maxLength) return fileName;
  const extension = fileName.split('.').pop();
  const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.'));
  const truncated = nameWithoutExt.slice(0, maxLength - 3 - (extension?.length || 0));
  return `${truncated}...${extension}`;
};

// Funkcja zwracająca kolor dla danego procentu ukończenia
export const getCompletionColor = (completion: number): string => {
  if (completion >= 90) return "text-green-500";
  if (completion >= 70) return "text-blue-500";
  if (completion >= 50) return "text-yellow-500";
  if (completion > 0) return "text-red-500";
  return "text-gray-300";
}; 