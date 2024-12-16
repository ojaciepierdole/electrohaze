import type { DocumentField, ProcessSectionInput, ProcessSectionContext } from '@/types/document-processing';
import type { SupplierData, CustomerData, PPEData, CorrespondenceData, BillingData } from '@/types/fields';
import { DocumentProcessor } from './data-processing/core/processor';
import { normalizeText } from './data-processing/core/normalization';

// Typy sekcji dokumentu
export type DocumentSection = 'ppe' | 'correspondence' | 'supplier' | 'billing' | 'customer';

// Typ dla danych wejściowych
export type SectionData = 
  | PPEData 
  | CorrespondenceData 
  | SupplierData 
  | CustomerData 
  | BillingData;

// Interfejs dla reguł przetwarzania
interface ProcessingRules {
  [key: string]: (value: string) => string;
}

// Interfejs dla kontekstu przetwarzania
interface ProcessingContext {
  ppe?: Partial<PPEData>;
  customer?: Partial<CustomerData>;
  correspondence?: Partial<CorrespondenceData>;
}

// Inicjalizacja procesora dokumentów
const documentProcessor = new DocumentProcessor();

// Funkcja pomocnicza do konwersji Partial<T> na Record<string, DocumentField>
function convertToDocumentFields<T extends Record<string, DocumentField>>(
  data: Partial<T>
): Record<string, DocumentField> {
  const result: Record<string, DocumentField> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  
  return result;
}

// Główna funkcja przetwarzająca sekcję
export function processSection<T extends Record<string, DocumentField>>(
  section: DocumentSection,
  data: Partial<T>,
  context?: ProcessingContext
): Partial<T> {
  // Najpierw wykonaj podstawowe mapowanie i normalizację
  const result = { ...data } as Partial<T>;

  // Mapowanie starych nazw pól na nowe
  if (section === 'ppe' && 'Tariff' in data) {
    result['TariffGroup' as keyof T] = data['Tariff' as keyof T];
    delete result['Tariff' as keyof T];
  }

  // Konwertuj dane do formatu DocumentField
  const documentFields = convertToDocumentFields(result);

  // Przetwórz dane przez DocumentProcessor
  const processed = documentProcessor.processSection(section, documentFields);

  // Konwertuj z powrotem na Partial<T>
  return processed as Partial<T>;
} 