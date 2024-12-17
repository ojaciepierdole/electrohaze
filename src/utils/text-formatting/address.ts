import type { FieldWithConfidence } from '@/types/processing';
import type { DocumentField } from '@/types/processing';
import { normalizeText } from '@/utils/data-processing/core/normalization';
import { type AddressComponents } from '@/types/fields';
import { mergeFieldsWithConfidence } from './person';
import { normalizeAddress } from '../data-processing/normalizers/address';

// Funkcja pomocnicza do konwersji DocumentField na string
function getFieldContent(field: DocumentField | undefined): string | null {
  return field?.content || null;
}

// Funkcja pomocnicza do konwersji DocumentField na FieldWithConfidence
function convertToFieldWithConfidence(field: DocumentField | undefined, source: string): FieldWithConfidence | undefined {
  if (!field || !field.content) return undefined;
  return {
    content: field.content,
    confidence: field.confidence,
    metadata: {
      fieldType: field.metadata?.fieldType || 'text',
      transformationType: field.metadata?.transformationType || 'initial',
      originalValue: field.metadata?.originalValue,
      source,
      ...field.metadata
    }
  };
}

// Funkcja pomocnicza do tworzenia nowego FieldWithConfidence
function createFieldWithConfidence(content: string, confidence: number, source: string): FieldWithConfidence {
  return {
    content,
    confidence,
    metadata: {
      fieldType: 'text',
      transformationType: 'initial',
      source
    }
  };
}

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
  const withoutPrefix = cleanedAddress.replace(/^(?:UL|UL\.|ULICA)\s+/i, '');

  // Typowe wzorce adresów w Polsce
  const patterns = [
    // Nazwa Ulicy 4C/29 (numer budynku z literą i lokalem)
    /^([^0-9]+?)\s+(\d+[A-Z]?)\/(\d+)$/i,
    
    // Nazwa Ulicy 123/45 (numer budynku z lokalem)
    /^([^0-9]+?)\s+(\d+)\/(\d+)$/i,
    
    // Nazwa Ulicy 123 m. 45 (numer budynku z mieszkaniem)
    /^([^0-9]+?)\s+(\d+[A-Z]?)\s+(?:m\.?|lok\.?|mieszk\.?|lokal)\s*(\d+[A-Z]?)$/i,
    
    // Nazwa Ulicy 4C (sam numer budynku z literą)
    /^([^0-9]+?)\s+(\d+[A-Z])$/i,
    
    // Nazwa Ulicy 123 (sam numer budynku)
    /^([^0-9]+?)\s+(\d+)$/i
  ];

  for (const pattern of patterns) {
    const match = withoutPrefix.match(pattern);
    if (match) {
      const [_, street, building, unit] = match;
      return {
        street: formatStreet(street.trim()),
        building: building.trim(),
        unit: unit ? unit.trim() : null
      };
    }
  }

  // Jeśli nie pasuje do żadnego wzorca, spróbuj znaleźć ostatnią grupę cyfr jako numer
  const lastNumberMatch = withoutPrefix.match(/^(.*?)\s+(\d+[A-Z]?)(?:\s*|$)/i);
  if (lastNumberMatch) {
    const [_, street, building] = lastNumberMatch;
    // Sprawdź czy numer budynku zawiera ukośnik
    if (building && building.includes('/')) {
      const [buildingNumber, unitNumber] = building.split('/');
      return {
        street: formatStreet(street.trim()),
        building: buildingNumber.trim(),
        unit: unitNumber.trim()
      };
    }
    return {
      street: formatStreet(street.trim()),
      building: building.trim(),
      unit: null
    };
  }

  // Jeśli nie znaleziono żadnego numeru, zwróć cały tekst jako nazwę ulicy
  return {
    street: formatStreet(withoutPrefix),
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

  // Normalizuj dane adresowe
  const normalizedMain = mainFields?.street ? 
    normalizeAddress(createFieldWithConfidence(mainFields.street.content, mainFields.street.confidence, 'main'), {}, 'supplier') :
    null;

  const normalizedCorrespondence = correspondenceFields?.street ?
    normalizeAddress(createFieldWithConfidence(correspondenceFields.street.content, correspondenceFields.street.confidence, 'correspondence'), {}, 'pa') :
    null;

  const normalizedDelivery = deliveryFields?.street ?
    normalizeAddress(createFieldWithConfidence(deliveryFields.street.content, deliveryFields.street.confidence, 'delivery'), {}, 'dp') :
    null;

  // Jeśli mamy pełny adres w jednym polu, rozdziel go
  let splitDeliveryAddress = undefined;
  if (deliveryFields?.fullAddress?.content) {
    const normalized = normalizeAddress(
      createFieldWithConfidence(deliveryFields.fullAddress.content, deliveryFields.fullAddress.confidence, 'fullAddress'),
      {},
      'dp'
    );
    
    if (normalized.dpStreet) {
      splitDeliveryAddress = {
        street: createFieldWithConfidence(normalized.dpStreet.content, deliveryFields.fullAddress.confidence, 'fullAddress'),
        building: normalized.dpBuilding ? createFieldWithConfidence(normalized.dpBuilding.content, deliveryFields.fullAddress.confidence, 'fullAddress') : undefined,
        unit: normalized.dpUnit ? createFieldWithConfidence(normalized.dpUnit.content, deliveryFields.fullAddress.confidence, 'fullAddress') : undefined
      };
    }
  }

  // Wzbogać ulicę
  const enrichedStreet = mergeFieldsWithConfidence([
    { field: normalizedMain?.dpStreet ? createFieldWithConfidence(normalizedMain.dpStreet.content, mainFields?.street?.confidence || 0, 'main') : undefined, weight: mainWeight },
    { field: normalizedCorrespondence?.paStreet ? createFieldWithConfidence(normalizedCorrespondence.paStreet.content, correspondenceFields?.street?.confidence || 0, 'correspondence') : undefined, weight: correspondenceWeight },
    { field: normalizedDelivery?.dpStreet ? createFieldWithConfidence(normalizedDelivery.dpStreet.content, deliveryFields?.street?.confidence || 0, 'delivery') : undefined, weight: deliveryWeight }
  ], { confidenceThreshold });

  // Wzbogać numer budynku
  const enrichedBuilding = mergeFieldsWithConfidence([
    { field: mainFields?.building ? convertToFieldWithConfidence(mainFields.building, 'main') : undefined, weight: mainWeight },
    { field: correspondenceFields?.building ? convertToFieldWithConfidence(correspondenceFields.building, 'correspondence') : undefined, weight: correspondenceWeight },
    { field: deliveryFields?.building ? convertToFieldWithConfidence(deliveryFields.building, 'delivery') : splitDeliveryAddress?.building, weight: deliveryWeight }
  ], { confidenceThreshold });

  // Wzbogać numer lokalu
  const enrichedUnit = mergeFieldsWithConfidence([
    { field: mainFields?.unit ? convertToFieldWithConfidence(mainFields.unit, 'main') : undefined, weight: mainWeight },
    { field: correspondenceFields?.unit ? convertToFieldWithConfidence(correspondenceFields.unit, 'correspondence') : undefined, weight: correspondenceWeight },
    { field: deliveryFields?.unit ? convertToFieldWithConfidence(deliveryFields.unit, 'delivery') : splitDeliveryAddress?.unit, weight: deliveryWeight }
  ], { confidenceThreshold });

  // Wzbogać kod pocztowy
  const enrichedPostalCode = mergeFieldsWithConfidence([
    { field: mainFields?.postalCode ? convertToFieldWithConfidence(mainFields.postalCode, 'main') : undefined, weight: mainWeight },
    { field: correspondenceFields?.postalCode ? convertToFieldWithConfidence(correspondenceFields.postalCode, 'correspondence') : undefined, weight: correspondenceWeight },
    { field: deliveryFields?.postalCode ? convertToFieldWithConfidence(deliveryFields.postalCode, 'delivery') : undefined, weight: deliveryWeight }
  ], { confidenceThreshold });

  // Wzbogać miasto
  const enrichedCity = mergeFieldsWithConfidence([
    { field: mainFields?.city ? convertToFieldWithConfidence(mainFields.city, 'main') : undefined, weight: mainWeight },
    { field: correspondenceFields?.city ? convertToFieldWithConfidence(correspondenceFields.city, 'correspondence') : undefined, weight: correspondenceWeight },
    { field: deliveryFields?.city ? convertToFieldWithConfidence(deliveryFields.city, 'delivery') : undefined, weight: deliveryWeight }
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
export function formatAddress(value: DocumentField | string | null): string | null {
  if (!value) return null;
  const content = typeof value === 'string' ? value : value.content;
  if (!content) return null;
  return normalizeText(content, { toUpper: true });
}

// Funkcja do formatowania kodu pocztowego
export function formatPostalCode(value: DocumentField | string | null): string | null {
  if (!value) return null;
  const content = typeof value === 'string' ? value : value.content;
  if (!content) return null;
  // Usuń wszystkie białe znaki i formatuj jako XX-XXX
  const cleaned = normalizeText(content, { removeSpecial: true });
  if (cleaned && cleaned.length === 5) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  }
  return content;
}

// Funkcja do formatowania miasta
export function formatCity(value: DocumentField | string | null): string | null {
  if (!value) return null;
  const content = typeof value === 'string' ? value : value.content;
  if (!content) return null;
  return normalizeText(content, { toUpper: true });
}

// Funkcja do formatowania województwa
export function formatProvince(value: DocumentField | string | null): string | null {
  if (!value) return null;
  const content = typeof value === 'string' ? value : value.content;
  if (!content) return null;
  return normalizeText(content, { toUpper: true });
}

// Funkcja do formatowania ulicy
export function formatStreet(value: DocumentField | string | null): string | null {
  if (!value) return null;
  const content = typeof value === 'string' ? value : value.content;
  if (!content) return null;
  
  // Usuń potencjalne duplikaty oddzielone znakiem nowej linii
  const cleanedValue = content.split('\n')[0];
  
  // Usuń prefiksy ulicy - dodajemy spację po prefiksie aby uniknąć usuwania części nazw
  const withoutPrefix = cleanedValue.replace(
    /^(?:UL|UL\.|ULICA|AL|AL\.|ALEJA|PL|PL\.|PLAC|RONDO|OS|OS\.|OSIEDLE)\s+/i,
    ''
  ).trim();
  
  return normalizeText(withoutPrefix, { toUpper: true });
}

// Funkcja do normalizacji adresu
export function normalizeAddressField(value: string | null): string | null {
  if (!value) return null;
  
  // Usuń nadmiarowe białe znaki i zamień na wielkie litery
  const normalized = normalizeText(value, { toUpper: true });
  if (!normalized) return null;
  
  // Usuń potencjalne duplikaty oddzielone znakiem nowej linii
  const cleanedValue = normalized.split('\n')[0];
  
  // Usuń prefiksy ulicy - dodajemy spację po prefiksie aby uniknąć usuwania części nazw
  const withoutPrefix = cleanedValue.replace(
    /^(?:UL|UL\.|ULICA|AL|AL\.|ALEJA|PL|PL\.|PLAC|RONDO|OS|OS\.|OSIEDLE)\s+/i,
    ''
  ).trim();
  
  return withoutPrefix;
}

// Funkcja do przetwarzania adresu dostawy
export function processDeliveryPointAddress(address: AddressComponents): FieldWithConfidence {
  const addressField = createFieldWithConfidence(
    [address.dpStreet, address.dpBuilding, address.dpUnit]
      .filter(Boolean)
      .join(' '),
    1,
    'delivery_point'
  );

  return {
    ...addressField,
    metadata: {
      ...addressField.metadata,
      fieldType: 'address',
      transformationType: 'normalization',
      source: 'delivery_point'
    }
  };
}

// Funkcja do przetwarzania adresu korespondencyjnego
export function processPostalAddress(address: AddressComponents): FieldWithConfidence {
  const addressField = createFieldWithConfidence(
    [address.paStreet, address.paBuilding, address.paUnit]
      .filter(Boolean)
      .join(' '),
    1,
    'postal_address'
  );

  return {
    ...addressField,
    metadata: {
      ...addressField.metadata,
      fieldType: 'address',
      transformationType: 'normalization',
      source: 'postal_address'
    }
  };
}

// Funkcja do przetwarzania adresu dostawcy
export function processSupplierAddress(address: AddressComponents): FieldWithConfidence {
  const addressField = createFieldWithConfidence(
    [address.supplierStreet, address.supplierBuilding, address.supplierUnit]
      .filter(Boolean)
      .join(' '),
    1,
    'supplier'
  );

  return {
    ...addressField,
    metadata: {
      ...addressField.metadata,
      fieldType: 'address',
      transformationType: 'normalization',
      source: 'supplier'
    }
  };
} 