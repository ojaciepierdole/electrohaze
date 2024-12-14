import { NormalizedAddress, ProcessingOptions, DataSection } from '../types';
import { normalizeAddress, normalizePostalCode, normalizeCity } from '../normalizers/address';

interface AddressSet {
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

export function enrichAddress(
  addresses: Record<DataSection, AddressSet | undefined>,
  options: ProcessingOptions = {}
): Record<DataSection, NormalizedAddress> {
  const { confidenceThreshold = 0.3 } = options;
  
  // Najpierw normalizujemy wszystkie adresy
  const normalizedAddresses: Record<DataSection, NormalizedAddress> = {};

  // Przetwórz każdą sekcję
  Object.entries(addresses).forEach(([section, addressSet]) => {
    if (!addressSet) {
      normalizedAddresses[section as DataSection] = {
        street: null,
        building: null,
        unit: null,
        originalStreet: null,
        postalCode: null,
        city: null,
        confidence: 0
      };
      return;
    }

    // Normalizuj ulicę
    const streetNormalized = normalizeAddress(addressSet.street || addressSet.fullAddress, options);
    
    // Normalizuj numer budynku i mieszkania
    const buildingNormalized = normalizeAddress(addressSet.building, options);
    const unitNormalized = normalizeAddress(addressSet.unit, options);

    // Połącz dane
    normalizedAddresses[section as DataSection] = {
      street: streetNormalized.street,
      building: buildingNormalized.building || streetNormalized.building,
      unit: unitNormalized.unit || streetNormalized.unit,
      originalStreet: streetNormalized.originalStreet,
      postalCode: normalizePostalCode(addressSet.postalCode?.content || null),
      city: normalizeCity(addressSet.city?.content || null),
      confidence: Math.max(
        streetNormalized.confidence,
        buildingNormalized.confidence,
        unitNormalized.confidence,
        addressSet.postalCode?.confidence || 0,
        addressSet.city?.confidence || 0
      )
    };
  });

  // Przygotuj ważone adresy do analizy spójności
  const weightedAddresses: WeightedAddress[] = Object.entries(normalizedAddresses)
    .filter(([_, address]) => address.confidence >= confidenceThreshold)
    .map(([section, address]) => ({
      address,
      weight: getAddressSectionWeight(section as DataSection),
      section: section as DataSection
    }));

  // Sprawdź spójność między adresami
  checkAddressConsistency(weightedAddresses, normalizedAddresses);

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

  // Sprawdź spójność z pozostałymi adresami
  weightedAddresses.slice(1).forEach(weighted => {
    const { address, section } = weighted;

    // Sprawdź czy ulice są podobne
    if (reference.address.street && address.street) {
      const similarity = calculateStreetSimilarity(reference.address.street, address.street);
      if (similarity > 0.8) {
        // Jeśli ulice są bardzo podobne, ale numery się różnią,
        // możemy uzupełnić brakujące informacje
        if (!normalizedAddresses[section].building && reference.address.building) {
          normalizedAddresses[section].building = reference.address.building;
        }
        if (!normalizedAddresses[section].unit && reference.address.unit) {
          normalizedAddresses[section].unit = reference.address.unit;
        }
      }
    }

    // Sprawdź spójność kodów pocztowych i miast
    if (!normalizedAddresses[section].postalCode && reference.address.postalCode) {
      normalizedAddresses[section].postalCode = reference.address.postalCode;
    }
    if (!normalizedAddresses[section].city && reference.address.city) {
      normalizedAddresses[section].city = reference.address.city;
    }
  });
}

function calculateStreetSimilarity(street1: string, street2: string): number {
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