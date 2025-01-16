export function formatStreet(value: string): string {
  return value
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatPostalCode(value: string): string {
  // Usuń wszystkie znaki oprócz cyfr
  const digits = value.replace(/\D/g, '');
  
  // Jeśli mamy dokładnie 5 cyfr, sformatuj jako XX-XXX
  if (digits.length === 5) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  
  return value; // Zwróć oryginalną wartość jeśli nie pasuje do formatu
}

export function formatCity(value: string): string {
  return value.trim().charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function formatProvince(value: string): string {
  return value.trim().charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function formatTaxId(value: string): string {
  // Usuń wszystkie znaki oprócz cyfr
  return value.replace(/\D/g, '');
}

export function formatIBAN(value: string): string {
  // Usuń wszystkie białe znaki i sformatuj do PL + 26 cyfr
  const cleaned = value.replace(/\s/g, '').toUpperCase();
  if (cleaned.length === 28 && cleaned.startsWith('PL')) {
    return cleaned;
  }
  return value;
}

export function formatPhone(value: string): string {
  // Usuń wszystkie znaki oprócz cyfr
  const digits = value.replace(/\D/g, '');
  
  // Jeśli zaczyna się od 48, dodaj +
  if (digits.startsWith('48') && digits.length >= 9) {
    return `+${digits}`;
  }
  
  // Jeśli ma 9 cyfr, dodaj +48
  if (digits.length === 9) {
    return `+48${digits}`;
  }
  
  return value;
}

export function formatUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.toString();
  } catch {
    // Jeśli URL jest niepoprawny, spróbuj dodać protokół
    if (!value.startsWith('http')) {
      return formatUrl(`https://${value}`);
    }
    return value;
  }
}

export function formatFieldValue(fieldName: string, value: string): string {
  // Usuń nadmiarowe białe znaki
  const trimmed = value.trim();
  
  // Sprawdź typ pola po nazwie
  if (fieldName.toLowerCase().includes('street')) {
    return formatStreet(trimmed);
  }
  
  if (fieldName.toLowerCase().includes('postalcode')) {
    return formatPostalCode(trimmed);
  }
  
  if (fieldName.toLowerCase().includes('city')) {
    return formatCity(trimmed);
  }
  
  if (fieldName.toLowerCase().includes('province')) {
    return formatProvince(trimmed);
  }
  
  if (fieldName.toLowerCase().includes('taxid')) {
    return formatTaxId(trimmed);
  }
  
  if (fieldName.toLowerCase().includes('iban') || fieldName.toLowerCase().includes('bankaccount')) {
    return formatIBAN(trimmed);
  }
  
  if (fieldName.toLowerCase().includes('phone')) {
    return formatPhone(trimmed);
  }
  
  if (fieldName.toLowerCase().includes('url') || fieldName.toLowerCase().includes('website')) {
    return formatUrl(trimmed);
  }
  
  return trimmed;
} 