import type { AddressSet, AddressPrefix, AddressField } from '@/types/processing';
import { normalizeAndSplitAddressNumbers } from './address-helpers';
import { normalizeNameFields } from './name-helpers';

function getFieldWithPrefix(prefix: AddressPrefix, field: AddressField): keyof AddressSet {
  return `${prefix}${field}` as keyof AddressSet;
}

function areNamesMatching(
  set1: Partial<AddressSet>, 
  set2: Partial<AddressSet>, 
  prefix1: AddressPrefix, 
  prefix2: AddressPrefix
): boolean {
  const firstName1 = set1[getFieldWithPrefix(prefix1, 'FirstName')];
  const lastName1 = set1[getFieldWithPrefix(prefix1, 'LastName')];
  const firstName2 = set2[getFieldWithPrefix(prefix2, 'FirstName')];
  const lastName2 = set2[getFieldWithPrefix(prefix2, 'LastName')];

  if (!firstName1 || !lastName1 || !firstName2 || !lastName2) return false;

  // Normalizacja i porównanie
  const normalizeText = (text: string) => 
    text.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return normalizeText(firstName1) === normalizeText(firstName2) && 
         normalizeText(lastName1) === normalizeText(lastName2);
}

function areAddressesMatching(
  set1: Partial<AddressSet>, 
  set2: Partial<AddressSet>, 
  prefix1: AddressPrefix, 
  prefix2: AddressPrefix
): boolean {
  const street1 = set1[getFieldWithPrefix(prefix1, 'Street')];
  const building1 = set1[getFieldWithPrefix(prefix1, 'Building')];
  const city1 = set1[getFieldWithPrefix(prefix1, 'City')];
  const postalCode1 = set1[getFieldWithPrefix(prefix1, 'PostalCode')];

  const street2 = set2[getFieldWithPrefix(prefix2, 'Street')];
  const building2 = set2[getFieldWithPrefix(prefix2, 'Building')];
  const city2 = set2[getFieldWithPrefix(prefix2, 'City')];
  const postalCode2 = set2[getFieldWithPrefix(prefix2, 'PostalCode')];

  if (!street1 || !building1 || !city1 || !postalCode1 ||
      !street2 || !building2 || !city2 || !postalCode2) return false;

  const normalizeText = (text: string) => 
    text.toLowerCase().trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
      .replace(/\s+/g, ' ');

  return normalizeText(street1) === normalizeText(street2) &&
         normalizeText(building1) === normalizeText(building2) &&
         normalizeText(city1) === normalizeText(city2) &&
         normalizeText(postalCode1.replace(/[^0-9]/g, '')) === normalizeText(postalCode2.replace(/[^0-9]/g, ''));
}

export function enrichAddressData(data: AddressSet): AddressSet {
  let enriched = normalizeNameFields(data);
  enriched = normalizeAndSplitAddressNumbers(enriched);

  const prefixes = ['', 'pa', 'dp'] as const;
  const fields: AddressField[] = [
    'Title', 'FirstName', 'LastName',
    'Street', 'Building', 'Unit', 'City', 'PostalCode'
  ];
  
  for (let i = 0; i < prefixes.length; i++) {
    for (let j = i + 1; j < prefixes.length; j++) {
      const prefix1 = prefixes[i];
      const prefix2 = prefixes[j];
      
      const isNameMatch = areNamesMatching(enriched, enriched, prefix1, prefix2);
      const isAddressMatch = areAddressesMatching(enriched, enriched, prefix1, prefix2);

      if (isNameMatch || isAddressMatch) {
        for (const field of fields) {
          const field1 = getFieldWithPrefix(prefix1, field);
          const field2 = getFieldWithPrefix(prefix2, field);

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