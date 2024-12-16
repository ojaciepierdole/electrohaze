export type AddressPrefix = '' | 'supplier' | 'pa';

export interface NormalizedAddress {
  street: string;
  building: string;
  unit?: string;
  postalCode: string;
  city: string;
  municipality?: string;
  district?: string;
  province?: string;
}

export type DataSection = {
  id: string;
  label: string;
  fields: string[];
  required?: boolean;
  confidence?: number;
  isComplete?: boolean;
  dependsOn?: string[];
  calculateConfidence?: (data: Record<string, string | undefined>) => number;
  validate?: (data: Record<string, string | undefined>) => boolean;
};

export type DataSectionGroup = {
  id: string;
  label: string;
  sections: DataSection[];
  confidence?: number;
  isComplete?: boolean;
}; 