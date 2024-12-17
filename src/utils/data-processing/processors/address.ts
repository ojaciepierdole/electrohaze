import { cleanText } from '@/utils/text-processing/core/normalization';
import { formatPostalCode, formatCity, normalizeAddressNumbers, formatStreet } from '@/utils/text-processing/formatters/address';
import type { AddressData } from '@/types/address';

export interface AddressParts {
  street: string | null;
  building: string | null;
  unit: string | null;
  city: string | null;
  postalCode: string | null;
}

/**
 * Wyodrębnia części adresu z tekstu
 */
export function extractAddressParts(address: string | undefined): AddressParts {
  if (!address) return { 
    street: null, 
    building: null, 
    unit: null, 
    city: null, 
    postalCode: null 
  };
  
  console.log('[extractAddressParts] Surowy adres:', address);
  
  // Najpierw wyczyść cały adres ze znaków specjalnych
  const cleanedAddress = cleanText(address, { debug: true });
  console.log('[extractAddressParts] Po wyczyszczeniu:', cleanedAddress);
  
  // Podziel adres na części (zakładamy format: ulica, kod pocztowy miasto)
  const parts = cleanedAddress.split(',').map(part => part.trim());
  console.log('[extractAddressParts] Części adresu:', parts);
  
  let street = null;
  let building = null;
  let unit = null;
  let postalCode = null;
  let city = null;
  
  // Pierwsza część to zawsze ulica z numerem
  if (parts[0]) {
    const streetPart = parts[0];
    // Wyodrębnij numer z ulicy
    const { building: extractedBuilding, unit: extractedUnit } = normalizeAddressNumbers(streetPart);
    building = extractedBuilding;
    unit = extractedUnit;
    
    // Usuń numer z nazwy ulicy
    street = formatStreet(streetPart);
  }
  
  // Druga część to kod pocztowy i miasto
  if (parts[1]) {
    const addressPart = parts[1];
    // Znajdź kod pocztowy
    const postalMatch = addressPart.match(/\d{2}[\s-]?\d{3}/);
    if (postalMatch) {
      postalCode = formatPostalCode(postalMatch[0]);
      // Miasto to wszystko po kodzie pocztowym
      const cityPart = addressPart.replace(postalMatch[0], '').trim();
      city = formatCity(cityPart);
    } else {
      // Jeśli nie ma kodu pocztowego, całość to miasto
      city = formatCity(addressPart);
    }
  }
  
  const result = {
    street,
    building,
    unit,
    city,
    postalCode
  };
  
  console.log('[extractAddressParts] Wynik:', result);
  return result;
}

/**
 * Łączy części adresu w jeden tekst
 */
export function joinAddressParts(parts: AddressParts): string {
  const addressParts: string[] = [];

  // Dodaj ulicę z numerem
  if (parts.street) {
    let streetPart = parts.street;
    if (parts.building) {
      streetPart += ` ${parts.building}`;
      if (parts.unit) {
        streetPart += ` ${parts.unit}`;
      }
    }
    addressParts.push(streetPart);
  }

  // Dodaj kod pocztowy i miasto
  if (parts.postalCode || parts.city) {
    let locationPart = '';
    if (parts.postalCode) {
      locationPart = parts.postalCode;
    }
    if (parts.city) {
      locationPart += locationPart ? ` ${parts.city}` : parts.city;
    }
    addressParts.push(locationPart);
  }

  return addressParts.join(', ');
}

/**
 * Przetwarza i wzbogaca dane adresowe
 */
export function processAddressData(rawAddress: string | undefined): AddressData {
  // Wyodrębnij podstawowe części adresu
  const parts = extractAddressParts(rawAddress);
  
  // Wzbogać dane o dodatkowe informacje
  return {
    raw: rawAddress || '',
    normalized: joinAddressParts(parts),
    parts: {
      street: parts.street || '',
      building: parts.building || '',
      unit: parts.unit || '',
      city: parts.city || '',
      postalCode: parts.postalCode || ''
    },
    metadata: {
      isComplete: Boolean(parts.street && parts.building && parts.city && parts.postalCode),
      hasUnit: Boolean(parts.unit),
      confidence: calculateAddressConfidence(parts)
    }
  };
}

/**
 * Oblicza pewność danych adresowych
 */
function calculateAddressConfidence(parts: AddressParts): number {
  let confidence = 0;
  let totalFields = 0;

  // Wymagane pola
  if (parts.street) { confidence += 0.3; totalFields += 1; }
  if (parts.building) { confidence += 0.2; totalFields += 1; }
  if (parts.city) { confidence += 0.3; totalFields += 1; }
  if (parts.postalCode) { confidence += 0.2; totalFields += 1; }

  // Opcjonalne pola
  if (parts.unit) { confidence += 0.1; totalFields += 1; }

  return totalFields > 0 ? confidence : 0;
} 