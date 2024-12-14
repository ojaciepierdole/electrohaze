export interface FieldWithConfidence {
  content: string;
  confidence: number;
}

export interface AddressComponents {
  dpFirstName: string | null;
  dpLastName: string | null;
  dpStreet: string | null;
  dpBuilding: string | null;
  dpUnit: string | null;
  dpPostalCode: string | null;
  dpCity: string | null;
  paFirstName: string | null;
  paLastName: string | null;
  paStreet: string | null;
  paBuilding: string | null;
  paUnit: string | null;
  paPostalCode: string | null;
  paCity: string | null;
  supplierFirstName: string | null;
  supplierLastName: string | null;
  supplierStreet: string | null;
  supplierBuilding: string | null;
  supplierUnit: string | null;
  supplierPostalCode: string | null;
  supplierCity: string | null;
}

export interface PersonComponents {
  firstName: string | null;
  lastName: string | null;
  title: string | null;
}

export interface NormalizedAddress extends AddressComponents {
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