import { DocumentProcessor } from './core/processor';
import type { DocumentData } from '@/types/document-processing';

// Singleton instancja procesora dokumentów
const documentProcessor = new DocumentProcessor();

/**
 * Przetwarza cały dokument
 */
export function processDocument(document: DocumentData): DocumentData {
  return documentProcessor.processDocument(document);
}

/**
 * Przetwarza pojedynczą sekcję dokumentu
 */
export function processSection(section: string, data: DocumentData[string]): DocumentData[string] {
  return documentProcessor.processSection(section, data);
}

/**
 * Przetwarza pojedyncze pole dokumentu
 */
export function processField(section: string, field: string, value: string): string | null {
  const result = documentProcessor.processField(section, field, value);
  return result ?? null;
}

// Eksportuj wszystkie typy i interfejsy
export * from '@/types/document-processing';
export * from './rules/person';
export * from './rules/address'; 