// Prefiksy adresowe
export type AddressPrefix = 'dp' | 'pa' | 'supplier';

// Klucze pól adresowych
export type AddressStreetKey = `${AddressPrefix}Street`;
export type AddressBuildingKey = `${AddressPrefix}Building`;
export type AddressUnitKey = `${AddressPrefix}Unit`;
export type AddressCityKey = `${AddressPrefix}City`;
export type AddressPostalCodeKey = `${AddressPrefix}PostalCode`;
export type AddressFirstNameKey = `${AddressPrefix}FirstName`;
export type AddressLastNameKey = `${AddressPrefix}LastName`;

// Komponenty adresu
export interface AddressComponents {
  dpStreet: string | null;
  dpBuilding: string | null;
  dpUnit: string | null;
  dpCity: string | null;
  dpPostalCode: string | null;
  dpFirstName: string | null;
  dpLastName: string | null;
  paStreet: string | null;
  paBuilding: string | null;
  paUnit: string | null;
  paCity: string | null;
  paPostalCode: string | null;
  paFirstName: string | null;
  paLastName: string | null;
  supplierStreet: string | null;
  supplierBuilding: string | null;
  supplierUnit: string | null;
  supplierCity: string | null;
  supplierPostalCode: string | null;
  supplierFirstName: string | null;
  supplierLastName: string | null;
}

// Opcje normalizacji adresu
export interface AddressNormalizationOptions {
  confidenceThreshold?: number;
  preserveCase?: boolean;
  strictMode?: boolean;
  removePrefix?: boolean;
  normalizePolish?: boolean;
}

// Wynik normalizacji
export interface AddressNormalizationResult {
  value: string;
  confidence: number;
  metadata?: {
    originalValue: string;
    transformationType: string;
    [key: string]: unknown;
  };
}

// Stałe dla adresów
export const ADDRESS_CONSTANTS = {
  // Prefiksy do usunięcia
  REMOVABLE_PREFIXES: [
    'UL', 'UL.', 'ULICA',
    'OS', 'OS.'
  ],

  // Prefiksy do zachowania i ich pełne formy
  PREFIX_MAPPINGS: {
    'ALEJA': 'ALEJA',
    'AL.': 'AL.',
    'AL': 'AL.',
    'PLAC': 'PLAC',
    'PL.': 'PLAC',
    'PL': 'PLAC',
    'OSIEDLE': 'OSIEDLE',
    'RONDO': 'RONDO'
  },

  // Separatory numeru mieszkania
  BUILDING_UNIT_SEPARATORS: [
    'm.', 'm', 'lok.', 'lok', 'mieszk.', 'mieszk', '/'
  ]
} as const; 