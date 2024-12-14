import { NormalizedAddress, ProcessingOptions, DataSection } from '../types';
import { normalizeAddress, normalizePostalCode, normalizeCity } from '../normalizers/address';

interface AddressSet {
  firstName?: { content: string; confidence: number };
  lastName?: { content: string; confidence: number };
  street?: { content: string; confidence: number };
  building?: { content: string; confidence: number };
  unit?: { content: string; confidence: number };
  postalCode?: { content: string; confidence: number };
  city?: { content: string; confidence: number };
  fullAddress?: { content: string; confidence: number };
}

interface WeightedAddress {
  address: NormalizedAddress;
  weight: number;
  section: DataSection;
}

const SECTION_TO_PREFIX: Record<DataSection, 'dp' | 'pa' | 'supplier'> = {
  ppe: 'dp',
  correspondence: 'pa',
  supplier: 'supplier',
  delivery: 'dp'
};

export function enrichAddress(
  addresses: Record<DataSection, AddressSet | undefined>,
  options: ProcessingOptions = {}
): Record<DataSection, NormalizedAddress> {
  const { confidenceThreshold = 0.3 } = options;
  
  // Najpierw normalizujemy wszystkie adresy
  const normalizedAddresses: Record<DataSection, NormalizedAddress> = {
    ppe: normalizeAddress(null, options, 'dp'),
    correspondence: normalizeAddress(null, options, 'pa'),
    delivery: normalizeAddress(null, options, 'dp'),
    supplier: normalizeAddress(null, options, 'supplier')
  };

  // Przetwórz każdą sekcję
  Object.entries(addresses).forEach(([section, addressSet]) => {
    if (!addressSet) {
      return; // Sekcja już ma domyślne wartości null
    }

    const prefix = SECTION_TO_PREFIX[section as DataSection];

    // Normalizuj imię i nazwisko
    const firstName = addressSet.firstName?.content || null;
    const lastName = addressSet.lastName?.content || null;

    // Normalizuj ulicę
    const streetNormalized = normalizeAddress(addressSet.street || addressSet.fullAddress, options, prefix);
    
    // Normalizuj numer budynku i mieszkania
    const buildingNormalized = normalizeAddress(addressSet.building, options, prefix);
    const unitNormalized = normalizeAddress(addressSet.unit, options, prefix);

    // Normalizuj kod pocztowy i miasto
    const postalCode = normalizePostalCode(addressSet.postalCode?.content || null);
    const city = normalizeCity(addressSet.city?.content || null);

    // Połącz dane
    normalizedAddresses[section as DataSection] = {
      ...normalizedAddresses[section as DataSection],
      [`${prefix}FirstName`]: firstName,
      [`${prefix}LastName`]: lastName,
      [`${prefix}Street`]: streetNormalized[`${prefix}Street`],
      [`${prefix}Building`]: buildingNormalized[`${prefix}Building`] || streetNormalized[`${prefix}Building`],
      [`${prefix}Unit`]: unitNormalized[`${prefix}Unit`] || streetNormalized[`${prefix}Unit`],
      [`${prefix}PostalCode`]: postalCode,
      [`${prefix}City`]: city,
      confidence: Math.max(
        addressSet.firstName?.confidence || 0,
        addressSet.lastName?.confidence || 0,
        streetNormalized.confidence,
        buildingNormalized.confidence,
        unitNormalized.confidence,
        addressSet.postalCode?.confidence || 0,
        addressSet.city?.confidence || 0
      )
    };
  });

  return normalizedAddresses;
}

function getAddressSectionWeight(section: DataSection): number {
  switch (section) {
    case 'ppe':
      return 1.0;
    case 'correspondence':
      return 0.8;
    case 'delivery':
      return 0.8;
    case 'supplier':
      return 0.6;
    default:
      return 0.5;
  }
}

function checkAddressConsistency(
  weightedAddresses: WeightedAddress[],
  normalizedAddresses: Record<DataSection, NormalizedAddress>
): void {
  if (weightedAddresses.length < 2) return;

  // Sortuj adresy według wagi
  weightedAddresses.sort((a, b) => b.weight - a.weight);

  // Weź adres z najwyższą wagą jako referencyjny
  const reference = weightedAddresses[0];
  const refPrefix = SECTION_TO_PREFIX[reference.section];

  // Sprawdź spójność z pozostałymi adresami
  weightedAddresses.slice(1).forEach(weighted => {
    const { address, section } = weighted;
    const prefix = SECTION_TO_PREFIX[section];

    // Sprawdź czy ulice są podobne
    if (reference.address[`${refPrefix}Street`] && address[`${prefix}Street`]) {
      const similarity = calculateStreetSimilarity(
        reference.address[`${refPrefix}Street`],
        address[`${prefix}Street`]
      );
      if (similarity > 0.8) {
        // Jeśli ulice są bardzo podobne, ale numery się różnią,
        // możemy uzupełnić brakujące informacje
        if (!normalizedAddresses[section][`${prefix}Building`] && reference.address[`${refPrefix}Building`]) {
          normalizedAddresses[section][`${prefix}Building`] = reference.address[`${refPrefix}Building`];
        }
        if (!normalizedAddresses[section][`${prefix}Unit`] && reference.address[`${refPrefix}Unit`]) {
          normalizedAddresses[section][`${prefix}Unit`] = reference.address[`${refPrefix}Unit`];
        }
      }
    }

    // Sprawdź spójność kodów pocztowych i miast
    if (!normalizedAddresses[section][`${prefix}PostalCode`] && reference.address[`${refPrefix}PostalCode`]) {
      normalizedAddresses[section][`${prefix}PostalCode`] = reference.address[`${refPrefix}PostalCode`];
    }
    if (!normalizedAddresses[section][`${prefix}City`] && reference.address[`${refPrefix}City`]) {
      normalizedAddresses[section][`${prefix}City`] = reference.address[`${refPrefix}City`];
    }
  });
}

function calculateStreetSimilarity(street1: string | null, street2: string | null): number {
  if (!street1 || !street2) return 0;
  
  // Prosta implementacja podobieństwa - można rozszerzyć o bardziej zaawansowane algorytmy
  const s1 = street1.toUpperCase();
  const s2 = street2.toUpperCase();
  
  if (s1 === s2) return 1;
  
  // Usuń wszystkie białe znaki i porównaj
  const clean1 = s1.replace(/\s+/g, '');
  const clean2 = s2.replace(/\s+/g, '');
  
  if (clean1 === clean2) return 0.9;
  
  // Można dodać bardziej zaawansowane porównania, np. odległość Levenshteina
  return 0;
} 