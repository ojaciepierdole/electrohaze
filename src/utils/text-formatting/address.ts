import type { FieldWithConfidence } from './types';
import { mergeFieldsWithConfidence } from './person';

// Funkcja do rozdzielania połączonego adresu
export function splitAddressLine(addressLine: string | null): {
  street: string | null;
  building: string | null;
  unit: string | null;
} {
  if (!addressLine) return { street: null, building: null, unit: null };

  // Usuń nadmiarowe białe znaki i normalizuj wielkość liter
  const cleanedAddress = addressLine.trim().toUpperCase();

  // Usuń prefiksy ulicy (UL, ULICA) na początku adresu
  const withoutPrefix = cleanedAddress.replace(/^(?:UL\.?|ULICA)\s+/i, '');

  // Typowe wzorce adresów w Polsce
  const patterns = [
    // Nazwa Ulicy 123/45
    /^([^0-9]+?)\s+(\d+[A-Z]?)(?:\/(\d+[A-Z]?))?$/i,
    
    // Nazwa Ulicy 123 m. 45
    /^([^0-9]+?)\s+(\d+[A-Z]?)(?:\s+m\.?\s*(\d+[A-Z]?))?$/i,
    
    // Nazwa Ulicy 123 lok. 45
    /^([^0-9]+?)\s+(\d+[A-Z]?)(?:\s+lok\.?\s*(\d+[A-Z]?))?$/i,
    
    // Nazwa Ulicy 123/45/67 (podwójny numer budynku i mieszkanie)
    /^([^0-9]+?)\s+(\d+[A-Z]?\/\d+[A-Z]?)\/(\d+[A-Z]?)$/i,
    
    // Nazwa Ulicy 123A
    /^([^0-9]+?)\s+(\d+[A-Z]?)$/i
  ];

  for (const pattern of patterns) {
    const match = withoutPrefix.match(pattern);
    if (match) {
      const [_, street, building, unit] = match;
      return {
        street: street.trim(),
        building: building.trim(),
        unit: unit ? unit.trim() : null
      };
    }
  }

  // Jeśli nie pasuje do żadnego wzorca, spróbuj znaleźć ostatnią grupę cyfr jako numer
  const lastNumberMatch = withoutPrefix.match(/^(.*?)\s+(\d+[A-Z]?)(?:\s*|$)/i);
  if (lastNumberMatch) {
    const [_, street, building] = lastNumberMatch;
    return {
      street: street.trim(),
      building: building.trim(),
      unit: null
    };
  }

  // Jeśli nie znaleziono żadnego numeru, zwróć cały tekst jako nazwę ulicy
  return {
    street: withoutPrefix,
    building: null,
    unit: null
  };
}

