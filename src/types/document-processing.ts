/**
 * Typy sekcji dokumentu
 */
export type DocumentSection = 'ppe' | 'correspondence' | 'customer' | 'supplier';

/**
 * Interfejs reprezentujący imię i nazwisko
 */
export interface PersonName {
  firstName: string | null;
  lastName: string | null;
}

/**
 * Interfejs reprezentujący adres
 */
export interface Address {
  street: string | null;
  building: string | null;
  unit: string | null;
  postalCode: string | null;
  city: string | null;
  municipality?: string | null;
  district?: string | null;
  province?: string | null;
}

/**
 * Interfejs reprezentujący wynik przetwarzania
 */
export interface ProcessingResult<T> {
  value: T;
  confidence: number;
  source: {
    section: DocumentSection;
    field: string;
  };
  metadata?: {
    originalValue?: string;
    transformations?: string[];
    generatedFrom?: string;
  };
}

/**
 * Interfejs reprezentujący pojedyncze pole dokumentu
 */
export interface DocumentField {
  content: string | null;
  confidence: number;
  boundingRegions?: Array<{
    pageNumber: number;
    polygon: Array<{ x: number; y: number }>;
  }>;
  spans?: Array<{
    offset: number;
    length: number;
  }>;
  metadata?: {
    originalValue?: string;
    transformations?: string[];
    generatedFrom?: string;
    transformationType?: string;
  };
}

/**
 * Interfejs reprezentujący dane dokumentu
 */
export interface DocumentData {
  [section: string]: {
    [field: string]: DocumentField;
  };
}

/**
 * Interfejs reprezentujący kontekst transformacji
 */
export interface TransformationContext {
  section: DocumentSection;
  field: string;
  document: DocumentData;
  metadata?: Record<string, any>;
}

/**
 * Interfejs reprezentujący wynik transformacji
 */
export interface TransformationResult {
  value: string | null;
  additionalFields?: {
    [field: string]: {
      value: string;
      confidence: number;
      metadata?: Record<string, any>;
    };
  };
  metadata?: {
    originalValue?: string;
    transformationType?: string;
    [key: string]: any;
  };
}

/**
 * Interfejs reprezentujący regułę transformacji
 */
export interface TransformationRule {
  name: string;
  condition: (value: string, context: TransformationContext) => boolean;
  transform: (value: string, context: TransformationContext) => TransformationResult;
  priority: number;
} 