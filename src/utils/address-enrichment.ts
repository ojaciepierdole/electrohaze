import type { AddressSet } from '@/types/processing';
import { normalizeAndSplitAddressNumbers } from './address-helpers';
import { normalizeNameFields } from './name-helpers';

function areNamesMatching(set1: Partial<AddressSet>, set2: Partial<AddressSet>, prefix1: string = '', prefix2: string = ''): boolean {
  const firstName1 = set1[`${prefix1}FirstName`];
  const lastName1 = set1[`${prefix1}LastName`];
  const firstName2 = set2[`${prefix2}FirstName`];
  const lastName2 = set2[`${prefix2}LastName`];

  if (!firstName1 || !lastName1 || !firstName2 || !lastName2) return false;

  // Normalizacja i porównanie
  const normalizeText = (text: string) => 
    text.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return normalizeText(firstName1) === normalizeText(firstName2) && 
         normalizeText(lastName1) === normalizeText(lastName2);
}

function areAddressesMatching(set1: Partial<AddressSet>, set2: Partial<AddressSet>, prefix1: string = '', prefix2: string = ''): boolean {
  const street1 = set1[`${prefix1}Street`];
  const building1 = set1[`${prefix1}Building`];
  const city1 = set1[`${prefix1}City`];
  const postalCode1 = set1[`${prefix1}PostalCode`];

  const street2 = set2[`${prefix2}Street`];
  const building2 = set2[`${prefix2}Building`];
  const city2 = set2[`${prefix2}City`];
  const postalCode2 = set2[`${prefix2}PostalCode`];

  if (!street1 || !building1 || !city1 || !postalCode1 ||
      !street2 || !building2 || !city2 || !postalCode2) return false;

  const normalizeText = (text: string) => 
    text.toLowerCase().trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .replace(/\s+/g, ' ');

  return normalizeText(street1) === normalizeText(street2) &&
         normalizeText(building1) === normalizeText(building2) &&
         normalizeText(city1) === normalizeText(city2) &&
         normalizeText(postalCode1.replace(/[^0-9]/g, '')) === normalizeText(postalCode2.replace(/[^0-9]/g, ''));
}

export function enrichAddressData(data: AddressSet): AddressSet {
  // Najpierw normalizujemy imiona i nazwiska
  let enriched = normalizeNameFields(data);

  // Następnie normalizujemy i rozdzielamy numery budynków i lokali
  enriched = normalizeAndSplitAddressNumbers(enriched);

  const prefixes = ['', 'pa', 'ppe'] as const;
  
  // Na końcu wykonujemy standardowe uzupełnianie danych
  for (let i = 0; i < prefixes.length; i++) {
    for (let j = i + 1; j < prefixes.length; j++) {
      const prefix1 = prefixes[i];
      const prefix2 = prefixes[j];
      
      const isNameMatch = areNamesMatching(enriched, enriched, prefix1, prefix2);
      const isAddressMatch = areAddressesMatching(enriched, enriched, prefix1, prefix2);

      if (isNameMatch || isAddressMatch) {
        const fieldsToCheck = [
          'Title', 'FirstName', 'LastName',
          'Street', 'Building', 'Unit', 'City', 'PostalCode'
        ] as const;

        for (const field of fieldsToCheck) {
          const field1 = `${prefix1}${field}` as keyof AddressSet;
          const field2 = `${prefix2}${field}` as keyof AddressSet;

          if (!enriched[field1] && enriched[field2]) {
            enriched[field1] = enriched[field2];
          } else if (!enriched[field2] && enriched[field1]) {
            enriched[field2] = enriched[field1];
          }
        }
      }
    }
  }

  return enriched;
} 