// Funkcja do wzbogacania pól adresowych
export function enrichAddressFields(
  mainFields: {
    street?: FieldWithConfidence;
    building?: FieldWithConfidence;
    unit?: FieldWithConfidence;
    postalCode?: FieldWithConfidence;
    city?: FieldWithConfidence;
  } | undefined,
  correspondenceFields: {
    street?: FieldWithConfidence;
    building?: FieldWithConfidence;
    unit?: FieldWithConfidence;
    postalCode?: FieldWithConfidence;
    city?: FieldWithConfidence;
  } | undefined,
  deliveryFields: {
    street?: FieldWithConfidence;
    building?: FieldWithConfidence;
    unit?: FieldWithConfidence;
    postalCode?: FieldWithConfidence;
    city?: FieldWithConfidence;
    fullAddress?: FieldWithConfidence;
  } | undefined,
  options: {
    mainWeight?: number;
    correspondenceWeight?: number;
    deliveryWeight?: number;
    confidenceThreshold?: number;
  } = {}
): {
  street?: FieldWithConfidence;
  building?: FieldWithConfidence;
  unit?: FieldWithConfidence;
  postalCode?: FieldWithConfidence;
  city?: FieldWithConfidence;
} {
  const {
    mainWeight = 1,
    correspondenceWeight = 0.8,
    deliveryWeight = 0.8,
    confidenceThreshold = 0.3
  } = options;

  // Jeśli mamy pełny adres w jednym polu, rozdziel go
  let splitDeliveryAddress = undefined;
  if (deliveryFields?.fullAddress?.content) {
    const { street, building, unit } = splitAddressLine(deliveryFields.fullAddress.content);
    if (street) {
      splitDeliveryAddress = {
        street: { content: street, confidence: deliveryFields.fullAddress.confidence },
        building: building ? { content: building, confidence: deliveryFields.fullAddress.confidence } : undefined,
        unit: unit ? { content: unit, confidence: deliveryFields.fullAddress.confidence } : undefined
      };
    }
  }

  // Wzbogać ulicę
  const enrichedStreet = mergeFieldsWithConfidence([
    { field: mainFields?.street, weight: mainWeight },
    { field: correspondenceFields?.street, weight: correspondenceWeight },
    { field: deliveryFields?.street || splitDeliveryAddress?.street, weight: deliveryWeight }
  ], { confidenceThreshold });

  // Wzbogać numer budynku
  const enrichedBuilding = mergeFieldsWithConfidence([
    { field: mainFields?.building, weight: mainWeight },
    { field: correspondenceFields?.building, weight: correspondenceWeight },
    { field: deliveryFields?.building || splitDeliveryAddress?.building, weight: deliveryWeight }
  ], { confidenceThreshold });

  // Wzbogać numer lokalu
  const enrichedUnit = mergeFieldsWithConfidence([
    { field: mainFields?.unit, weight: mainWeight },
    { field: correspondenceFields?.unit, weight: correspondenceWeight },
    { field: deliveryFields?.unit || splitDeliveryAddress?.unit, weight: deliveryWeight }
  ], { confidenceThreshold });

  // Wzbogać kod pocztowy
  const enrichedPostalCode = mergeFieldsWithConfidence([
    { field: mainFields?.postalCode, weight: mainWeight },
    { field: correspondenceFields?.postalCode, weight: correspondenceWeight },
    { field: deliveryFields?.postalCode, weight: deliveryWeight }
  ], { confidenceThreshold });

  // Wzbogać miasto
  const enrichedCity = mergeFieldsWithConfidence([
    { field: mainFields?.city, weight: mainWeight },
    { field: correspondenceFields?.city, weight: correspondenceWeight },
    { field: deliveryFields?.city, weight: deliveryWeight }
  ], { confidenceThreshold });

  return {
    street: enrichedStreet,
    building: enrichedBuilding,
    unit: enrichedUnit,
    postalCode: enrichedPostalCode,
    city: enrichedCity
  };
}

// Funkcja do formatowania adresu
export function formatAddress(value: string | null): string | null {
  if (!value) return null;
  return value.replace(/,+$/, '').toUpperCase();
}

// Funkcja do formatowania kodu pocztowego
export function formatPostalCode(value: string | null): string | null {
  if (!value) return null;
  // Usuń wszystkie białe znaki i formatuj jako XX-XXX
  const cleaned = value.replace(/\s+/g, '');
  if (cleaned.length === 5) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  }
  return value;
}

// Funkcja do formatowania miasta
export function formatCity(value: string | null): string | null {
  if (!value) return null;
  return value.toUpperCase();
}

// Funkcja do formatowania województwa
export function formatProvince(value: string | null): string | null {
  if (!value) return null;
  return value.toUpperCase();
}

// Funkcja do formatowania ulicy
export function formatStreet(value: string | null): string | null {
  if (!value) return null;
  
  // Usuń potencjalne duplikaty oddzielone znakiem nowej linii
  const cleanedValue = value.split('\n')[0];
  
  // Usuń prefiksy ulicy
  const withoutPrefix = cleanedValue.replace(
    /^(?:UL|UL\.|ULICA|AL|AL\.|ALEJA|PL|PL\.|PLAC|RONDO|OS|OS\.|OSIEDLE)\b\s*/i,
    ''
  );
  
  console.log(`[formatStreet] Przetwarzanie ulicy:`, {
    input: value,
    afterCleaning: cleanedValue,
    afterRemovingPrefix: withoutPrefix,
    finalResult: withoutPrefix.toUpperCase()
  });
  
  return withoutPrefix.toUpperCase();
} 