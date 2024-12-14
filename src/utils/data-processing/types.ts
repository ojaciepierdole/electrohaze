export interface FieldWithConfidence {
  content: string;
  confidence: number;
}

export interface AddressComponents {
  street: string | null;
  building: string | null;
  unit: string | null;
}

export interface PersonComponents {
  firstName: string | null;
  lastName: string | null;
  title: string | null;
}

export interface NormalizedAddress extends AddressComponents {
  originalStreet: string | null;
  postalCode: string | null;
  city: string | null;
  confidence: number;
}

export interface NormalizedPerson extends PersonComponents {
  originalName: string | null;
  confidence: number;
}

export type DataSection = 'ppe' | 'correspondence' | 'delivery' | 'supplier';

export interface ProcessingOptions {
  confidenceThreshold?: number;
  preserveCase?: boolean;
  strictMode?: boolean;
} 