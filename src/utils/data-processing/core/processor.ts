import type { DocumentData } from '@/types/document-processing';
import { DocumentTransformer } from './transform';
import { personNameRules } from '../rules/person';
import { addressRules } from '../rules/address';
import { tariffRules } from '../rules/tariff';

/**
 * Klasa odpowiedzialna za przetwarzanie dokumentów
 */
export class DocumentProcessor {
  private transformer: DocumentTransformer;

  constructor() {
    this.transformer = new DocumentTransformer();
    
    // Dodaj wszystkie reguły transformacji
    this.transformer.addRules([
      ...personNameRules,
      ...addressRules,
      ...tariffRules
    ]);
  }

  /**
   * Przetwarza cały dokument
   */
  processDocument(document: DocumentData): DocumentData {
    console.group('DocumentProcessor - przetwarzanie dokumentu');
    console.log('Dane wejściowe:', document);

    try {
      // Wykonaj transformacje dokumentu
      const transformedDocument = this.transformer.transformDocument(document);
      console.log('Dokument po transformacji:', transformedDocument);

      return transformedDocument;
    } catch (error) {
      console.error('Błąd podczas przetwarzania dokumentu:', error);
      return document;
    } finally {
      console.groupEnd();
    }
  }

  /**
   * Przetwarza pojedynczą sekcję dokumentu
   */
  processSection(section: string, data: DocumentData[string]): DocumentData[string] {
    console.group(`DocumentProcessor - przetwarzanie sekcji: ${section}`);
    console.log('Dane wejściowe:', data);

    try {
      // Utwórz tymczasowy dokument z jedną sekcją
      const tempDocument = {
        [section]: data
      };

      // Przetwórz dokument
      const processed = this.processDocument(tempDocument);

      // Zwróć przetworzoną sekcję
      return processed[section];
    } catch (error) {
      console.error(`Błąd podczas przetwarzania sekcji ${section}:`, error);
      return data;
    } finally {
      console.groupEnd();
    }
  }

  /**
   * Przetwarza pojedyncze pole dokumentu
   */
  processField(section: string, field: string, value: string | null | undefined): string | null | undefined {
    console.group(`DocumentProcessor - przetwarzanie pola: ${section}.${field}`);
    console.log('Wartość wejściowa:', value);

    try {
      // Jeśli wartość jest undefined lub null, zwróć ją bez przetwarzania
      if (value === undefined || value === null) {
        return value;
      }

      // Utwórz tymczasowy dokument z jednym polem
      const tempDocument = {
        [section]: {
          [field]: {
            content: value,
            confidence: 1
          }
        }
      };

      // Przetwórz dokument
      const processed = this.processDocument(tempDocument);

      // Zwróć przetworzoną wartość
      const result = processed[section][field].content;
      console.log('Wynik:', result);
      return result;
    } catch (error) {
      console.error(`Błąd podczas przetwarzania pola ${section}.${field}:`, error);
      return value;
    } finally {
      console.groupEnd();
    }
  }
} 