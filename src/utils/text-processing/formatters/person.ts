import { TextProcessor } from '../../core/text-processor';

/**
 * Formatuje imię
 */
export function formatFirstName(firstName: string | null): string {
  return TextProcessor.format(firstName, 'name');
}

/**
 * Formatuje nazwisko
 */
export function formatLastName(lastName: string | null): string {
  return TextProcessor.format(lastName, 'name');
}

/**
 * Formatuje nazwę firmy
 */
export function formatBusinessName(businessName: string | null): string {
  return TextProcessor.format(businessName, 'name');
}

/**
 * Formatuje NIP
 */
export function formatTaxId(taxId: string | null): string {
  if (!taxId) return '';
  
  // Usuń wszystkie znaki oprócz cyfr
  const cleaned = TextProcessor.format(taxId, 'number');
  
  // NIP powinien mieć 10 cyfr
  if (cleaned.length !== 10) return cleaned;
  
  // Dodaj myślniki w odpowiednich miejscach (XXX-XXX-XX-XX)
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8)}`;
}

/**
 * Formatuje REGON
 */
export function formatRegon(regon: string | null): string {
  if (!regon) return '';
  
  // Usuń wszystkie znaki oprócz cyfr
  const cleaned = TextProcessor.format(regon, 'number');
  
  // REGON może mieć 9 lub 14 cyfr
  if (cleaned.length === 9) {
    // Format XXX-XXX-XXX
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  if (cleaned.length === 14) {
    // Format XXX-XXX-XX-XXXXX
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8)}`;
  }
  
  return cleaned;
}

/**
 * Formatuje PESEL
 */
export function formatPesel(pesel: string | null): string {
  if (!pesel) return '';
  
  // Usuń wszystkie znaki oprócz cyfr
  const cleaned = TextProcessor.format(pesel, 'number');
  
  // PESEL powinien mieć 11 cyfr
  if (cleaned.length !== 11) return cleaned;
  
  // Format XXXXXXXXXXX (bez myślników)
  return cleaned;
}

/**
 * Formatuje numer telefonu
 */
export function formatPhoneNumber(phone: string | null): string {
  if (!phone) return '';
  
  // Usuń wszystkie znaki oprócz cyfr
  const cleaned = TextProcessor.format(phone, 'number');
  
  // Jeśli numer zaczyna się od +48 lub 48, usuń to
  const number = cleaned.replace(/^(\+48|48)/, '');
  
  // Numer telefonu powinien mieć 9 cyfr
  if (number.length !== 9) return number;
  
  // Format XXX-XXX-XXX
  return `${number.slice(0, 3)}-${number.slice(3, 6)}-${number.slice(6)}`;
}

/**
 * Formatuje adres email
 */
export function formatEmail(email: string | null): string {
  if (!email) return '';
  
  // Wyczyść białe znaki
  return TextProcessor.normalize(email, {
    trimWhitespace: true,
    enforceCase: 'lower'
  });
}

/**
 * Formatuje numer konta bankowego
 */
export function formatBankAccount(account: string | null): string {
  if (!account) return '';
  
  // Usuń wszystkie znaki oprócz cyfr
  const cleaned = TextProcessor.format(account, 'number');
  
  // Numer konta powinien mieć 26 cyfr
  if (cleaned.length !== 26) return cleaned;
  
  // Format XX XXXX XXXX XXXX XXXX XXXX XXXX
  return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
}

/**
 * Formatuje tytuł osoby (np. Pan, Pani, mgr, dr)
 */
export function formatTitle(title: string | null): string {
  return TextProcessor.format(title, 'title');
} 